from django.contrib import admin
from .models import Contacts, HelpQuery


@admin.register(Contacts)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'message')


@admin.register(HelpQuery)
class HelpQueryAdmin(admin.ModelAdmin):
    list_display = ('user', 'question', 'file', 'created_at')
    list_filter = ('created_at', 'user')
    search_fields = ('user__username', 'question')
