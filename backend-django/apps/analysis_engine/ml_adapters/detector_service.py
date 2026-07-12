import joblib
import os
import logging
import re
import math
from datetime import datetime
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

        if hasattr(proba_values, '__len__'):
            proba_list = list(proba_values)
            if len(proba_list) == 2:
                return float(proba_list[1])
            return float(max(proba_list))

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

        analysis_results.append({
            "chunk_index": i,
            "text": chunk,
            "sentence_count": len(_split_sentences(chunk)),
            "word_count": len(chunk.split()),
            "is_ai": bool(prediction == 1),
            "probability": probability,
            "source": None,
        })

    # Run source lookup in a second pass after the AI scoring is complete.
    # This keeps the initial report fast and still adds source info when needed.
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
        "chunks": analysis_results,
        "source_verification": {
            "completed": False,
            "started_at": datetime.utcnow().isoformat() + 'Z'
        }
    }


def _needs_source_lookup(chunk):
    return bool(chunk.get('is_ai')) or chunk.get('probability', 0) >= 0.35 or chunk.get('word_count', 0) <= 100


def _combine_adjacent_chunk_texts(chunks, index):
    current = chunks[index]
    word_count = current.get('word_count', 0)
    sentence_count = current.get('sentence_count', 0)

    if word_count > 35 and sentence_count > 1:
        return []

    combined = []
    prev_chunk = chunks[index - 1] if index > 0 else None
    next_chunk = chunks[index + 1] if index + 1 < len(chunks) else None

    if next_chunk is not None:
        combined.append(f"{current['text']} {next_chunk['text']}")
    if prev_chunk is not None:
        combined.append(f"{prev_chunk['text']} {current['text']}")

    return combined


def run_source_verification(report):
    if not report or 'chunks' not in report:
        return report

    for index, chunk_data in enumerate(report['chunks']):
        if chunk_data.get('source') is not None:
            continue
        if not _needs_source_lookup(chunk_data):
            continue

        try:
            source_result = find_plagiarism(chunk_data['text'])
            if source_result and source_result.get('status') != 'Clear':
                chunk_data['source'] = source_result
                continue

            for combined_text in _combine_adjacent_chunk_texts(report['chunks'], index):
                source_result = find_plagiarism(combined_text)
                if source_result and source_result.get('status') != 'Clear':
                    chunk_data['source'] = source_result
                    break

            if chunk_data.get('source') is None:
                chunk_data['source'] = {'status': 'Clear', 'source_url': None, 'score': 0}
        except Exception:
            logger.exception('Error while running plagiarism check for chunk %s', chunk_data.get('chunk_index'))
            chunk_data['source'] = {"status": "error", "source_url": None, "score": 0}

    report['source_verification'] = {
        'completed': True,
        'completed_at': datetime.utcnow().isoformat() + 'Z'
    }
    return report


