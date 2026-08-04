from io import BytesIO

from django.test import SimpleTestCase
from apps.analysis_engine.ml_adapters import ocr_engine
from apps.analysis_engine.ml_adapters.plagiarism_vector import build_similarity_report


class PlagiarismVectorTests(SimpleTestCase):
    def test_build_similarity_report_returns_pairwise_scores(self):
        submissions = [
            {"id": 1, "title": "Alpha", "text": "The quick brown fox jumps over the lazy dog."},
            {"id": 2, "title": "Beta", "text": "The quick brown fox jumps over the lazy dog."},
            {"id": 3, "title": "Gamma", "text": "A completely different essay about planets and moons."},
        ]

        report = build_similarity_report(submissions)

        self.assertEqual(len(report["matrix"]), 3)
        self.assertEqual(report["matrix"][0][0]["submission_id"], 1)
        self.assertGreater(report["matrix"][0][1]["scores"]["jaccard"], 0.8)
        self.assertGreater(report["matrix"][0][1]["scores"]["tfidf"], 0.8)
        self.assertGreater(report["matrix"][0][1]["scores"]["semantic"], 0.0)
        self.assertTrue(report["matrix"][0][1]["flagged"])

    def test_build_similarity_report_generates_highlights(self):
        submissions = [
            {"id": 1, "title": "Alpha", "text": "Chunk A. Chunk B. Chunk C. Chunk D. Chunk E. Chunk F. Chunk G. Chunk H."},
            {"id": 2, "title": "Beta", "text": "Chunk A. Chunk B. Chunk C. Chunk X. Chunk E. Chunk F. Chunk G. Chunk Y."},
        ]

        report = build_similarity_report(submissions)
        highlights = report["matrix"][0][1]["highlights"]

        self.assertGreaterEqual(len(highlights), 1)
        self.assertTrue(all("color_id" in highlight for highlight in highlights))

    def test_plagiarism_vector_splits_long_unstructured_text_into_100_word_chunks(self):
        text = " ".join([f"word{i}" for i in range(1, 253)])
        paragraphs = [text]

        from apps.analysis_engine.ml_adapters.plagiarism_vector import _build_chunks_from_paragraphs
        chunks = _build_chunks_from_paragraphs(paragraphs)

        self.assertEqual(len(chunks), 2)
        self.assertEqual(len(chunks[0]['core_text'].split()), 100)
        self.assertEqual(len(chunks[1]['core_text'].split()), 152)

    def test_plagiarism_vector_merges_tiny_trailing_chunk(self):
        text = " ".join([f"word{i}" for i in range(1, 125)])
        paragraphs = [text]

        from apps.analysis_engine.ml_adapters.plagiarism_vector import _build_chunks_from_paragraphs
        chunks = _build_chunks_from_paragraphs(paragraphs)

        self.assertEqual(len(chunks), 1)
        self.assertTrue(len(chunks[0]['core_text'].split()) <= 124)

    def test_plagiarism_vector_splits_large_structured_paragraphs_into_sentence_chunks(self):
        text = " ".join([f"Sentence {i}." for i in range(1, 10)])
        paragraphs = [text]

        from apps.analysis_engine.ml_adapters.plagiarism_vector import _build_chunks_from_paragraphs
        chunks = _build_chunks_from_paragraphs(paragraphs)

        self.assertEqual(len(chunks), 2)
        self.assertTrue(all(len(chunk['core_text'].split()) > 1 for chunk in chunks))


class OCREngineTests(SimpleTestCase):
    def test_choose_best_text_prefers_longer_result(self):
        self.assertEqual(
            ocr_engine._choose_best_text('short text', 'a much longer OCR result'),
            'a much longer OCR result'
        )
        self.assertEqual(
            ocr_engine._choose_best_text('some text', ''),
            'some text'
        )
        self.assertIsNone(ocr_engine._choose_best_text('', None))

    def test_extract_text_from_file_reads_file_like_text_objects(self):
        class DummyFile:
            def __init__(self, data, name):
                self._buffer = BytesIO(data)
                self.name = name

            def seek(self, offset, whence=0):
                return self._buffer.seek(offset, whence)

            def read(self):
                return self._buffer.read()

        dummy = DummyFile(b'Hello world from OCR test', 'test_file.txt')
        extracted = ocr_engine.extract_text_from_file(dummy)

        self.assertEqual(extracted, 'Hello world from OCR test')
