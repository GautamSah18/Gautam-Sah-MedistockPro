from django.urls import path
from . import views

urlpatterns = [
    # Registration flow
    path("register/step1/", views.registration_step1, name="registration_step1"),
    path("send-otp/", views.send_otp, name="send_otp"),
    path("verify-otp/", views.verify_otp, name="verify_otp"),
    path("register/step2/", views.registration_step2, name="registration_step2"),

    # Authentication
    path("login/", views.user_login, name="login"),
    path("logout/", views.logout_view, name="logout"),

    # User
    path("profile/", views.user_profile, name="user_profile"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("change-password/", views.change_password, name="change_password"),

    # Admin User Management
    path("admin/users/", views.admin_user_list, name="admin_user_list"),
    path("admin/users/<int:pk>/", views.admin_user_detail, name="admin_user_detail"),
]
