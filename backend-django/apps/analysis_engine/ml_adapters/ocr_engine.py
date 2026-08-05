import io
import os
import logging
from io import BytesIO
from typing import Optional, List

import requests

try:
    from PIL import Image, ImageFilter, ImageOps
except ImportError:
    Image = None
    ImageFilter = None
    ImageOps = None

try:
    import pytesseract
except ImportError:
    pytesseract = None

try:
    from transformers import TrOCRProcessor, VisionEncoderDecoderModel
except ImportError:
    TrOCRProcessor = None
    VisionEncoderDecoderModel = None

try:
    from pdf2image import convert_from_bytes, convert_from_path
except ImportError:
    convert_from_bytes = None
    convert_from_path = None

logger = logging.getLogger(__name__)

TROCR_MODEL_NAME = 'microsoft/trocr-base-handwritten'
_trocr_processor = None
_trocr_model = None

OCR_IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.tif'}
TEXT_FILE_EXTENSIONS = {'.txt'}


def _load_trocr_model() -> bool:
    global _trocr_processor, _trocr_model
    if _trocr_processor is not None and _trocr_model is not None:
        return True

    if TrOCRProcessor is None or VisionEncoderDecoderModel is None:
        logger.warning('TrOCR dependencies are not installed.')
        return False

    try:
        _trocr_processor = TrOCRProcessor.from_pretrained(TROCR_MODEL_NAME)
        _trocr_model = VisionEncoderDecoderModel.from_pretrained(TROCR_MODEL_NAME)
        return True
    except Exception as exc:
        logger.exception('Failed to load TrOCR model: %s', exc)
        _trocr_processor = None
        _trocr_model = None
        return False


def _load_image_from_bytes(data: BytesIO):
    if Image is None:
        return None
    try:
        data.seek(0)
        return Image.open(data).convert('RGB')
    except Exception:
        return None


def _clean_image(image, handwritten=False):
    if Image is None or image is None:
        return image

    try:
        gray = image.convert('L')
        gray = ImageOps.autocontrast(gray)
        if handwritten and ImageFilter is not None:
            gray = gray.filter(ImageFilter.MedianFilter(size=3))
            gray = gray.point(lambda p: 255 if p > 145 else 0)
        return gray
    except Exception:
        return image


def _run_tesseract(image, handwritten=False):
    if pytesseract is None or image is None:
        return None

    def attempt_tesseract(target_image, config):
        try:
            return pytesseract.image_to_string(target_image, lang='eng', config=config) or ''
        except Exception:
            logger.exception('Tesseract OCR attempt failed with config: %s', config)
            return ''

    cleaned = _clean_image(image, handwritten=handwritten)
    text = attempt_tesseract(cleaned, '--oem 1 --psm 6').strip()
    if len(text) >= 60:
        return text

    fallback_image = cleaned if handwritten else _clean_image(image, handwritten=True)
    for config in ['--oem 1 --psm 11', '--oem 1 --psm 4']:
        candidate = attempt_tesseract(fallback_image, config).strip()
        if candidate and len(candidate) > len(text):
            text = candidate
            if len(text) >= 100:
                break

    return text or None


def _run_trocr(image):
    if not _load_trocr_model() or image is None:
        return None
    try:
        processed = _trocr_processor(images=image, return_tensors='pt')
        generated_ids = _trocr_model.generate(processed.pixel_values, max_length=512)
        return _trocr_processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
    except Exception:
        logger.exception('TrOCR inference failed.')
        return None


def _choose_best_text(tesseract_text: Optional[str], trocr_text: Optional[str]) -> Optional[str]:
    tesseract_text = (tesseract_text or '').strip()
    trocr_text = (trocr_text or '').strip()

    if not tesseract_text and not trocr_text:
        return None
    if trocr_text and len(trocr_text) > len(tesseract_text):
        return trocr_text
    return tesseract_text or trocr_text


def _extract_text_from_image(image):
    if image is None:
        return None

    tesseract_text = _run_tesseract(image)
    if tesseract_text and len(tesseract_text.strip()) >= 60:
        return tesseract_text

    trocr_text = _run_trocr(image)
    return _choose_best_text(tesseract_text, trocr_text)


