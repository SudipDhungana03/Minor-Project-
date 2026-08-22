import importlib.util
import os
from pathlib import Path

root = Path(__file__).resolve().parents[1]
print('root:', root)
print('sys.executable:', __import__('sys').executable)

for pkg in ['sentencepiece', 'tokenizers', 'tiktoken', 'transformers', 'huggingface_hub', 'google.cloud.vision']:
    spec = importlib.util.find_spec(pkg)
    print(pkg, 'installed' if spec is not None else 'missing')

try:
    from transformers import TrOCRProcessor
    print('TrOCRProcessor imported')
    for use_fast in (True, False):
        try:
            print(f'loading TrOCRProcessor with use_fast={use_fast}')
            TrOCRProcessor.from_pretrained('microsoft/trocr-base-handwritten', use_fast=use_fast)
            print('success with use_fast=', use_fast)
            break
        except Exception as exc:
            print('failed use_fast=', use_fast, repr(exc))
except Exception as exc:
    print('failed to import TrOCRProcessor', repr(exc))

print('\nGOOGLE_APPLICATION_CREDENTIALS:', os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'))
print('HOME:', os.environ.get('HOME'))
print('USERPROFILE:', os.environ.get('USERPROFILE'))

candidates = []
for path in root.rglob('*.json'):
    name = path.name.lower()
    if any(keyword in name for keyword in ('google', 'credential', 'service', 'account', 'key')):
        candidates.append(str(path))

print('found credential-like json files:', len(candidates))
for p in candidates[:50]:
    print('  ', p)
