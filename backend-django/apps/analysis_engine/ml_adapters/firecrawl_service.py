from firecrawl import FirecrawlApp
from difflib import SequenceMatcher
import requests
from bs4 import BeautifulSoup

# Initialize Firecrawl (replace with your actual key or use env variables)
app = FirecrawlApp(api_key='fc-9a1c1a34453b4daa8d48205cea33317b')

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
                return {"status": "Plagiarism Detected", "source": doc.get('url'), "score": similarity}
                
    return {"status": "Clear", "source": None, "score": 0}