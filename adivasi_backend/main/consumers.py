# import json
# from channels.generic.websocket import WebsocketConsumer
# from django.contrib.auth.models import User
# from asgiref.sync import async_to_sync
# from .models import SupportMessage


# class SupportChatConsumer(WebsocketConsumer):

#     def connect(self):
#         user = self.scope["user"]

#         if not user.is_authenticated:
#             self.close()
#             return

#         self.user = user
#         self.user_room = f"user_chat_{user.id}"
#         self.admin_room = "admin_support_chat"

#         async_to_sync(self.channel_layer.group_add)(
#             self.user_room,
#             self.channel_name
#         )

#         if user.is_superuser:
#             async_to_sync(self.channel_layer.group_add)(
#                 self.admin_room,
#                 self.channel_name
#             )

#         self.accept()

#         # 🔹 SEND USER LIST TO ADMIN
#         if user.is_superuser:
#             users = User.objects.filter(
#                 support_sent__receiver=user
#             ).distinct()

#             for u in users:
#                 self.send(text_data=json.dumps({
#                     "type": "user_list",
#                     "user_id": u.id,
#                     "username": u.username
#                 }))

#     def disconnect(self, close_code):
#         async_to_sync(self.channel_layer.group_discard)(
#             self.user_room,
#             self.channel_name
#         )
#         if self.user.is_superuser:
#             async_to_sync(self.channel_layer.group_discard)(
#                 self.admin_room,
#                 self.channel_name
#             )

#     def receive(self, text_data):
#         data = json.loads(text_data)
#         sender = self.user

#         admin = User.objects.filter(is_superuser=True).first()
#         if not admin:
#             return

#         # ===================================
#         # 🔥 ADMIN REQUESTS CHAT HISTORY
#         # ===================================
#         if data.get("type") == "load_history" and sender.is_superuser:
#             user_id = data.get("user_id")
#             target_user = User.objects.get(id=user_id)

#             # 🔥 MARK MESSAGES AS READ
#             SupportMessage.objects.filter(
#                 sender=target_user,
#                 receiver=sender,
#                 is_read=False
#             ).update(is_read=True)

#             messages = SupportMessage.objects.filter(
#                 sender__in=[sender, target_user],
#                 receiver__in=[sender, target_user]
#             ).order_by("created_at")

#             for msg in messages:
#                 self.send(text_data=json.dumps({
#                     "type": "chat_message",
#                     "sender": msg.sender.username,
#                     "message": msg.message,
#                     "is_admin": msg.sender.is_superuser,
#                     "from_user_id": msg.sender.id
#                 }))
#             return

#         # ===================================
#         # 🔹 NORMAL MESSAGE FLOW
#         # ===================================
#         message = data.get("message")
#         if not message:
#             return

#         # 🔹 DETERMINE RECEIVER
#         if sender.is_superuser:
#             receiver_id = data.get("to_user_id")
#             if not receiver_id:
#                 return
#             receiver = User.objects.get(id=receiver_id)
#         else:
#             receiver = admin

#         # 🔥 SAVE MESSAGE (UNREAD BY DEFAULT)
#         SupportMessage.objects.create(
#             sender=sender,
#             receiver=receiver,
#             message=message,
#             is_read=False
#         )

#         payload = {
#             "type": "chat_message",
#             "sender": sender.username,
#             "message": message,
#             "from_user_id": sender.id,
#             "is_admin": sender.is_superuser
#         }

#         # 🔹 SEND BACK TO SENDER (always)
#         async_to_sync(self.channel_layer.group_send)(
#             f"user_chat_{sender.id}",
#             payload
#         )

#         # 🔹 USER → ADMIN
#         if not sender.is_superuser:
#             async_to_sync(self.channel_layer.group_send)(
#                 self.admin_room,
#                 payload
#             )

#         # 🔹 ADMIN → USER
#         else:
#             async_to_sync(self.channel_layer.group_send)(
#                 f"user_chat_{receiver.id}",
#                 payload
#             )

#     def chat_message(self, event):
#         self.send(text_data=json.dumps(event))



import json
from channels.generic.websocket import WebsocketConsumer
from django.contrib.auth.models import User
from asgiref.sync import async_to_sync
from .models import SupportMessage
from django.db.models import Count


