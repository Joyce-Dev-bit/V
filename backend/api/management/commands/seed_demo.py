from django.core.management.base import BaseCommand

from api.models import Follow, User, Video

DEMO_PASSWORD = 'demo12345'

DEMO_USERS = [
    ('R.', 'Mialy', '+261341234567'),
    ('R.', 'Tiana', '+261340011223'),
    ('K.', 'Anja', '+261330123456'),
    ('N.', 'Soa', '+261320098765'),
    ('T.', 'Hery', '+261340567890'),
]

DEMO_VIDEOS = [
    (
        '+261340011223',
        'Un aperçu du tressage en direct dans notre atelier. Chaque pièce est finie à la main.',
        'https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080_25fps.mp4',
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1100&q=85',
    ),
    (
        '+261330123456',
        'Nouveau vase en terre cuite, cuisson lente et teinte naturelle.',
        'https://videos.pexels.com/video-files/5532783/5532783-hd_1080_1920_30fps.mp4',
        'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1100&q=85',
    ),
    (
        '+261320098765',
        'Texture fondante au baobab, sans parfum ajouté, préparée en petite série.',
        'https://videos.pexels.com/video-files/6110058/6110058-hd_1080_1920_25fps.mp4',
        'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1100&q=85',
    ),
    (
        '+261340567890',
        'Test audio et confort: aperçu rapide de notre casque studio.',
        'https://videos.pexels.com/video-files/4488638/4488638-hd_1080_1920_25fps.mp4',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1100&q=85',
    ),
]


class Command(BaseCommand):
    help = 'Crée les comptes et vidéos de démonstration (mot de passe de démo : demo12345).'

    def handle(self, *args, **options):
        users = {}
        for last_name, first_name, phone in DEMO_USERS:
            user, created = User.objects.get_or_create(
                phone_number=phone, defaults={'last_name': last_name, 'first_name': first_name}
            )
            if created:
                user.set_password(DEMO_PASSWORD)
                user.save()
            users[phone] = user

        if not Video.objects.exists():
            for phone, description, video_url, poster_url in DEMO_VIDEOS:
                Video.objects.create(
                    author=users[phone], description=description, video_url=video_url, poster_url=poster_url
                )

        Follow.objects.get_or_create(follower=users['+261341234567'], following=users['+261340011223'])
        self.stdout.write(self.style.SUCCESS('Données de démonstration prêtes.'))
