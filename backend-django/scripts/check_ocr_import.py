import os
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))
from apps.analysis_engine.ml_adapters.ocr_engine import extract_text_from_file
print('OCR module import OK', callable(extract_text_from_file))
print('ocr_engine bytes', Path(root / 'apps' / 'analysis_engine' / 'ml_adapters' / 'ocr_engine.py').read_bytes()[:4])
