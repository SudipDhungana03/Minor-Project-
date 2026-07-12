import logging
import os
import re
import requests
import urllib.parse
from bs4 import BeautifulSoup
from firecrawl import Firecrawl

logger = logging.getLogger(__name__)

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
DUCKDUCKGO_HTML_URL = 'https://html.duckduckgo.com/html'

GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GOOGLE_CSE_ID = os.getenv('GOOGLE_CSE_ID')
FIRECRAWL_API_KEY = os.getenv('FIRECRAWL_API_KEY') or 'fc-581171daf32b4df09aa78068592a553a'
FIRECRAWL_TIMEOUT_MS = 30000
FIRECRAWL_MAX_RESULTS = 3
_firecrawl_client = None
_firecrawl_available = True


def _get_firecrawl_client():
    global _firecrawl_client, _firecrawl_available
    if not _firecrawl_available:
        return None
    if _firecrawl_client is not None:
        return _firecrawl_client

    try:
        _firecrawl_client = Firecrawl(api_key=FIRECRAWL_API_KEY, timeout=10)
    except Exception as err:
        logger.warning('Firecrawl client initialization failed: %s', err)
        _firecrawl_client = None
        _firecrawl_available = False
    return _firecrawl_client


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

    if len(words) <= 40:
        phrases.append(text)

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

    if not urls:
        for item in soup.find_all('a', href=True):
            url = item.get('href')
            if engine == 'google':
                url = _extract_url_from_google_href(url)
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
            'li',
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


def _build_search_result(engine, query, urls=None, error=None, raw=None):
    result = {
        'engine': engine,
        'query': query,
        'urls': urls or [],
    }
    if error:
        result['error'] = error
    if raw is not None:
        result['raw'] = raw
    return result


def _search_bing(domain, query):
    search_phrase = f'site:{domain} {query}'
    try:
        resp = requests.get(
            BING_SEARCH_URL,
            params={'q': search_phrase},
            headers={'User-Agent': USER_AGENT},
            timeout=10,
        )
        resp.raise_for_status()
        urls = _parse_search_results(resp.text, domain, engine='bing')
        return _build_search_result('bing', search_phrase, urls=urls)
    except Exception as err:
        return _build_search_result('bing', search_phrase, urls=[], error=str(err))


def _search_duckduckgo(domain, query):
    search_phrase = f'site:{domain} {query}'
    try:
        headers = {
            'User-Agent': USER_AGENT,
            'Accept-Language': 'en-US,en;q=0.9',
        }
        resp = requests.post(
            DUCKDUCKGO_HTML_URL,
            data={'q': search_phrase},
            headers=headers,
            timeout=15,
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        urls = []
        for item in soup.select('a[href]'):
            url = item.get('href')
            if not url or not url.startswith('http'):
                continue
            if domain in url and 'duckduckgo.com' not in url:
                urls.append(url)
            if len(urls) >= 5:
                break
        return _build_search_result('duckduckgo', search_phrase, urls=list(dict.fromkeys(urls)))
    except Exception as err:
        return _build_search_result('duckduckgo', search_phrase, urls=[], error=str(err))


def _search_google(domain, query):
    search_phrase = f'site:{domain} {query}'
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
            return _build_search_result('google_cse', search_phrase, urls=urls)
        except Exception as err:
            logger.warning('Google CSE search failed for domain=%s query=%s: %s', domain, query, err)

    try:
        resp = requests.get(
            GOOGLE_SEARCH_URL,
            params={'q': search_phrase, 'hl': 'en'},
            headers={'User-Agent': USER_AGENT},
            timeout=10,
        )
        resp.raise_for_status()
        urls = _parse_search_results(resp.text, domain, engine='google')
        return _build_search_result('google', search_phrase, urls=urls)
    except Exception as err:
        return _build_search_result('google', search_phrase, urls=[], error=str(err))


def _search_firecrawl(domain, query):
    search_phrase = f'site:{domain} {query}'
    client = _get_firecrawl_client()
    if client is None:
        return _build_search_result('firecrawl', search_phrase, urls=[], error='client_unavailable')

    global _firecrawl_available
    client = _get_firecrawl_client()
    if client is None:
        return _build_search_result('firecrawl', search_phrase, urls=[], error='client_unavailable')

    try:
        response = client.search(
            search_phrase,
            sources=['web'],
            include_domains=[domain],
            limit=FIRECRAWL_MAX_RESULTS,
            scrape_options={'formats': ['markdown']},
            timeout=FIRECRAWL_TIMEOUT_MS,
        )
        urls = []
        for result in getattr(response, 'web', []) or []:
            if isinstance(result, dict):
                url = result.get('url')
            else:
                url = getattr(result, 'url', None)
            if url and domain in url:
                urls.append(url)
            if len(urls) >= 5:
                break
        return _build_search_result('firecrawl', search_phrase, urls=urls, raw=response)
    except Exception as err:
        message = str(err)
        logger.warning('Firecrawl search failed for domain=%s query=%s: %s', domain, query, message)
        if 'paymentrequired' in message.lower() or 'insufficient credits' in message.lower() or 'payment required' in message.lower() or '401' in message:
            _firecrawl_available = False
        return _build_search_result('firecrawl', search_phrase, urls=[], error=message)


def _search_site(domain, query):
    result = _search_firecrawl(domain, query)
    if result.get('urls'):
        return result
    result = _search_duckduckgo(domain, query)
    if result.get('urls'):
        return result
    result = _search_bing(domain, query)
    if result.get('urls'):
        return result
    return _search_google(domain, query)


def find_plagiarism(student_text):
    text = _clean_text(student_text)
    if not text:
        return {'status': 'Clear', 'source': None, 'source_url': None, 'score': 0}

    phrases = _extract_search_phrases(text)
    search_debug = []
    for domain in TARGET_SITES:
        for phrase in phrases:
            result = _search_site(domain, phrase)
            if result:
                urls = result.get('urls', [])
                search_debug.append({
                    'engine': result.get('engine'),
                    'query': result.get('query'),
                    'urls': urls,
                    'error': result.get('error'),
                })
            else:
                search_debug.append({'engine': 'unknown', 'query': phrase, 'urls': [], 'error': 'no_result_object'})

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
                        'search_debug': search_debug,
                    }

    return {'status': 'Clear', 'source': None, 'source_url': None, 'score': 0, 'search_debug': search_debug}
