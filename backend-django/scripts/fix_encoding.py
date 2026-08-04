from pathlib import Path

path = Path(__file__).resolve().parent.parent / 'apps' / 'analysis_engine' / 'ml_adapters' / 'ocr_engine.py'
text = path.read_text(encoding='utf-8-sig')
path.write_text(text, encoding='utf-8')
print('fixed', path)
