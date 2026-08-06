import os
import sys
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from apps.classroom.models import Submission
from apps.analysis_engine.ml_adapters.ocr_engine import extract_text_from_file

for submission in Submission.objects.filter(file__isnull=False).order_by('id'):
    file_path = getattr(submission.file, 'path', None)
    print('submission id:', submission.id)
    print('student:', getattr(submission.student, 'username', None))
    print('file name:', submission.file.name)
    print('file path:', file_path)
    print('file exists:', os.path.exists(file_path) if file_path else False)
    print('content len:', len(submission.content or ''))
    print('cached extracted len:', len(submission.extracted_text or ''))
    extracted = extract_text_from_file(submission.file)
    print('extracted len:', len(extracted or ''))
    print('extracted preview:', repr((extracted or '')[:240]))
    print('-' * 80)