def _get_file_bytes(file_field):
    if not file_field:
        return None, None, None

    storage = getattr(file_field, 'storage', None)
    name = getattr(file_field, 'name', None)
    path = getattr(file_field, 'path', None)
    url = getattr(file_field, 'url', None)

    use_bytes = None
    source = None
    if path and os.path.exists(path):
        source = path
    elif storage and name:
        try:
            if storage.exists(name):
                with storage.open(name, 'rb') as handle:
                    use_bytes = BytesIO(handle.read())
        except Exception:
            logger.exception('Failed to open file from storage: %s', name)

    if source is None and use_bytes is None:
        if hasattr(file_field, 'open'):
            try:
                file_field.open('rb')
                use_bytes = BytesIO(file_field.read())
            except Exception:
                logger.exception('Failed to read FileField contents for extraction: %s', name or url)
            finally:
                try:
                    file_field.close()
                except Exception:
                    pass

    if source is None and use_bytes is None and hasattr(file_field, 'read'):
        try:
            file_field.seek(0)
        except Exception:
            pass
        try:
            use_bytes = BytesIO(file_field.read())
        except Exception:
            logger.exception('Failed to read file-like object for extraction: %s', name or url)

    if source is None and use_bytes is None:
        file_obj = getattr(file_field, '_file', None)
        if file_obj is not None:
            try:
                file_obj.seek(0)
                use_bytes = BytesIO(file_obj.read())
            except Exception:
                logger.exception('Failed to read file-like object for extraction: %s', name or url)

    if source is None and use_bytes is None and url and url.startswith(('http://', 'https://')):
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                use_bytes = BytesIO(response.content)
        except Exception:
            logger.exception('Failed to download file from URL: %s', url)

    ext = None
    if source:
        ext = os.path.splitext(source)[1].lower()
    elif name:
        ext = os.path.splitext(name.split('?')[0])[1].lower()
    elif url:
        ext = os.path.splitext(url.split('?')[0])[1].lower()

    return source, use_bytes, ext


def _load_pdf_images(source, use_bytes):
    if convert_from_bytes is None or convert_from_path is None:
        return []

    try:
        if use_bytes is not None:
            use_bytes.seek(0)
            return convert_from_bytes(use_bytes.getvalue(), dpi=300, fmt='png')
        if source is not None:
            return convert_from_path(source, dpi=300, fmt='png')
    except Exception:
        logger.exception('Failed to convert PDF to images for OCR.')
    return []


def _extract_text_from_pdf(source, use_bytes):
    images = _load_pdf_images(source, use_bytes)
    pages = []
    for img in images:
        page_text = _extract_text_from_image(img)
        if page_text:
            pages.append(page_text)
    return '\n\n'.join(pages).strip() if pages else None


def _extract_text_from_image_bytes(data: BytesIO):
    image = _load_image_from_bytes(data)
    if image is None:
        return None
    return _extract_text_from_image(image)


def _extract_text_from_text_file(source, use_bytes, ext):
    if ext == '.docx':
        try:
            import docx
            document = docx.Document(use_bytes) if use_bytes else docx.Document(source)
            return '\n'.join([p.text for p in document.paragraphs if p.text])
        except Exception:
            logger.exception('DOCX extraction failed.')
            return None

    if ext == '.pptx':
        try:
            from pptx import Presentation
            presentation = Presentation(use_bytes) if use_bytes else Presentation(source)
            texts = []
            for slide in presentation.slides:
                for shape in slide.shapes:
                    if hasattr(shape, 'text') and shape.text:
                        texts.append(shape.text)
            return '\n'.join(texts)
        except Exception:
            logger.exception('PPTX extraction failed.')
            return None

    if ext in {'.html', '.htm'}:
        try:
            from html.parser import HTMLParser

            class HTMLTextExtractor(HTMLParser):
                def __init__(self):
                    super().__init__()
                    self.text = []
                    self.skip_content = False

                def handle_starttag(self, tag, attrs):
                    if tag in ['script', 'style', 'head', 'meta']:
                        self.skip_content = True

                def handle_endtag(self, tag):
                    if tag in ['script', 'style', 'head', 'meta']:
                        self.skip_content = False

                def handle_data(self, data):
                    if not self.skip_content:
                        text = data.strip()
                        if text:
                            self.text.append(text)

                def get_text(self):
                    return '\n'.join(self.text)

            if use_bytes:
                html_content = use_bytes.read().decode('utf-8', errors='ignore')
            else:
                with open(source, 'r', encoding='utf-8', errors='ignore') as handle:
                    html_content = handle.read()

            parser = HTMLTextExtractor()
            parser.feed(html_content)
            return parser.get_text()
        except Exception:
            logger.exception('HTML extraction failed.')
            return None

    if ext == '.txt':
        try:
            if use_bytes:
                use_bytes.seek(0)
                return use_bytes.read().decode('utf-8', errors='ignore')
            with open(source, 'r', encoding='utf-8', errors='ignore') as handle:
                return handle.read()
        except Exception:
            logger.exception('Text extraction failed.')
            return None

    return None


def extract_text_from_file(file_field):
    source, use_bytes, ext = _get_file_bytes(file_field)
    if not ext:
        return None

    if ext == '.pdf':
        if source or use_bytes:
            text = _extract_text_from_pdf(source, use_bytes)
            if text:
                return text

            try:
                from pypdf import PdfReader
                reader = PdfReader(use_bytes) if use_bytes else PdfReader(source)
                return '\n'.join([p.extract_text() or '' for p in reader.pages])
            except Exception:
                logger.exception('PDF text extraction failed with pypdf.')
                pass
        return None

    if ext in OCR_IMAGE_EXTENSIONS:
        text = _extract_text_from_image_bytes(use_bytes or BytesIO(open(source, 'rb').read()))
        if text:
            return text

    text = _extract_text_from_text_file(source, use_bytes, ext)
    if text:
        return text

    return None
