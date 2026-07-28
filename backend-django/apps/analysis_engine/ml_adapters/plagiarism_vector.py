import math
import os
import re
from collections import Counter
from io import BytesIO

import requests
from django.core.files.base import File

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
except Exception:  # pragma: no cover - optional dependency fallback
    TfidfVectorizer = None
    cosine_similarity = None

"""
Plagiarism Detection Module

This module compares submissions using three complementary similarity metrics:

1. **Jaccard Similarity (J)**: Set-based token overlap
   - Counts unique tokens (words) in both documents
   - Formula: |intersection| / |union|
   - Range: 0 to 1 (higher = more similar)
   - Best for: Detecting similar vocabulary/concepts
   
2. **TF-IDF Similarity (T)**: Term Frequency-Inverse Document Frequency
   - Uses sklearn's TfidfVectorizer with bigrams
   - Measures importance of terms in documents
   - Formula: Cosine similarity between TF-IDF vectors
   - Range: 0 to 1 (higher = more similar)
   - Best for: Detecting content similarity while reducing common words
   
3. **Semantic Similarity (S)**: Weighted token overlap
   - Considers frequency of shared tokens
   - Normalized by document term frequency vectors
   - Formula: sum(min_frequency) / sqrt(left_norm² × right_norm²)
   - Range: 0 to 1 (higher = more similar)
   - Best for: Finding substantial shared content

A submission pair is flagged as suspicious if:
- Jaccard >= 0.2 OR TF-IDF >= 0.2 OR Semantic >= 0.15 OR shared snippets found

The module also extracts and highlights overlapping text segments for review.
"""


def extract_text_from_submission_file(file_field):
    """Extract text from PDF, DOCX, or PPTX files from storage or a remote URL."""
    if not file_field:
        return None

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
            use_bytes = None

    if source is None and use_bytes is None and url and (url.startswith('http://') or url.startswith('https://')):
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                use_bytes = BytesIO(response.content)
        except Exception:
            use_bytes = None

    ext = None
    if source:
        ext = os.path.splitext(source)[1].lower()
    elif name:
        ext = os.path.splitext(name.split('?')[0])[1].lower()
    elif url:
        ext = os.path.splitext(url.split('?')[0])[1].lower()

    if ext == '.pdf':
        try:
            from pypdf import PdfReader
            reader = PdfReader(use_bytes) if use_bytes else PdfReader(source)
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception:
            try:
                import PyPDF2
                reader = PyPDF2.PdfReader(use_bytes) if use_bytes else PyPDF2.PdfReader(source)
                return "\n".join(page.extract_text() or "" for page in reader.pages)
            except Exception:
                return None

    if ext == '.docx':
        try:
            import docx
            document = docx.Document(use_bytes) if use_bytes else docx.Document(source)
            return "\n".join(paragraph.text for paragraph in document.paragraphs if paragraph.text)
        except Exception:
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
            return "\n".join(texts)
        except Exception:
            return None

    if ext == '.html' or ext == '.htm':
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
                    return "\n".join(self.text)

            if use_bytes:
                html_content = use_bytes.read().decode('utf-8', errors='ignore')
            else:
                with open(source, 'r', encoding='utf-8', errors='ignore') as f:
                    html_content = f.read()
            
            parser = HTMLTextExtractor()
            parser.feed(html_content)
            return parser.get_text()
        except Exception:
            return None

    return None


def _tokenize(text):
    return [token for token in re.findall(r"[a-zA-Z0-9']+", text.lower()) if token]


def _normalize_text(text):
    return " ".join(_tokenize(text))


def _jaccard_similarity(left_text, right_text):
    left_tokens = set(_tokenize(left_text))
    right_tokens = set(_tokenize(right_text))
    if not left_tokens and not right_tokens:
        return 0.0
    union = left_tokens | right_tokens
    if not union:
        return 0.0
    return round(len(left_tokens & right_tokens) / len(union), 3)


def _tfidf_similarity(left_text, right_text):
    if TfidfVectorizer is None or cosine_similarity is None:
        return _jaccard_similarity(left_text, right_text)

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english')
    matrix = vectorizer.fit_transform([left_text, right_text])
    score = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
    return round(float(score), 3)


