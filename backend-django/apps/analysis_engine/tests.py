from django.test import SimpleTestCase
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
