import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
sys.path.insert(0, str(ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from apps.analysis_engine.ml_adapters import ocr_engine
from apps.classroom.models import Submission

subs = Submission.objects.filter(student__username='kushal01', file__isnull=False)
print('found submissions:', subs.count())
for s in subs:
    print('---')
    print('id:', s.id)
    print('student:', s.student.username)
    print('assignment:', s.assignment.title)
    print('file:', s.file.name)
    print('file path:', getattr(s.file, 'path', None))
    print('submitted_at:', s.submitted_at)
    print('cached extracted_text len:', len(s.extracted_text or ''))
    source, use_bytes, ext = ocr_engine._get_file_bytes(s.file)
    print('source:', source)
    print('use_bytes:', bool(use_bytes))
    print('ext:', ext)
    if ext == '.pdf':
        imgs = ocr_engine._load_pdf_images(source, use_bytes)
        print('pdf pages:', len(imgs))
        for idx, img in enumerate(imgs, start=1):
            print(' page', idx, 'size', img.size, 'mode', img.mode)
            print('  tesseract len:', len(ocr_engine._run_tesseract(img) or ''))
            print('  easyocr len:', len(ocr_engine._run_easyocr(img) or ''))
            try:
                trocr_text = ocr_engine._run_trocr(img)
                print('  trocr len:', len(trocr_text or ''))
            except Exception as exc:
                print('  trocr exception:', exc)
            google_text = ocr_engine._run_google_vision(img)
            print('  google len:', len(google_text or ''))
    extracted = ocr_engine.extract_text_from_file(s.file)
    print('extracted len:', len(extracted or ''))
    print('extracted preview:')
    print((extracted or '')[:2000])
