import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        user = self.scope["user"]

        if user.is_anonymous:
            await self.close()
            return

        await self.accept()

        if user.is_staff:
            await self.channel_layer.group_add("admins", self.channel_name)
        else:
            await self.channel_layer.group_add("customers", self.channel_name)

    async def disconnect(self, close_code):
        user = self.scope["user"]

        if not user.is_anonymous:
            if user.is_staff:
                await self.channel_layer.group_discard("admins", self.channel_name)
            else:
                await self.channel_layer.group_discard("customers", self.channel_name)

    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "type": event.get("notification_type")
        }))
