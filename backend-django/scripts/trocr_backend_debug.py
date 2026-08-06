from transformers import TrOCRProcessor

for backend in ['pil', 'torchvision', None]:
    try:
        print('backend=', backend)
        if backend is None:
            proc = TrOCRProcessor.from_pretrained('microsoft/trocr-base-handwritten')
        else:
            proc = TrOCRProcessor.from_pretrained('microsoft/trocr-base-handwritten', backend=backend)
        print('loaded with backend=', backend)
        break
    except Exception as exc:
        print('failed backend=', backend, type(exc).__name__, exc)
