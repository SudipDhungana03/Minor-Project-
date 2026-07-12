import joblib
import os
import logging
import re
import math
from django.conf import settings
from .firecrawl_service import find_plagiarism

logger = logging.getLogger(__name__)

# Lazy-loaded model handle
MODEL_PATH = os.path.join(settings.BASE_DIR, 'ml_models', 'originality_model.joblib')
model = None

SENTENCE_SPLIT_PATTERN = re.compile(r'(?<=[.!?])\s+(?=[A-Z0-9"\'‘“])')


def _load_model():
    global model
    if model is not None:
        return True
    try:
        model = joblib.load(MODEL_PATH)
        logger.info('Originality model loaded from %s', MODEL_PATH)
        return True
    except Exception as e:
        logger.exception('Failed to load model: %s', e)
        model = None
        return False


def _split_paragraphs(text):
    normalized = text.replace('\r\n', '\n').replace('\r', '\n')
    paragraphs = [p.strip() for p in re.split(r'\n{2,}', normalized) if p.strip()]
    return paragraphs if paragraphs else [normalized.strip()]


def _split_sentences(paragraph):
    sentences = [s.strip() for s in SENTENCE_SPLIT_PATTERN.split(paragraph) if s.strip()]
    return sentences if sentences else [paragraph.strip()]


def _build_chunks_from_paragraphs(paragraphs):
    chunks = []
    buffer = []

    def flush_buffer():
        nonlocal buffer
        if buffer:
            chunks.append(' '.join(buffer).strip())
            buffer = []

    for paragraph in paragraphs:
        sentences = _split_sentences(paragraph)
        if not sentences:
            continue

        if len(sentences) >= 8:
            if buffer:
                buffer.extend(sentences[:3])
                flush_buffer()
                sentences = sentences[3:]
            for start in range(0, len(sentences), 4):
                chunk_sentences = sentences[start:start + 4]
                if chunk_sentences:
                    chunks.append(' '.join(chunk_sentences).strip())
            continue

        if len(sentences) < 3:
            buffer.extend(sentences)
            if len(buffer) >= 3:
                flush_buffer()
            continue

        if buffer:
            buffer.extend(sentences)
            flush_buffer()
            continue

        chunks.append(' '.join(sentences).strip())

    flush_buffer()
    return chunks


def _normalize_probability(prediction, proba_values):
    try:
        if proba_values is None:
            return 1.0 if prediction == 1 else 0.0
        if isinstance(proba_values, (list, tuple)):
            if len(proba_values) == 2:
                return float(proba_values[1])
            return float(max(proba_values))
        return float(proba_values)
    except Exception:
        return 1.0 if prediction == 1 else 0.0


def _sigmoid(x):
    try:
        return 1 / (1 + math.exp(-x))
    except Exception:
        return 0.0


def run_analysis(text):
    paragraphs = _split_paragraphs(text)
    chunks = _build_chunks_from_paragraphs(paragraphs)

    analysis_results = []

    for i, chunk in enumerate(chunks):
        source_data = None
        probability = 0.0

        if model is None:
            loaded = _load_model()
        else:
            loaded = True

        if not loaded:
            analysis_results.append({
                "chunk_index": i,
                "text": chunk,
                "sentence_count": len(_split_sentences(chunk)),
                "word_count": len(chunk.split()),
                "is_ai": False,
                "probability": 0.0,
                "source": None,
                "note": "model_unavailable"
            })
            continue

        try:
            prediction = model.predict([chunk])[0]
            raw_probability = None
            if hasattr(model, 'predict_proba'):
                raw_probability = model.predict_proba([chunk])[0]
            elif hasattr(model, 'decision_function'):
                raw_probability = _sigmoid(model.decision_function([chunk])[0])
            probability = round(_normalize_probability(prediction, raw_probability), 3)
        except Exception as e:
            logger.exception('Prediction failed for chunk %s: %s', i, e)
            analysis_results.append({
                "chunk_index": i,
                "text": chunk,
                "sentence_count": len(_split_sentences(chunk)),
                "word_count": len(chunk.split()),
                "is_ai": False,
                "probability": 0.0,
                "source": None,
                "note": 'prediction_error'
            })
            continue

        try:
            if prediction == 1:
                source_data = find_plagiarism(chunk)
        except Exception:
            logger.exception('Error while running plagiarism check for chunk %s', i)
            source_data = {"status": "error", "source_url": None, "score": 0}

        analysis_results.append({
            "chunk_index": i,
            "text": chunk,
            "sentence_count": len(_split_sentences(chunk)),
            "word_count": len(chunk.split()),
            "is_ai": bool(prediction == 1),
            "probability": probability,
            "source": source_data,
        })

    total_words = sum(r['word_count'] for r in analysis_results)
    ai_words = sum(r['word_count'] for r in analysis_results if r['is_ai'])
    total_chunks = len(analysis_results)
    ai_chunks = sum(1 for r in analysis_results if r['is_ai'])
    ai_text_percentage = round((ai_words / total_words) * 100, 1) if total_words else 0.0
    average_probability = round(sum(r['probability'] for r in analysis_results) / total_chunks, 3) if total_chunks else 0.0

    if ai_text_percentage >= 30 or (ai_chunks and average_probability >= 0.75):
        verdict = 'High likelihood of AI-generated content.'
    elif ai_text_percentage >= 10 or (ai_chunks and average_probability >= 0.55):
        verdict = 'Moderate likelihood of AI-generated content.'
    else:
        verdict = 'Low likelihood of AI-generated content.'

    return {
        "is_ai_generated": any(r['is_ai'] for r in analysis_results),
        "total_chunks": total_chunks,
        "ai_chunks": ai_chunks,
        "ai_chunk_percentage": round((ai_chunks / total_chunks) * 100, 1) if total_chunks else 0.0,
        "ai_text_percentage": ai_text_percentage,
        "average_probability": average_probability,
        "verdict": verdict,
        "chunks": analysis_results
    }


