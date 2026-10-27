from django.urls import path
from django.contrib.auth.views import LogoutView
from flow import views

urlpatterns = [
    path('login/', views.StaffLoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('', views.dashboard, name='dashboard'),
    path('register/', views.register, name='register'),
    path('queue/<slug:slug>/', views.queue, name='queue'),
    path('counter/<int:pk>/call/', views.call, name='call'),
    path('visit/<uuid:pk>/', views.detail, name='detail'),
    path('visit/<uuid:pk>/action/', views.transition, name='transition'),
    path('visit/<uuid:pk>/ticket/', views.ticket, name='ticket'),
    path('activity/', views.activity, name='activity'),
    path('display/<slug:slug>/', views.display, name='display'),
    path('api/display/<slug:slug>/', views.display_data, name='display-data'),
]
