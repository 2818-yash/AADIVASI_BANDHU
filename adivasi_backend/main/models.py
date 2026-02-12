from django.db import models
from django.contrib.auth.models import User


class Contacts(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=150)
    subject = models.CharField(max_length=200)
    message = models.TextField(null=True)

    def __str__(self):
        return self.name


# NEW MODEL FOR HELP / ASK QUESTION
class HelpQuery(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    question = models.TextField()
    file = models.FileField(upload_to="help_uploads/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.user:
            return f"Query from {self.user.username}"
        return "Query from guest user"





class SupportMessage(models.Model):
    sender = models.ForeignKey(
        User,
        related_name="support_sent",
        on_delete=models.CASCADE
    )
    receiver = models.ForeignKey(
        User,
        related_name="support_received",
        on_delete=models.CASCADE
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sender} → {self.receiver}"



from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    profile_pic = models.ImageField(
        upload_to="profile_pics/",
        blank=True,
        null=True
    )

    def __str__(self):
        return self.user.username
