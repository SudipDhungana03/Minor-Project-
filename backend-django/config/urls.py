from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Reverted to your exact previous admin configuration
    path('admin/', admin.site.join if hasattr(admin.site, 'join') else admin.site.urls),

    # Authentication and Classroom routes
    path('api/', include('apps.authentication.urls')),
    path('api/classroom/', include('apps.classroom.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)