from django.contrib.auth.hashers import check_password, make_password
from django.db import models


class User(models.Model):
    last_name = models.CharField(max_length=150)
    first_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=20, unique=True)
    password_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password_hash)

    @property
    def display_name(self):
        return f'{self.first_name} {self.last_name}'

    @property
    def initials(self):
        return f'{self.first_name[:1]}{self.last_name[:1]}'.upper()


class Video(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='videos')
    description = models.TextField()
    video_url = models.URLField(max_length=500)
    poster_url = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-id']


class VideoLike(models.Model):
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='video_likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['video', 'user'], name='unique_video_like')]


class VideoComment(models.Model):
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='video_comments')
    parent = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies'
    )
    content = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at', 'id']


class CommentLike(models.Model):
    comment = models.ForeignKey(VideoComment, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['comment', 'user'], name='unique_comment_like')]


class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_set')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers_set')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['follower', 'following'], name='unique_follow')]


class LiveFeaturedProduct(models.Model):
    """Produit mis en avant pendant le live (une seule ligne : le live en cours)."""

    product_id = models.CharField(max_length=100)
    name = models.CharField(max_length=200)
    price = models.PositiveIntegerField()
    currency = models.CharField(max_length=10, default='Ar')
    stock = models.PositiveIntegerField(default=0)
    seller_id = models.CharField(max_length=100, blank=True)
    seller_name = models.CharField(max_length=200, blank=True)
    image_url = models.URLField(max_length=500, blank=True)
    featured_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name='+')
    updated_at = models.DateTimeField(auto_now=True)

    def as_payload(self):
        return {
            'id': self.product_id,
            'name': self.name,
            'price': self.price,
            'currency': self.currency,
            'stock': self.stock,
            'sellerId': self.seller_id,
            'sellerName': self.seller_name,
            'image_url': self.image_url,
            'updated_at': self.updated_at.isoformat(),
        }
