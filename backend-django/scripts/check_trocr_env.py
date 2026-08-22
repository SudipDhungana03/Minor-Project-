import importlib.util
import sys

print('sys.executable:', sys.executable)
for pkg in ['sentencepiece', 'tokenizers', 'tiktoken', 'transformers', 'huggingface_hub']:
    spec = importlib.util.find_spec(pkg)
    print(pkg, 'installed' if spec is not None else 'missing')

try:
    from transformers import TrOCRProcessor
    print('TrOCRProcessor imported')
    proc = TrOCRProcessor.from_pretrained('microsoft/trocr-base-handwritten')
    print('TrOCRProcessor loaded successfully')
except Exception as exc:
    print('TrOCR load failed:', repr(exc))
    import traceback; traceback.print_exc()
