from django.shortcuts import render, redirect
from .models import Contacts, HelpQuery
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
import json
import os
from django.http import JsonResponse
from django.conf import settings
from .models import Profile


# =========================
# PROTECTED PAGES
# =========================

def index(request):
    if not request.user.is_authenticated:
        return redirect("signin")
    return render(request, "pages/index.html")


def apply(request):
    if not request.user.is_authenticated:
        return redirect("signin")
    return render(request, "pages/apply.html")


def scheme(request):
    if not request.user.is_authenticated:
        return redirect("signin")
    return render(request, "pages/scheme.html")


def help_page(request):
    if not request.user.is_authenticated:
        return redirect("signin")

    if request.method == "POST":
        question = request.POST.get("question")
        file = request.FILES.get("fileUpload")

        HelpQuery.objects.create(
            user=request.user,
            question=question,
            file=file
        )

        messages.success(request, "Your query has been submitted successfully!")
        return redirect("help")

    return render(request, "pages/help.html")


def contact(request):
    if not request.user.is_authenticated:
        return redirect("signin")

    if request.method == "POST":
        name = request.POST.get("name")
        email = request.POST.get("email")
        subject = request.POST.get("subject")
        message = request.POST.get("message")

        Contacts.objects.create(
            name=name,
            email=email,
            subject=subject,
            message=message
        )

        return render(request, "pages/contact.html", {"success": True})

    return render(request, "pages/contact.html")


# =========================
# AUTH PAGES (NEW)
# =========================

def signin_page(request):
    if request.user.is_authenticated:
        return redirect("index")
    return render(request, "signin.html")


def signup_page(request):
    if request.user.is_authenticated:
        return redirect("index")
    return render(request, "signup.html")


# =========================
# AUTH ACTIONS (UNCHANGED LOGIC)
# =========================

def register_user(request):
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists")
            return redirect("signup")

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        user.save()

        # avatar logic (UNCHANGED)
        profile = Profile.objects.create(user=user)

        avatar_dir = os.path.join(settings.MEDIA_ROOT, "default_avatars")
        avatars = os.listdir(avatar_dir)

        if avatars:
            import random
            avatar_name = random.choice(avatars)
            avatar_path = os.path.join(avatar_dir, avatar_name)

            with open(avatar_path, "rb") as f:
                profile.profile_pic.save(avatar_name, f, save=True)

        messages.success(request, "Registration successful! Please login.")
        return redirect("signin")

    return redirect("signup")


def login_user(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect("index")
        else:
            messages.error(request, "Invalid username or password")
            return redirect("signin")

    return redirect("signin")


def logout_user(request):
    logout(request)
    return redirect("signin")


# =========================
# AVATAR UPDATE (UNCHANGED)
# =========================

def update_avatar(request):
    if request.method == "POST" and request.user.is_authenticated:
        data = json.loads(request.body)
        avatar_name = data.get("avatar")

        avatar_path = os.path.join(
            settings.MEDIA_ROOT,
            "default_avatars",
            avatar_name
        )

        if os.path.exists(avatar_path):
            profile = request.user.profile

            with open(avatar_path, "rb") as f:
                profile.profile_pic.save(avatar_name, f, save=True)

            return JsonResponse({"success": True})

    return JsonResponse({"success": False})
