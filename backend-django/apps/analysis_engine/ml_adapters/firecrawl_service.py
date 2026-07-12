try:
    import os
    from firecrawl import FirecrawlApp
    from difflib import SequenceMatcher
    import requests
    from bs4 import BeautifulSoup

    # Initialize Firecrawl with optional environment variable support.
    api_key = os.environ.get('FIRECRAWL_API_KEY', 'fc-46f0602d3d81491cad0c5f66fd4c6123')
    app = FirecrawlApp(api_key=api_key)

    def scrape_web_content(url):
        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(url, headers=headers, timeout=5)
            soup = BeautifulSoup(response.text, 'html.parser')
            return " ".join([p.text for p in soup.find_all('p')])
        except:
            return ""

    def find_plagiarism(student_text):
        # Search for potential sources using Firecrawl
        search_query = f"{student_text[:100]} plagiarism"
        results = app.search(search_query, limit=1)
        
        if hasattr(results, 'data'):
            for doc in results.data:
                web_content = doc.get('markdown', '')
                similarity = SequenceMatcher(None, student_text, web_content).ratio()
                
                if similarity > 0.6: # Threshold for 'suspicious'
                    source_url = doc.get('url')
                    return {
                        "status": "Plagiarism Detected",
                        "source": source_url,
                        "source_url": source_url,
                        "score": similarity,
                    }
                    
        return {"status": "Clear", "source": None, "source_url": None, "score": 0}
except Exception:
    # If firecrawl or dependencies aren't installed or fail, provide a safe fallback.
    def find_plagiarism(student_text):
        return {"status": "Unavailable", "source": None, "score": 0}