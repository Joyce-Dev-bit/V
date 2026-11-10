from django.db.models import Count, Exists, OuterRef

from .models import CommentLike, Video, VideoComment, VideoLike


def author_payload(user, include_names=False):
    payload = {
        'phone_number': user.phone_number,
        'display_name': user.display_name,
        'initials': user.initials,
    }
    if include_names:
        payload['first_name'] = user.first_name
        payload['last_name'] = user.last_name
    return payload


def video_queryset(current_user):
    queryset = Video.objects.select_related('author').annotate(
        likes_count=Count('likes', distinct=True),
        comments_count=Count('comments', distinct=True),
    )
    if current_user is None:
        return queryset.annotate(liked_by_me=Exists(VideoLike.objects.none()))
    return queryset.annotate(
        liked_by_me=Exists(VideoLike.objects.filter(video=OuterRef('pk'), user=current_user))
    )


def video_payload(video):
    return {
        'id': video.id,
        'description': video.description,
        'video_url': video.video_url,
        'poster_url': video.poster_url,
        'created_at': video.created_at.isoformat(),
        'likes_count': video.likes_count,
        'comments_count': video.comments_count,
        'liked_by_me': bool(video.liked_by_me),
        'author': author_payload(video.author, include_names=True),
    }


def video_page(current_user, limit, cursor=None, author=None):
    queryset = video_queryset(current_user)
    if cursor is not None:
        queryset = queryset.filter(id__lt=cursor)
    if author is not None:
        queryset = queryset.filter(author=author)

    rows = list(queryset.order_by('-id')[: limit + 1])
    has_more = len(rows) > limit
    visible = rows[:limit]
    return {
        'items': [video_payload(video) for video in visible],
        'next_cursor': visible[-1].id if has_more and visible else None,
        'has_more': has_more,
    }


def comments_tree(video_id, current_user):
    queryset = (
        VideoComment.objects.filter(video_id=video_id)
        .select_related('user')
        .annotate(likes_count=Count('likes', distinct=True))
    )
    if current_user is None:
        queryset = queryset.annotate(liked_by_me=Exists(CommentLike.objects.none()))
    else:
        queryset = queryset.annotate(
            liked_by_me=Exists(CommentLike.objects.filter(comment=OuterRef('pk'), user=current_user))
        )

    items = {
        comment.id: {
            'id': comment.id,
            'video_id': comment.video_id,
            'parent_comment_id': comment.parent_id,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'likes_count': comment.likes_count,
            'liked_by_me': bool(comment.liked_by_me),
            'author': author_payload(comment.user),
            'replies': [],
        }
        for comment in queryset.order_by('created_at', 'id')
    }

    roots = []
    for comment in items.values():
        parent_id = comment['parent_comment_id']
        if parent_id in items:
            items[parent_id]['replies'].append(comment)
        else:
            roots.append(comment)
    return roots