class SupportChatConsumer(WebsocketConsumer):

    def connect(self):
        user = self.scope["user"]

        if not user.is_authenticated:
            self.close()
            return

        self.user = user
        self.user_room = f"user_chat_{user.id}"
        self.admin_room = "admin_support_chat"

        async_to_sync(self.channel_layer.group_add)(
            self.user_room,
            self.channel_name
        )

        if user.is_superuser:
            async_to_sync(self.channel_layer.group_add)(
                self.admin_room,
                self.channel_name
            )

        self.accept()

        if user.is_superuser:
            # Send current unread summary to this admin on connect
            summary = self.get_unread_summary()
            self.send(text_data=json.dumps(summary))

            # Send known users who have messaged before
            users = User.objects.filter(
                support_sent__receiver=user
            ).distinct()

            for u in users:
                self.send(text_data=json.dumps({
                    "type": "user_list",
                    "user_id": u.id,
                    "username": u.username
                }))

    def get_unread_summary(self):
        unread_per_user = (
            SupportMessage.objects
            .filter(receiver__is_superuser=True, is_read=False)
            .values('sender_id')
            .annotate(count=Count('id'))
        )

        per_user = {str(item['sender_id']): item['count'] for item in unread_per_user}
        total = sum(per_user.values())

        return {
            "type": "unread_summary",
            "per_user": per_user,
            "total": total
        }

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.user_room,
            self.channel_name
        )
        if self.user.is_superuser:
            async_to_sync(self.channel_layer.group_discard)(
                self.admin_room,
                self.channel_name
            )

    def receive(self, text_data):
        data = json.loads(text_data)
        sender = self.user

        admin = User.objects.filter(is_superuser=True).first()
        if not admin:
            return

        # Admin requests chat history for a specific user
        if data.get("type") == "load_history" and sender.is_superuser:
            user_id = data.get("user_id")
            target_user = User.objects.get(id=user_id)

            # Mark messages as read
            SupportMessage.objects.filter(
                sender=target_user,
                receiver=sender,
                is_read=False
            ).update(is_read=True)

            messages = SupportMessage.objects.filter(
                sender__in=[sender, target_user],
                receiver__in=[sender, target_user]
            ).order_by("created_at")

            for msg in messages:
                self.send(text_data=json.dumps({
                    "type": "chat_message",
                    "sender": msg.sender.username,
                    "message": msg.message,
                    "is_admin": msg.sender.is_superuser,
                    "from_user_id": msg.sender.id
                }))

            # Broadcast updated total unread count to all admins after marking read
            async_to_sync(self.channel_layer.group_send)(
                self.admin_room,
                {
                    "type": "unread_count_update",
                    "total_unread": SupportMessage.objects.filter(
                        receiver__is_superuser=True,
                        is_read=False
                    ).count()
                }
            )
            return

        # Normal message sending
        message = data.get("message")
        if not message:
            return

        # Determine receiver
        if sender.is_superuser:
            receiver_id = data.get("to_user_id")
            if not receiver_id:
                return
            receiver = User.objects.get(id=receiver_id)
        else:
            receiver = admin

        # Save message
        SupportMessage.objects.create(
            sender=sender,
            receiver=receiver,
            message=message,
            is_read=False
        )

        payload = {
            "type": "chat_message",
            "sender": sender.username,
            "message": message,
            "from_user_id": sender.id,
            "is_admin": sender.is_superuser
        }

        # Echo back to sender
        async_to_sync(self.channel_layer.group_send)(
            f"user_chat_{sender.id}",
            payload
        )

        if not sender.is_superuser:
            # Forward to all admins
            async_to_sync(self.channel_layer.group_send)(
                self.admin_room,
                payload
            )
            # Also send updated total unread count to all admins
            async_to_sync(self.channel_layer.group_send)(
                self.admin_room,
                {
                    "type": "unread_count_update",
                    "total_unread": SupportMessage.objects.filter(
                        receiver__is_superuser=True,
                        is_read=False
                    ).count()
                }
            )
        else:
            # Admin → specific user
            async_to_sync(self.channel_layer.group_send)(
                f"user_chat_{receiver.id}",
                payload
            )

    # ─── Required handler for messages sent via group_send ───
    def chat_message(self, event):
        self.send(text_data=json.dumps(event))

    def unread_count_update(self, event):
        self.send(text_data=json.dumps(event))

    # Optional: if you ever broadcast the full summary to all admins
    def unread_summary(self, event):
        self.send(text_data=json.dumps(event))