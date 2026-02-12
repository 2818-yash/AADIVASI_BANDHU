from django.urls import re_path

from .consumers import SupportChatConsumer

websocket_urlpatterns = [
    re_path(r"ws/support-chat/$", SupportChatConsumer.as_asgi()),
]
