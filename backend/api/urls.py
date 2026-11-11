from django.urls import path

from . import views

urlpatterns = [
    path('health', views.health_check),
    path('register', views.register),
    path('videos', views.video_list),
    path('videos/<int:video_id>', views.video_detail),
    path('videos/<int:video_id>/like', views.video_like),
    path('videos/<int:video_id>/comments', views.video_comments),
    path('comments/<int:comment_id>', views.comment_detail),
    path('comments/<int:comment_id>/like', views.comment_like),
    path('profiles/<str:phone_number>', views.profile_detail),
    path('profiles/<str:phone_number>/follow', views.profile_follow),
    path('live/resolve', views.live_resolve),
    path('live/product', views.live_product),
    path('live/start', views.live_start),
]
