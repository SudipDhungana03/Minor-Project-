import joblib
import os
from django.conf import settings
# Assuming your Firecrawl logic is in a separate file or accessible here
from .firecrawl_service import find_plagiarism # Make sure this import matches your file structure

# 1. Load the model once when the server starts
MODEL_PATH = os.path.join(settings.BASE_DIR, 'ml_models', 'originality_model.joblib')
model = joblib.load(MODEL_PATH)

def run_analysis(text):
    # 2. Chunking Logic: Split text into 500-word segments
    words = text.split()
    chunks = [" ".join(words[i:i+500]) for i in range(0, len(words), 500)]
    
    analysis_results = []
    
    for i, chunk in enumerate(chunks):
        # 3. Predict using your Naive Bayes model
        # Note: model.predict expects a list (a batch of inputs)
        prediction = model.predict([chunk])[0]
        
        source_data = None
        # 4. If AI is suspected, cross-reference with Firecrawl
        if prediction == 1: 
            source_data = find_plagiarism(chunk)
            
        analysis_results.append({
            "chunk_index": i,
            "text": chunk[:50] + "...",
            "is_ai": bool(prediction == 1),
            "source": source_data
        })
        
    return {
        "is_ai_generated": any(r['is_ai'] for r in analysis_results),
        "chunks": analysis_results
    }