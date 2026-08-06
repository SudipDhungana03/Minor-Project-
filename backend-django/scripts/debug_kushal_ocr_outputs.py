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
print('found', subs.count())
for s in subs:
    print('====== submission', s.id, s.file.name)
    print('file path', s.file.path)
    source, use_bytes, ext = ocr_engine._get_file_bytes(s.file)
    imgs = ocr_engine._load_pdf_images(source, use_bytes)
    for i, img in enumerate(imgs, start=1):
        print('--- page', i, 'size', img.size, 'mode', img.mode)
        for name, fn in [('tesseract', ocr_engine._run_tesseract), ('easyocr', ocr_engine._run_easyocr), ('trocr', ocr_engine._run_trocr), ('google', ocr_engine._run_google_vision)]:
            try:
                text = fn(img)
            except Exception as exc:
                text = f'ERROR: {exc}'
            print(f'[{name}] len={len(text or "")}')
            if text:
                print(text[:1200].replace('\n', '\n'))
                print('---')
    extracted = ocr_engine.extract_text_from_file(s.file)
    print('=== final extracted len', len(extracted or ''))
    print(extracted[:2000])
