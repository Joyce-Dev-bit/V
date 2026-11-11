import json
from functools import wraps

from django.db import IntegrityError, transaction
from django.http import JsonResponse

from .models import CommentLike, Follow, User, Video, VideoComment, VideoLike
from .phone import ApiError, normalize_phone_number, normalize_phone_or_error
from .serializers import comments_tree, video_page, video_payload, video_queryset

PHONE_HEADER = 'X-Phone-Number'


def api_view(*methods):
    def decorator(view):
        @wraps(view)
        def wrapper(request, *args, **kwargs):
            if request.method not in methods:
                response = JsonResponse({'detail': 'Méthode non autorisée.'}, status=405)
                response['Allow'] = ', '.join(methods)
                return response
            try:
                return view(request, *args, **kwargs)
            except ApiError as error:
                return JsonResponse({'detail': error.detail}, status=error.status)

        return wrapper

    return decorator


def read_json(request):
    try:
        data = json.loads(request.body or b'{}')
    except (ValueError, UnicodeDecodeError) as error:
        raise ApiError(422, 'Corps JSON invalide.') from error
    if not isinstance(data, dict):
        raise ApiError(422, 'Corps JSON invalide.')
    return data


def required_text(data, field, min_length=1, max_length=None):
    value = data.get(field)
    if not isinstance(value, str) or len(value.strip()) < min_length:
        raise ApiError(422, 'Ce champ est obligatoire.' if min_length == 1 else f'Le champ {field} est invalide.')
    value = value.strip()
    if max_length is not None and len(value) > max_length:
        raise ApiError(422, f'Le champ {field} est trop long.')
    return value


def optional_current_user(request):
    phone = request.headers.get(PHONE_HEADER)
    if not phone:
        return None
    return User.objects.filter(phone_number=normalize_phone_or_error(phone)).first()


def authenticated_user(request):
    phone = request.headers.get(PHONE_HEADER)
    if not phone:
        raise ApiError(401, f'Authentification requise (en-tête {PHONE_HEADER} manquant).')
    normalized = normalize_phone_or_error(phone, status=401)
    user = User.objects.filter(phone_number=normalized).first()
    if user is None:
        raise ApiError(401, f'Compte introuvable pour {normalized}.')
    return user


def video_or_404(video_id):
    video = Video.objects.filter(pk=video_id).first()
    if video is None:
        raise ApiError(404, 'Vidéo introuvable.')
    return video


@api_view('GET')
def health_check(request):
    return JsonResponse({'status': 'ok', 'message': 'Backend Django prêt'})


@api_view('POST')
def register(request):
    data = read_json(request)
    last_name = required_text(data, 'last_name')
    first_name = required_text(data, 'first_name')
    raw_phone = data.get('phone_number')
    password = data.get('password')
    confirmation = data.get('password_confirmation')

    if not isinstance(raw_phone, str) or len(raw_phone) < 8:
        raise ApiError(422, 'Le numéro de téléphone est invalide.')
    phone = normalize_phone_or_error(raw_phone, status=422)
    if not isinstance(password, str) or len(password) < 8 or not isinstance(confirmation, str):
        raise ApiError(422, 'Le mot de passe doit contenir au moins 8 caractères.')
    if password != confirmation:
        raise ApiError(422, 'Les mots de passe ne correspondent pas.')

    conflict = ApiError(409, f'Un compte existe déjà avec ce numéro: {phone}')
    if User.objects.filter(phone_number=phone).exists():
        raise conflict

    user = User(last_name=last_name, first_name=first_name, phone_number=phone)
    user.set_password(password)
    try:
        with transaction.atomic():
            user.save()
    except IntegrityError as error:
        raise conflict from error

    return JsonResponse({'status': 'ok', 'message': 'Compte créé avec succès.', 'phone_number': phone})


@api_view('GET')
def video_list(request):
    try:
        limit = int(request.GET.get('limit', 6))
        cursor = request.GET.get('cursor')
        cursor = int(cursor) if cursor not in (None, '') else None
    except ValueError as error:
        raise ApiError(422, 'Paramètres de pagination invalides.') from error

    current_user = optional_current_user(request)
    return JsonResponse(video_page(current_user, max(1, min(limit, 15)), cursor))


@api_view('GET')
def video_detail(request, video_id):
    current_user = optional_current_user(request)
    video = video_queryset(current_user).filter(pk=video_id).first()
    if video is None:
        raise ApiError(404, 'Vidéo introuvable.')

    payload = video_payload(video)
    payload['feed_preview'] = video_page(current_user, 1)
    return JsonResponse(payload)


def like_count_response(video_id, liked):
    return JsonResponse(
        {'status': 'ok', 'likes_count': VideoLike.objects.filter(video_id=video_id).count(), 'liked': liked}
    )


