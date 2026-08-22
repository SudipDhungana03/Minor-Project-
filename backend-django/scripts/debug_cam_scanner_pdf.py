import os
import sys
from pathlib import Path
from io import BytesIO

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
sys.path.insert(0, ROOT)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from apps.analysis_engine.ml_adapters import ocr_engine
from apps.classroom.models import Submission

submission = Submission.objects.filter(file__icontains='CamScanner').first()
if not submission:
    raise SystemExit('No CamScanner submission found')

print('submission id:', submission.id)
print('student:', getattr(submission.student, 'username', None))
print('file name:', submission.file.name)
print('file path:', getattr(submission.file, 'path', None))
print('content len:', len(submission.content or ''))
print('cached len:', len(submission.extracted_text or ''))

source, use_bytes, ext = ocr_engine._get_file_bytes(submission.file)
print('source:', source)
print('use_bytes:', bool(use_bytes))
print('ext:', ext)

text = ocr_engine.extract_text_from_file(submission.file)
print('extract len:', len(text or ''))
print('extract preview:', repr((text or '')[:500]))

images = ocr_engine._load_pdf_images(source, use_bytes)
print('pdf pages:', len(images))
for idx, img in enumerate(images, start=1):
    print('-- page', idx, 'size', img.size, 'mode', img.mode)
    path = os.path.join(ROOT, 'tmp_page_%s.png' % idx)
    img.save(path)
    print('  saved image to', path)
    t = ocr_engine._run_tesseract(img)
    print('  tesseract len', len(t or ''))
    print('  tesseract preview:', repr((t or '')[:300]))
    try:
        to = ocr_engine._run_trocr(img)
    except Exception as exc:
        to = None
        print('  trocr failed', exc)
    print('  trocr len', len(to or ''))
    print('  trocr preview:', repr((to or '')[:300]))
    print('  best', repr(ocr_engine._choose_best_text(t, to)))
