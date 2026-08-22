import os
import sys
from io import BytesIO

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.getcwd())
from apps.analysis_engine.ml_adapters.ocr_engine import extract_text_from_file, _get_file_bytes

class DummyFile:
    def __init__(self, data, name):
        self._buffer = BytesIO(data)
        self.name = name

    def seek(self, offset, whence=0):
        return self._buffer.seek(offset, whence)

    def read(self):
        return self._buffer.read()

dummy = DummyFile(b'Hello world from OCR test', 'test_file.txt')
source, use_bytes, ext = _get_file_bytes(dummy)
print('source:', source)
print('use_bytes:', use_bytes)
print('ext:', ext)
if use_bytes:
    print('use_bytes len', len(use_bytes.getvalue()))
    use_bytes.seek(0)
print('extract:', repr(extract_text_from_file(dummy)))
