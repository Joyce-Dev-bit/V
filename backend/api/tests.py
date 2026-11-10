from django.test import TestCase, override_settings

from .models import User

PHONE = '+261341234567'
OTHER = '+261340011223'


def make_user(first, last, phone, password='demo12345'):
    user = User(first_name=first, last_name=last, phone_number=phone)
    user.set_password(password)
    user.save()
    return user


@override_settings(PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
class ApiTests(TestCase):
    def setUp(self):
        self.me = make_user('Mialy', 'R.', PHONE)
        self.other = make_user('Tiana', 'R.', OTHER)
        from .models import Video

        self.video = Video.objects.create(
            author=self.other, description='Atelier', video_url='https://example.com/v.mp4'
        )

    def call(self, method, path, body=None, phone=PHONE):
        headers = {'HTTP_X_PHONE_NUMBER': phone} if phone else {}
        return getattr(self.client, method)(
            path, data=body, content_type='application/json', **headers
        )

    def test_health(self):
        self.assertEqual(self.client.get('/api/health').json()['status'], 'ok')

    def test_register_normalizes_phone_and_hashes_password(self):
        payload = {
            'last_name': 'K.', 'first_name': 'Anja', 'phone_number': '033 12 345 67',
            'password': 'motdepasse1', 'password_confirmation': 'motdepasse1',
        }
        response = self.call('post', '/api/register', payload, phone=None)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['phone_number'], '+261331234567')
        user = User.objects.get(phone_number=response.json()['phone_number'])
        self.assertNotIn('motdepasse1', user.password_hash)
        self.assertTrue(user.check_password('motdepasse1'))

    def test_register_rejects_duplicates_and_mismatch(self):
        payload = {
            'last_name': 'K.', 'first_name': 'Anja', 'phone_number': '+261341234567',
            'password': 'motdepasse1', 'password_confirmation': 'motdepasse1',
        }
        self.assertEqual(self.call('post', '/api/register', payload, phone=None).status_code, 409)
        payload.update(phone_number='+261339999999', password_confirmation='autre-chose')
        self.assertEqual(self.call('post', '/api/register', payload, phone=None).status_code, 422)

    def test_videos_are_public_but_likes_require_authentication(self):
        listing = self.call('get', '/api/videos?limit=100', phone=None).json()
        self.assertEqual(len(listing['items']), 1)
        self.assertFalse(listing['items'][0]['liked_by_me'])
        self.assertEqual(self.call('post', f'/api/videos/{self.video.id}/like', phone=None).status_code, 401)
        self.assertEqual(self.call('post', f'/api/videos/{self.video.id}/like', phone='+261300000000').status_code, 401)

    def test_like_is_idempotent_and_reversible(self):
        path = f'/api/videos/{self.video.id}/like'
        self.assertEqual(self.call('post', path).json()['likes_count'], 1)
        self.assertEqual(self.call('post', path).json()['likes_count'], 1)
        self.assertTrue(self.call('get', f'/api/videos/{self.video.id}').json()['liked_by_me'])
        self.assertEqual(self.call('delete', path).json(), {'status': 'ok', 'likes_count': 0, 'liked': False})
        self.assertEqual(self.call('post', '/api/videos/9999/like').status_code, 404)

    def test_comment_tree_likes_and_ownership(self):
        path = f'/api/videos/{self.video.id}/comments'
        root = self.call('post', path, {'content': ' Bravo '}).json()
        self.assertEqual(root['comments_count'], 1)
        root_id = root['items'][0]['id']
        self.assertEqual(root['items'][0]['content'], 'Bravo')

        reply = self.call('post', path, {'content': 'Merci', 'parent_comment_id': root_id}, phone=OTHER).json()
        self.assertEqual(reply['items'][0]['replies'][0]['content'], 'Merci')
        self.assertEqual(self.call('post', path, {'content': 'x', 'parent_comment_id': 999}).status_code, 400)
        self.assertEqual(self.call('post', path, {'content': '   '}).status_code, 422)
        self.assertEqual(self.call('post', path, {'content': 'a' * 501}).status_code, 422)

        liked = self.call('post', f'/api/comments/{root_id}/like').json()
        self.assertTrue(liked['items'][0]['liked_by_me'])
        self.assertEqual(liked['items'][0]['likes_count'], 1)

        self.assertEqual(self.call('delete', f'/api/comments/{root_id}', phone=OTHER).status_code, 403)
        deleted = self.call('delete', f'/api/comments/{root_id}').json()
        self.assertEqual(deleted['comments_count'], 0)

    def test_follow_and_profile(self):
        path = f'/api/profiles/{OTHER}/follow'
        self.assertEqual(self.call('post', path).json(), {'status': 'ok', 'is_following': True, 'followers_count': 1})
        profile = self.call('get', f'/api/profiles/{OTHER}').json()
        self.assertTrue(profile['is_following'])
        self.assertEqual(profile['stats'], {'videos': 1, 'followers': 1, 'following': 0})
        self.assertEqual(self.call('post', f'/api/profiles/{PHONE}/follow').status_code, 400)
        self.assertEqual(self.call('post', '/api/profiles/+261300000000/follow').status_code, 404)
        self.assertFalse(self.call('delete', path).json()['is_following'])

    def test_cors_only_allows_configured_origins(self):
        allowed = self.client.options(
            '/api/videos', HTTP_ORIGIN='http://127.0.0.1:5173', HTTP_ACCESS_CONTROL_REQUEST_METHOD='GET'
        )
        self.assertEqual(allowed['Access-Control-Allow-Origin'], 'http://127.0.0.1:5173')
        self.assertIn('X-Phone-Number', allowed['Access-Control-Allow-Headers'])
        denied = self.client.get('/api/health', HTTP_ORIGIN='https://evil.example')
        self.assertNotIn('Access-Control-Allow-Origin', denied)
