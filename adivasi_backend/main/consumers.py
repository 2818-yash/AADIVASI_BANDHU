import json
from channels.generic.websocket import WebsocketConsumer
from django.contrib.auth.models import User
from asgiref.sync import async_to_sync
from django.db.models import Count
from .models import SupportMessage


class SupportChatConsumer(WebsocketConsumer):

    # ================= CONNECT =================
    def connect(self):

        user = self.scope["user"]

        print("\n🔌 SOCKET CONNECT ATTEMPT")

        if not user.is_authenticated:
            print("❌ Unauthenticated user tried to connect")
            self.close()
            return

        self.user = user
        self.user_room = f"user_chat_{user.id}"
        self.admin_room = "admin_support_chat"

        print(f"✅ Connected user: {user.username} | Admin: {user.is_superuser}")

        # Join personal room
        async_to_sync(self.channel_layer.group_add)(
            self.user_room,
            self.channel_name
        )

        # Join admin room
        if user.is_superuser:
            async_to_sync(self.channel_layer.group_add)(
                self.admin_room,
                self.channel_name
            )
            print("👑 Admin joined admin_support_chat room")

        self.accept()

        # Send unread summary to admin
        if user.is_superuser:

            summary = self.get_unread_summary()

            print("📊 Sending unread summary:", summary)

            self.send(text_data=json.dumps(summary))

            # Send all users list
            users = User.objects.exclude(is_superuser=True)

            for u in users:
                print(f"👤 Sending user list entry: {u.username}")

                self.send(text_data=json.dumps({
                    "type": "user_list",
                    "user_id": u.id,
                    "username": u.username
                }))

    # ================= UNREAD SUMMARY =================
    def get_unread_summary(self):

        unread_per_user = (
            SupportMessage.objects
            .filter(receiver__is_superuser=True, is_read=False)
            .values("sender_id")
            .annotate(count=Count("id"))
        )

        per_user = {
            str(item["sender_id"]): item["count"]
            for item in unread_per_user
        }

        total = sum(per_user.values())

        return {
            "type": "unread_summary",
            "per_user": per_user,
            "total": total
        }

    # ================= DISCONNECT =================
    def disconnect(self, close_code):

        print(f"❌ SOCKET DISCONNECTED: {self.user.username}")

        async_to_sync(self.channel_layer.group_discard)(
            self.user_room,
            self.channel_name
        )

        if self.user.is_superuser:
            async_to_sync(self.channel_layer.group_discard)(
                self.admin_room,
                self.channel_name
            )

    # ================= RECEIVE =================
    def receive(self, text_data):

        print("\n📩 MESSAGE RECEIVED:", text_data)

        data = json.loads(text_data)
        sender = self.user

        print(f"👤 Sender: {sender.username} | Admin: {sender.is_superuser}")

        # ================= LOAD HISTORY =================
        if data.get("type") == "load_history" and sender.is_superuser:

            user_id = data.get("user_id")

            print(f"📚 Admin loading history for user_id={user_id}")

            try:
                target_user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                print("❌ Target user not found")
                return

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

            print(f"📜 Found {messages.count()} messages in history")

            for msg in messages:

                self.send(text_data=json.dumps({
                    "type": "chat_message",
                    "message_id": msg.id,
                    "sender": msg.sender.username,
                    "message": msg.message,
                    "from_user_id": msg.sender.id,
                    "to_user_id": msg.receiver.id,
                    "is_admin": msg.sender.is_superuser,
                    "is_history": True
                }))

            # Update unread count
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

        # ================= NORMAL MESSAGE =================
        message = data.get("message")

        if not message:
            print("⚠️ Empty message ignored")
            return

        print(f"💬 Message content: {message}")

        # Determine receiver
        if sender.is_superuser:

            receiver_id = data.get("to_user_id")

            if not receiver_id:
                print("❌ No receiver id provided")
                return

            try:
                receiver = User.objects.get(id=receiver_id)
            except User.DoesNotExist:
                print("❌ Receiver user not found")
                return

            print(f"👑 Admin sending message to user_id={receiver.id}")

        else:

            receiver = User.objects.filter(is_superuser=True).first()

            if not receiver:
                print("❌ No admin found")
                return

            print(f"👤 User sending message to ADMIN GROUP")

        # Save message
        msg = SupportMessage.objects.create(
            sender=sender,
            receiver=receiver,
            message=message,
            is_read=False
        )

        print(f"💾 Message saved in DB id={msg.id}")

        payload = {
            "type": "chat_message",
            "message_id": msg.id,
            "sender": sender.username,
            "message": message,
            "from_user_id": sender.id,
            "to_user_id": receiver.id,
            "is_admin": sender.is_superuser
        }

        # ================= SEND TO SENDER =================
        print(f"📤 Sending to sender room: user_chat_{sender.id}")

        async_to_sync(self.channel_layer.group_send)(
            f"user_chat_{sender.id}",
            payload
        )

        # ================= ADMIN → USER =================
        if sender.is_superuser:

            print(f"📤 Sending admin message to user room: user_chat_{receiver.id}")

            async_to_sync(self.channel_layer.group_send)(
                f"user_chat_{receiver.id}",
                payload
            )

        # ================= USER → ADMIN GROUP =================
        else:

            print("📤 Broadcasting user message to admin_support_chat")

            async_to_sync(self.channel_layer.group_send)(
                self.admin_room,
                payload
            )

            unread_total = SupportMessage.objects.filter(
                receiver__is_superuser=True,
                is_read=False
            ).count()

            print(f"📊 Updating unread count: {unread_total}")

            async_to_sync(self.channel_layer.group_send)(
                self.admin_room,
                {
                    "type": "unread_count_update",
                    "total_unread": unread_total
                }
            )

    # ================= HANDLERS =================
    def chat_message(self, event):

        print("📨 Delivering chat_message to websocket:", event)

        self.send(text_data=json.dumps(event))


    def unread_count_update(self, event):

        print("🔔 Sending unread update:", event)

        self.send(text_data=json.dumps(event))


    def unread_summary(self, event):

        print("📊 Sending unread summary:", event)

        self.send(text_data=json.dumps(event))