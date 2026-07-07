import joblib # Assuming you saved your model as a .pkl file
# Import your Firecrawl logic here...

# Load your trained model once when the server starts
model = joblib.load('path/to/your/trained_model.pkl')

def run_analysis(text):
    # 1. Chunking Logic
    words = text.split()
    chunks = [" ".join(words[i:i+500]) for i in range(0, len(words), 500)]
    
    analysis_results = []
    
    for chunk in chunks:
        # 2. Predict using your Naive Bayes model
        prediction = model.predict([chunk])[0]
        
        source_data = None
        if prediction == 1: # AI detected
            source_data = find_plagiarism(chunk)
            
        analysis_results.append({
            "chunk": chunk[:50] + "...",
            "is_ai": bool(prediction),
            "source": source_data
        })
        
    return analysis_results