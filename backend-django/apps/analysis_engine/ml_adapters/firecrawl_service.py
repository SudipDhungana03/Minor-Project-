try:
    import os
    import re
    import requests
    import urllib.parse
    from bs4 import BeautifulSoup
    from difflib import SequenceMatcher

    TARGET_SITES = [
        'geeksforgeeks.org',
        'tutorialspoint.com',
        'w3schools.com',
        'github.com',
        'programiz.com',
    ]

    USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
    BING_SEARCH_URL = 'https://www.bing.com/search'
    GOOGLE_SEARCH_URL = 'https://www.google.com/search'
    GOOGLE_CSE_URL = 'https://www.googleapis.com/customsearch/v1'

    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    GOOGLE_CSE_ID = os.getenv('GOOGLE_CSE_ID')

    def _clean_text(text):
        return re.sub(r'\s+', ' ', text or '').strip()

    def _normalize_page_text(text):
        return re.sub(r'[^a-z0-9 ]+', ' ', (text or '').lower()).strip()

    def _extract_search_phrases(text):
        text = _clean_text(text)
        if not text:
            return []

        cleaned = re.sub(r'[^A-Za-z0-9 ]+', ' ', text).lower()
        words = [w for w in cleaned.split() if len(w) > 3]
        if not words:
            return [text]

        phrases = []
        first_sentence = text.split('.')[:1][0].strip()
        if len(first_sentence.split()) >= 5:
            phrases.append(first_sentence)

        phrases.append(' '.join(words[:20]))
        if len(words) >= 10:
            phrases.append(' '.join(words[:10]))
        if len(words) >= 6:
            phrases.append(' '.join(words[:6]))
        if len(words) >= 4:
            phrases.append(' '.join(words[:4]))

        if len(words) >= 20:
            phrases.append(' '.join(words[10:20]))

        quoted = []
        for phrase in phrases:
            phrase = phrase.strip()
            if not phrase:
                continue
            quoted.append(phrase)
            if len(phrase.split()) >= 5:
                quoted.append(f'"{phrase}"')

        return list(dict.fromkeys(quoted))

    def _extract_url_from_google_href(href):
        if not href:
            return None
        if href.startswith('/url?'):
            parsed = urllib.parse.parse_qs(urllib.parse.urlparse(href).query)
            return parsed.get('q', [None])[0]
        return href

    def _parse_search_results(html, domain, engine='bing'):
        soup = BeautifulSoup(html, 'html.parser')
        urls = []
        if engine == 'bing':
            for item in soup.select('li.b_algo h2 a'):
                url = item.get('href')
                if url and domain in url:
                    urls.append(url)
                if len(urls) >= 5:
                    break
        else:
            for item in soup.select('a[href]'):
                url = item.get('href')
                url = _extract_url_from_google_href(url)
                if url and url.startswith('http') and domain in url:
                    urls.append(url)
                if len(urls) >= 5:
                    break

        if not urls and engine == 'google':
            for item in soup.find_all('a', href=True):
                url = _extract_url_from_google_href(item['href'])
                if url and url.startswith('http') and domain in url:
                    urls.append(url)
                if len(urls) >= 5:
                    break

        return list(dict.fromkeys(urls))

    def _fetch_page_text(url):
        try:
            headers = {'User-Agent': USER_AGENT}
            resp = requests.get(url, headers=headers, timeout=10)
            resp.raise_for_status()
            page = BeautifulSoup(resp.text, 'html.parser')
            texts = []
            selectors = [
                'article p',
                '.content p',
                '.entry-content p',
                '.article-content p',
                '.post-content p',
                'section p',
                'div p',
                'li'
            ]
            for selector in selectors:
                for element in page.select(selector):
                    text = element.get_text(separator=' ', strip=True)
                    if text:
                        texts.append(text)
            if not texts:
                return _clean_text(page.get_text(separator=' ', strip=True))
            return _clean_text(' '.join(texts))
        except Exception:
            return ''

    def _compute_source_score(chunk_text, page_text):
        chunk = _normalize_page_text(chunk_text)
        page = _normalize_page_text(page_text)
        if not chunk or not page:
            return 0.0
        if chunk in page:
            return 1.0

        sentences = [s.strip() for s in re.split(r'[.!?]+', chunk) if s.strip()]
        matches = 0
        for sentence in sentences:
            words = sentence.split()
            if len(words) < 4:
                continue
            if sentence in page:
                matches += 1
        if sentences:
            sentence_score = matches / len(sentences)
            if sentence_score >= 0.4:
                return max(0.5, sentence_score)

        tokens = set(chunk.split())
        if not tokens:
            return 0.0
        overlap = len(tokens.intersection(set(page.split()))) / len(tokens)
        return round(overlap, 3)

    def _search_bing(domain, query):
        try:
            search_phrase = f'site:{domain} {query}'
            resp = requests.get(BING_SEARCH_URL, params={'q': search_phrase}, headers={'User-Agent': USER_AGENT}, timeout=10)
            resp.raise_for_status()
            return _parse_search_results(resp.text, domain, engine='bing')
        except Exception:
            return []

    def _search_google(domain, query):
        if GOOGLE_API_KEY and GOOGLE_CSE_ID:
            try:
                params = {
                    'key': GOOGLE_API_KEY,
                    'cx': GOOGLE_CSE_ID,
                    'q': query,
                    'siteSearch': domain,
                    'num': 5,
                }
                headers = {'User-Agent': USER_AGENT}
                resp = requests.get(GOOGLE_CSE_URL, params=params, headers=headers, timeout=10)
                resp.raise_for_status()
                data = resp.json()
                urls = []
                for item in data.get('items', []):
                    url = item.get('link')
                    if url and domain in url:
                        urls.append(url)
                    if len(urls) >= 5:
                        break
                return urls
            except Exception:
                pass

        try:
            search_phrase = f'site:{domain} {query}'
            resp = requests.get(GOOGLE_SEARCH_URL, params={'q': search_phrase, 'hl': 'en'}, headers={'User-Agent': USER_AGENT}, timeout=10)
            resp.raise_for_status()
            return _parse_search_results(resp.text, domain, engine='google')
        except Exception:
            return []

    def _search_site(domain, query):
        urls = _search_bing(domain, query)
        if urls:
            return urls
        return _search_google(domain, query)

    def find_plagiarism(student_text):
        text = _clean_text(student_text)
        if not text:
            return {'status': 'Clear', 'source': None, 'source_url': None, 'score': 0}

        phrases = _extract_search_phrases(text)
        for domain in TARGET_SITES:
            for phrase in phrases:
                urls = _search_site(domain, phrase)
                for url in urls:
                    page_text = _fetch_page_text(url)
                    if not page_text:
                        continue
                    score = _compute_source_score(text, page_text)
                    if score >= 0.45:
                        return {
                            'status': 'Source Found',
                            'source': url,
                            'source_url': url,
                            'score': round(score, 3),
                            'domain': domain,
                        }

        return {'status': 'Clear', 'source': None, 'source_url': None, 'score': 0}
except Exception:
    def find_plagiarism(student_text):
        return {'status': 'Unavailable', 'source': None, 'source_url': None, 'score': 0}