@api_view('POST', 'DELETE')
def video_like(request, video_id):
    user = authenticated_user(request)
    if request.method == 'POST':
        video_or_404(video_id)
        VideoLike.objects.get_or_create(video_id=video_id, user=user)
        return like_count_response(video_id, True)

    VideoLike.objects.filter(video_id=video_id, user=user).delete()
    return like_count_response(video_id, False)


@api_view('GET', 'POST')
def video_comments(request, video_id):
    if request.method == 'GET':
        current_user = optional_current_user(request)
        video_or_404(video_id)
        items = comments_tree(video_id, current_user)
        return JsonResponse({'items': items, 'count': len(items)})

    user = authenticated_user(request)
    video_or_404(video_id)
    data = read_json(request)
    content = required_text(data, 'content', max_length=500)

    parent_id = data.get('parent_comment_id')
    if parent_id is not None:
        if isinstance(parent_id, bool) or not isinstance(parent_id, int) or parent_id < 1:
            raise ApiError(422, 'Commentaire parent invalide.')
        if not VideoComment.objects.filter(pk=parent_id, video_id=video_id).exists():
            raise ApiError(400, 'Commentaire parent invalide.')

    VideoComment.objects.create(video_id=video_id, user=user, parent_id=parent_id, content=content)
    return JsonResponse(
        {
            'status': 'ok',
            'items': comments_tree(video_id, user),
            'comments_count': VideoComment.objects.filter(video_id=video_id).count(),
        }
    )


@api_view('DELETE')
def comment_detail(request, comment_id):
    user = authenticated_user(request)
    comment = VideoComment.objects.filter(pk=comment_id).first()
    if comment is None:
        raise ApiError(404, 'Commentaire introuvable.')
    if comment.user_id != user.id:
        raise ApiError(403, 'Suppression non autorisée.')

    video_id = comment.video_id
    comment.delete()
    return JsonResponse(
        {
            'status': 'ok',
            'items': comments_tree(video_id, user),
            'comments_count': VideoComment.objects.filter(video_id=video_id).count(),
            'video_id': video_id,
        }
    )


@api_view('POST', 'DELETE')
def comment_like(request, comment_id):
    user = authenticated_user(request)
    comment = VideoComment.objects.filter(pk=comment_id).first()
    if comment is None:
        raise ApiError(404, 'Commentaire introuvable.')

    if request.method == 'POST':
        CommentLike.objects.get_or_create(comment=comment, user=user)
    else:
        CommentLike.objects.filter(comment=comment, user=user).delete()

    return JsonResponse(
        {
            'status': 'ok',
            'liked': request.method == 'POST',
            'items': comments_tree(comment.video_id, user),
        }
    )


@api_view('GET')
def profile_detail(request, phone_number):
    target_phone = normalize_phone_or_error(phone_number)
    current_user = optional_current_user(request)
    target = User.objects.filter(phone_number=target_phone).first()
    if target is None:
        raise ApiError(404, 'Profil introuvable.')

    is_following = bool(
        current_user
        and current_user.id != target.id
        and Follow.objects.filter(follower=current_user, following=target).exists()
    )
    return JsonResponse(
        {
            'phone_number': target.phone_number,
            'first_name': target.first_name,
            'last_name': target.last_name,
            'display_name': target.display_name,
            'initials': target.initials,
            'bio': 'Membre de V · publications vidéo en direct du terrain.',
            'stats': {
                'videos': target.videos.count(),
                'followers': Follow.objects.filter(following=target).count(),
                'following': Follow.objects.filter(follower=target).count(),
            },
            'is_following': is_following,
            'videos': video_page(current_user, 18, author=target)['items'],
        }
    )


@api_view('POST', 'DELETE')
def profile_follow(request, phone_number):
    target_phone = normalize_phone_or_error(phone_number)
    user = authenticated_user(request)

    if request.method == 'POST':
        if user.phone_number == target_phone:
            raise ApiError(400, 'Vous ne pouvez pas vous suivre vous-même.')
        target = User.objects.filter(phone_number=target_phone).first()
        if target is None:
            raise ApiError(404, 'Profil introuvable.')
        Follow.objects.get_or_create(follower=user, following=target)
    else:
        Follow.objects.filter(follower=user, following__phone_number=target_phone).delete()

    return JsonResponse(
        {
            'status': 'ok',
            'is_following': request.method == 'POST',
            'followers_count': Follow.objects.filter(following__phone_number=target_phone).count(),
        }
    )


@api_view('POST')
def live_resolve(request):
    from .live import owncast_live_payload

    # On accepte un body vide pour simplifier l'appel frontend.
    if request.body:
        read_json(request)

    return JsonResponse({'status': 'ok', **owncast_live_payload()})
