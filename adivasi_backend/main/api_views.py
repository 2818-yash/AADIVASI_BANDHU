from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from rest_framework.response import Response


# ======================
# REGISTER API
# ======================

@api_view(['POST'])
def register_api(request):

    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")

    if User.objects.filter(username=username).exists():

        return Response({
            "error": "Username exists"
        })

    User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    return Response({
        "status": "created"
    })


# ======================
# LOGIN API
# ======================

@api_view(['POST'])
def login_api(request):

    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user:

        login(request, user)

        return Response({
            "status": "success"
        })

    return Response({
        "error": "Invalid credentials"
    })
