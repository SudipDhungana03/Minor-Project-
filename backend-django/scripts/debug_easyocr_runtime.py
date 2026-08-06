import os
import sys
from io import BytesIO

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
sys.path.insert(0, ROOT)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from apps.analysis_engine.ml_adapters import ocr_engine
from apps.classroom.models import Submission

print('python executable:', sys.executable)
print('cwd:', os.getcwd())
print('easyocr installed:', 'easyocr' in sys.modules or hasattr(ocr_engine, 'easyocr'))
print('easyocr attr:', getattr(ocr_engine, 'easyocr', None))
print('numpy attr:', getattr(ocr_engine, 'np', None))
try:
    import easyocr
    print('import easyocr ok', easyocr.__version__)
except Exception as exc:
    print('easyocr import failed', exc)
try:
    import numpy as np
    print('import numpy ok', np.__version__)
except Exception as exc:
    print('numpy import failed', exc)

submission = Submission.objects.filter(file__icontains='CamScanner').first()
if not submission:
    raise SystemExit('No CamScanner submission found')

print('submission id:', submission.id)
print('file name:', submission.file.name)
print('file path:', submission.file.path)
source, use_bytes, ext = ocr_engine._get_file_bytes(submission.file)
print('source:', source)
print('use_bytes:', bool(use_bytes))
print('ext:', ext)

images = ocr_engine._load_pdf_images(source, use_bytes)
print('pdf pages:', len(images))
for idx, img in enumerate(images, start=1):
    print('page', idx, 'size', img.size, 'mode', img.mode)
    img_path = os.path.join(ROOT, f'tmp_page_{idx}.png')
    img.save(img_path)
    print('saved', img_path)
    t = ocr_engine._run_tesseract(img)
    print('tesseract len', len(t or ''), repr((t or '')[:300]))
    try:
        to = ocr_engine._run_trocr(img)
    except Exception as exc:
        to = None
        print('trocr exception', exc)
    print('trocr len', len(to or ''), repr((to or '')[:300]))
    try:
        eo = ocr_engine._run_easyocr(img)
        print('easyocr len', len(eo or ''), repr((eo or '')[:300]))
    except Exception as exc:
        print('easyocr exception', exc)
    print('best text', repr(ocr_engine._choose_best_text(t, to, eo)))

text = ocr_engine.extract_text_from_file(submission.file)
print('extracted overall len', len(text or ''), repr((text or '')[:500]))
