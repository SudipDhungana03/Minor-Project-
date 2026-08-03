from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve as static_serve
from django.views.decorators.clickjacking import xframe_options_exempt

urlpatterns = [
    # Reverted to your exact previous admin configuration
    path('admin/', admin.site.join if hasattr(admin.site, 'join') else admin.site.urls),

    # Authentication and Classroom routes
    path('api/', include('apps.authentication.urls')),
    path('api/', include('apps.analysis_engine.urls')),
    path('api/classroom/', include('apps.classroom.urls')),
]

if settings.DEBUG:
    # Serve media files via a small view exempted from X-Frame-Options so
    # the frontend (different dev origin) can embed PDFs during development.
    @xframe_options_exempt
    def media_serve(request, path):
        return static_serve(request, path, document_root=settings.MEDIA_ROOT)

    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', media_serve),
    ]