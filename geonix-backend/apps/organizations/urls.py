from django.urls import path
from .views import CompanySignupView, CreateInviteView

urlpatterns = [
    path("company-signup/", CompanySignupView.as_view()),
    path("invites/create/", CreateInviteView.as_view()),
]