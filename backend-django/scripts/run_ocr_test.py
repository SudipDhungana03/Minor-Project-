import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
sys.path.insert(0, ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from apps.classroom.models import Submission
from apps.analysis_engine.ml_adapters.ocr_engine import extract_text_from_file

# Try to find the submission used in the UI (id 13 fallback)
submission = Submission.objects.filter(id=13).first() or Submission.objects.filter(student__username='kushal01').order_by('-id').first()
if not submission:
    print('No submission found to test')
    raise SystemExit(1)

print('Testing submission:', submission.id, getattr(submission.file, 'name', None))
result = extract_text_from_file(submission.file, return_extraction_type=True)
if isinstance(result, tuple):
    text, ocr_like = result
else:
    text = result
    ocr_like = False

print('OCR-like extraction:', bool(ocr_like))
if not text:
    print('No text extracted')
else:
    print('Extracted text length:', len(text))
    print('Preview:\n', text[:1000])
    submission.extracted_text = text
    submission.save(update_fields=['extracted_text'])

# Also show cached extracted_text field
print('\nCached Submission.extracted_text length:', len(submission.extracted_text or ''))
print('Cached preview:\n', (submission.extracted_text or '')[:1000])

print('\n--- Running image-level OCR diagnostics ---')
from apps.analysis_engine.ml_adapters.ocr_engine import _get_file_bytes, _load_pdf_images, _run_easyocr, _run_tesseract, _extract_text_from_image

source, use_bytes, ext = _get_file_bytes(submission.file)
print('file ext', ext)
images = _load_pdf_images(source, use_bytes)
print('pages rendered:', len(images))
for i, img in enumerate(images):
    # save a debug copy for visual inspection
    try:
        dump = f"tmp_page_{i+1}.png"
        img.save(dump)
        print('wrote debug image', dump)
    except Exception as e:
        print('failed to write debug image', e)
    print(f'--- Page {i+1} ---')
    try:
        ttxt = _run_tesseract(img)
    except Exception as e:
        ttxt = None
        print('tesseract exception', e)
    try:
        etxt = _run_easyocr(img)
    except Exception as e:
        etxt = None
        print('easyocr exception', e)
    try:
        combined = _extract_text_from_image(img)
    except Exception as e:
        combined = None
        print('combined extractor exception', e)
    print('tesseract len', len(ttxt or ''))
    print('easyocr len', len(etxt or ''))
    print('combined len', len(combined or ''))
    print('tesseract preview:', (ttxt or '')[:400])
    print('easyocr preview:', (etxt or '')[:400])
    print('combined preview:', (combined or '')[:400])