def _semantic_similarity(left_text, right_text):
    left_tokens = Counter(_tokenize(left_text))
    right_tokens = Counter(_tokenize(right_text))
    if not left_tokens or not right_tokens:
        return 0.0

    common_tokens = set(left_tokens.keys()) & set(right_tokens.keys())
    if not common_tokens:
        return 0.0

    numerator = sum(min(left_tokens[token], right_tokens[token]) for token in common_tokens)
    left_norm = math.sqrt(sum(value * value for value in left_tokens.values()))
    right_norm = math.sqrt(sum(value * value for value in right_tokens.values()))
    denominator = left_norm * right_norm
    if denominator == 0:
        return 0.0
    return round(numerator / denominator, 3)


def _extract_sentences(text):
    if not text:
        return []
    sentences = [sentence.strip() for sentence in re.split(r'(?<=[.!?])\s+', text) if sentence.strip()]
    return sentences[:8]


def _find_shared_snippets(left_text, right_text):
    left_sentences = _extract_sentences(left_text)
    right_sentences = _extract_sentences(right_text)
    shared = []

    for left_sentence in left_sentences:
        left_tokens = set(_tokenize(left_sentence))
        if not left_tokens:
            continue
        for right_sentence in right_sentences:
            right_tokens = set(_tokenize(right_sentence))
            if not right_tokens:
                continue
            overlap = len(left_tokens & right_tokens)
            if overlap == 0:
                continue
            score = overlap / len(left_tokens | right_tokens)
            if score >= 0.25:
                shared.append({
                    'left_snippet': left_sentence,
                    'right_snippet': right_sentence,
                    'overlap_score': round(score, 3),
                })

    return shared[:3]


def _build_highlights(left_text, right_text, shared_snippets):
    highlights = []
    for snippet in shared_snippets:
        left_range = None
        right_range = None
        left_phrase = snippet['left_snippet']
        right_phrase = snippet['right_snippet']
        if left_phrase:
            left_start = left_text.lower().find(left_phrase.lower())
            if left_start >= 0:
                left_range = {'start': left_start, 'end': left_start + len(left_phrase)}
        if right_phrase:
            right_start = right_text.lower().find(right_phrase.lower())
            if right_start >= 0:
                right_range = {'start': right_start, 'end': right_start + len(right_phrase)}
        if left_range or right_range:
            highlights.append({
                'left': left_range,
                'right': right_range,
                'text': left_phrase,
                'overlap_score': snippet['overlap_score'],
            })
    return highlights


def build_similarity_report(submissions):
    """Build a pairwise plagiarism report for selected submission payloads."""
    matrix = []
    for left_index, left_submission in enumerate(submissions):
        row = []
        for right_index, right_submission in enumerate(submissions):
            if left_index == right_index:
                row.append({
                    'submission_id': left_submission['id'],
                    'submission_title': left_submission.get('title') or left_submission.get('student_name') or 'Submission',
                    'scores': {'jaccard': 1.0, 'tfidf': 1.0, 'semantic': 1.0},
                    'flagged': False,
                    'overlap_snippets': [],
                    'highlights': [],
                    'is_diagonal': True,
                })
                continue

            left_text = left_submission.get('text') or ''
            right_text = right_submission.get('text') or ''
            jaccard = _jaccard_similarity(left_text, right_text)
            tfidf = _tfidf_similarity(left_text, right_text)
            semantic = _semantic_similarity(left_text, right_text)
            shared_snippets = _find_shared_snippets(left_text, right_text)
            highlights = _build_highlights(left_text, right_text, shared_snippets)
            flagged = any([
                jaccard >= 0.2,
                tfidf >= 0.2,
                semantic >= 0.15,
                bool(shared_snippets),
            ])

            row.append({
                'submission_id': right_submission['id'],
                'submission_title': right_submission.get('title') or right_submission.get('student_name') or 'Submission',
                'scores': {'jaccard': round(jaccard, 3), 'tfidf': round(tfidf, 3), 'semantic': round(semantic, 3)},
                'flagged': flagged,
                'overlap_snippets': shared_snippets,
                'highlights': highlights,
                'is_diagonal': False,
            })
        matrix.append(row)

    return {
        'matrix': matrix,
        'summary': {
            'selected_count': len(submissions),
            'flagged_pairs': sum(1 for row in matrix for cell in row if cell.get('flagged') and not cell.get('is_diagonal')),
        },
        'submitted_files': [
            {
                'id': submission['id'],
                'title': submission.get('title') or submission.get('student_name') or 'Submission',
                'student_name': submission.get('student_name') or '',
                'file_name': submission.get('file_name') or '',
                'file_url': submission.get('file_url') or '',
                'text': submission.get('text') or '',
            }
            for submission in submissions
        ],
    }
