import joblib
import os
import logging
from django.conf import settings
from .firecrawl_service import find_plagiarism

logger = logging.getLogger(__name__)

# Lazy-loaded model handle
MODEL_PATH = os.path.join(settings.BASE_DIR, 'ml_models', 'originality_model.joblib')
model = None

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

def run_analysis(text):
    # 2. Chunking Logic: Split text into 500-word segments
    words = text.split()
    chunks = [" ".join(words[i:i+500]) for i in range(0, len(words), 500)]
    
    analysis_results = []
    
    for i, chunk in enumerate(chunks):
        source_data = None

        # Ensure model is available; attempt lazy load if not
        if model is None:
            loaded = _load_model()
        else:
            loaded = True

        if not loaded:
            # If model failed to load, mark as not-detected and include an error note
            analysis_results.append({
                "chunk_index": i,
                "text": chunk,
                "is_ai": False,
                "source": None,
                "note": "model_unavailable"
            })
            continue

        try:
            prediction = model.predict([chunk])[0]
        except Exception as e:
            logger.exception('Prediction failed for chunk %s: %s', i, e)
            analysis_results.append({
                "chunk_index": i,
                "text": chunk,
                "is_ai": False,
                "source": None,
                "note": 'prediction_error'
            })
            continue

        # 4. If AI is suspected, cross-reference with Firecrawl (guarded)
        try:
            if prediction == 1:
                source_data = find_plagiarism(chunk)
        except Exception:
            logger.exception('Error while running plagiarism check for chunk %s', i)
            source_data = {"status": "error", "source": None, "score": 0}

        analysis_results.append({
            "chunk_index": i,
            "text": chunk,
            "is_ai": bool(prediction == 1),
            "source": source_data
        })
        
    return {
        "is_ai_generated": any(r['is_ai'] for r in analysis_results),
        "chunks": analysis_results
    }