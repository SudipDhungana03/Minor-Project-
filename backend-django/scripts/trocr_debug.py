import importlib.util
import os
from transformers import TrOCRProcessor

print('sentencepiece', importlib.util.find_spec('sentencepiece') is not None)
print('tokenizers', importlib.util.find_spec('tokenizers') is not None)
print('tiktoken', importlib.util.find_spec('tiktoken') is not None)
print('transformers version', __import__('transformers').__version__)
for local in (True, False):
    try:
        print('loading local_files_only=', local)
        proc = TrOCRProcessor.from_pretrained('microsoft/trocr-base-handwritten', local_files_only=local)
        print('loaded local_files_only=', local)
        break
    except Exception as exc:
        print('failed local_files_only=', local, repr(exc))
        import traceback; traceback.print_exc()
