import os
import sys
import pathlib

# Automatically handles parent paths to prevent folder mismatch crashes
sys.path.append(str(pathlib.Path(__file__).resolve().parent.parent))

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()