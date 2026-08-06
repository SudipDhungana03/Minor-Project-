import os
import sys
import subprocess
from PIL import Image

try:
    import numpy as np
except ImportError:
    np = None

TESSERACT_EXEC = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


def safe_print(label, value):
    try:
        print(f"{label}:", value)
    except Exception:
        print(f"{label}: (print error)")

# pytesseract info
try:
    import pytesseract
    import shutil
    if os.path.exists(TESSERACT_EXEC):
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_EXEC
    safe_print('pytesseract.tesseract_cmd', getattr(pytesseract.pytesseract, 'tesseract_cmd', None))
    safe_print('shutil.which(tesseract)', shutil.which('tesseract'))
except Exception as e:
    print('pytesseract import failed:', e)

# tesseract --version
try:
    cmd = [TESSERACT_EXEC, '--version'] if os.path.exists(TESSERACT_EXEC) else ['tesseract', '--version']
    out = subprocess.run(cmd, capture_output=True, text=True)
    print('tesseract path:', cmd[0])
    print('tesseract --version rc=', out.returncode)
    print(out.stdout.splitlines()[0] if out.stdout else out.stderr.splitlines()[0])
except Exception as e:
    print('tesseract --version failed:', e)

# EasyOCR check and run on saved pages
imgs = ['tmp_page_1.png', 'tmp_page_2.png']
for p in imgs:
    if not os.path.exists(p):
        print('missing image', p)
        continue
    print('\n--- DEBUG IMAGE', p)
    try:
        im = Image.open(p).convert('RGB')
    except Exception as e:
        print('failed open image', e)
        continue

    # pytesseract run
    try:
        if 'pytesseract' in sys.modules:
            txt = pytesseract.image_to_string(im, lang='eng')
            print('pytesseract length:', len(txt))
            print('pytesseract preview:', repr(txt[:500]))
        else:
            print('pytesseract not available')
    except Exception as e:
        print('pytesseract OCR error:', e)

    # EasyOCR run
    try:
        import easyocr
        reader = easyocr.Reader(['en'], gpu=False)
        res = reader.readtext(np.array(im), detail=0)
        out = ''
        if isinstance(res, list):
            out = ' '.join([str(t).strip() for t in res if t and str(t).strip()])
        else:
            out = str(res)
        print('easyocr length:', len(out))
        print('easyocr preview:', repr(out[:500]))
    except Exception as e:
        print('easyocr failed:', e)

print('\nDone quick OCR checks')
