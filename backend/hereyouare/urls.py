from django.urls import path

from . import views

urlpatterns = [
    path("email", view=views.email_lookup, name="email"),
    path("username", view=views.username_lookup, name="username"),
]
