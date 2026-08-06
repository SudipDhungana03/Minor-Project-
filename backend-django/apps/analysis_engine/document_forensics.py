import base64
import hashlib
import io
import os
import re
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

try:
    import docx
except Exception:  # pragma: no cover - optional dependency for tests
    docx = None

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import seaborn as sns
    import pandas as pd
except Exception:  # pragma: no cover - optional dependency for visualization
    plt = None
    sns = None
    pd = None

try:
    from pypdf import PdfReader
except Exception:  # pragma: no cover - optional dependency for tests
    PdfReader = None

from .ml_adapters.plagiarism_vector import build_similarity_report


def _normalize_text(value: Any) -> str:
    if value is None:
        return ''
    text = str(value).strip()
    return re.sub(r'\s+', ' ', text)


def _normalize_identifier(value: Any) -> str:
    normalized = re.sub(r'[^a-z0-9]+', '', _normalize_text(value).lower())
    return normalized or 'unknown'


def _coerce_submission(submission: Any) -> Dict[str, Any]:
    if isinstance(submission, dict):
        data = dict(submission)
    else:
        data = {
            'id': getattr(submission, 'id', None),
            'title': getattr(submission, 'title', None),
            'student_name': getattr(submission, 'student_name', None),
            'file_name': getattr(submission, 'file_name', None),
            'file_url': getattr(submission, 'file_url', None),
            'text': getattr(submission, 'text', None),
            'extracted_text': getattr(submission, 'extracted_text', None),
            'file': getattr(submission, 'file', None),
        }

    text_value = data.get('text') or data.get('extracted_text') or ''
    if not text_value and data.get('file'):
        file_obj = data.get('file')
        if hasattr(file_obj, 'path') and file_obj.path:
            text_value = _extract_text_from_path(file_obj.path)
        elif hasattr(file_obj, 'name') and file_obj.name:
            text_value = _extract_text_from_path(file_obj.name)

    if not text_value:
        text_value = _extract_text_from_path(data.get('file_path')) if data.get('file_path') else ''

    if not text_value and data.get('file_url'):
        text_value = _extract_text_from_path(data.get('file_url')) if os.path.exists(data.get('file_url')) else ''

    if data.get('file_url') and not data.get('file_name'):
        data['file_name'] = os.path.basename(data['file_url'])

    data['text'] = _normalize_text(text_value)
    data['student_name'] = data.get('student_name') or data.get('student') or ''
    data['title'] = data.get('title') or data.get('file_name') or data.get('student_name') or 'Submission'
    data['id'] = data.get('id') or 0
    return data


def _extract_text_from_path(path: Optional[str]) -> str:
    if not path:
        return ''
    try:
        if os.path.exists(path):
            root, ext = os.path.splitext(path.lower())
            if ext == '.docx' and docx is not None:
                document = docx.Document(path)
                return '\n'.join(paragraph.text for paragraph in document.paragraphs if paragraph.text.strip())
            if ext == '.pdf' and PdfReader is not None:
                reader = PdfReader(path)
                pages = [page.extract_text() or '' for page in reader.pages]
                return '\n\n'.join(page for page in pages if page)
            with open(path, 'r', encoding='utf-8', errors='ignore') as handle:
                return handle.read()
    except Exception:
        return ''
    return ''


def _extract_metadata_from_path(path: Optional[str]) -> Dict[str, Any]:
    if not path or not os.path.exists(path):
        return {}
    root, ext = os.path.splitext(path.lower())
    metadata: Dict[str, Any] = {'source_file': os.path.basename(path)}

    try:
        if ext == '.docx' and docx is not None:
            document = docx.Document(path)
            core_props = document.core_properties
            metadata.update({
                'author': core_props.author or '',
                'title': core_props.title or '',
                'subject': core_props.subject or '',
                'keywords': core_props.keywords or '',
                'created': core_props.created.isoformat() if getattr(core_props, 'created', None) else '',
                'modified': core_props.modified.isoformat() if getattr(core_props, 'modified', None) else '',
                'paragraph_count': len(document.paragraphs),
            })
            return metadata

        if ext == '.pdf' and PdfReader is not None:
            reader = PdfReader(path)
            info = reader.metadata or {}
            metadata.update({
                'author': info.get('/Author') or '',
                'title': info.get('/Title') or '',
                'subject': info.get('/Subject') or '',
                'creator': info.get('/Creator') or '',
                'producer': info.get('/Producer') or '',
                'created': str(info.get('/CreationDate') or ''),
                'modified': str(info.get('/ModDate') or ''),
                'page_count': len(reader.pages),
            })
            return metadata
    except Exception:
        return metadata

    return metadata


def _build_origin_signature(submission: Dict[str, Any], metadata: Dict[str, Any]) -> Tuple[str, str, str, str]:
    pieces = [
        submission.get('student_name') or '',
        metadata.get('author') or '',
        metadata.get('title') or '',
        metadata.get('creator') or '',
        submission.get('file_name') or '',
        submission.get('file_url') or '',
    ]
    signature = ' | '.join([piece for piece in pieces if piece])
    normalized = _normalize_identifier(signature)
    digest = hashlib.sha1(signature.encode('utf-8')).hexdigest()[:12]
    label = metadata.get('author') or metadata.get('title') or submission.get('file_name') or submission.get('student_name') or 'unknown'
    return signature, normalized, digest, label


def _extract_submission_metadata(submission: Dict[str, Any]) -> Dict[str, Any]:
    metadata: Dict[str, Any] = {}
    path_candidates = []
    file_path = submission.get('file_path')
    if file_path:
        path_candidates.append(file_path)

    file_obj = submission.get('file')
    if file_obj is not None:
        if hasattr(file_obj, 'path') and file_obj.path:
            path_candidates.append(file_obj.path)
        if hasattr(file_obj, 'name') and file_obj.name:
            path_candidates.append(file_obj.name)

    file_url = submission.get('file_url') or ''
    if file_url and os.path.exists(file_url):
        path_candidates.append(file_url)

    for candidate in path_candidates:
        if not candidate:
            continue
        metadata = _extract_metadata_from_path(candidate)
        if metadata:
            break

    signature, normalized, digest, label = _build_origin_signature(submission, metadata)
    metadata.update({
        'origin_signature': signature,
        'origin_key': normalized,
        'origin_hash': digest,
        'origin_label': label,
    })
    return metadata


def _cluster_submissions(submissions: List[Dict[str, Any]], similarity_report: Dict[str, Any]) -> List[List[Dict[str, Any]]]:
    if not submissions:
        return []

    adjacency = {index: set() for index in range(len(submissions))}
    similarity_lookup = {}
    for left_index, row in enumerate(similarity_report.get('matrix', [])):
        left_submission_id = submissions[left_index].get('id')
        for cell in row:
            if not cell.get('is_diagonal'):
                similarity_lookup[(left_submission_id, cell.get('submission_id'))] = cell

    for left_index, submission in enumerate(submissions):
        left_origin = submission.get('metadata', {}).get('origin_hash') or submission.get('origin_hash') or ''
        for right_index in range(left_index + 1, len(submissions)):
            other = submissions[right_index]
            right_origin = other.get('metadata', {}).get('origin_hash') or other.get('origin_hash') or ''
            if left_origin and right_origin and left_origin == right_origin:
                adjacency[left_index].add(right_index)
                adjacency[right_index].add(left_index)
                continue

            pair_cell = similarity_lookup.get((submission.get('id'), other.get('id'))) or similarity_lookup.get((other.get('id'), submission.get('id')))
            score = (pair_cell or {}).get('overall_score', 0.0) if pair_cell else 0.0
            if score >= 0.25:
                adjacency[left_index].add(right_index)
                adjacency[right_index].add(left_index)

    visited = set()
    clusters: List[List[Dict[str, Any]]] = []
    for index in range(len(submissions)):
        if index in visited:
            continue
        stack = [index]
        cluster: List[Dict[str, Any]] = []
        while stack:
            current = stack.pop()
            if current in visited:
                continue
            visited.add(current)
            cluster.append(submissions[current])
            for neighbor in adjacency[current]:
                if neighbor not in visited:
                    stack.append(neighbor)
        clusters.append(cluster)

    return [cluster for cluster in clusters if cluster]


def _encode_figure(figure) -> str:
    if plt is None:
        return ''
    buffer = io.BytesIO()
    figure.savefig(buffer, format='png', bbox_inches='tight')
    plt.close(figure)
    return base64.b64encode(buffer.getvalue()).decode('ascii')


def _build_similarity_heatmap_image(matrix: List[List[Dict[str, Any]]], labels: List[str]) -> str:
    if sns is None or pd is None or plt is None or not labels:
        return ''

    values = [[float(cell.get('overall_score', 0.0)) for cell in row] for row in matrix]
    df = pd.DataFrame(values, index=labels, columns=labels)
    fig, ax = plt.subplots(figsize=(max(4, len(labels) * 0.6), max(4, len(labels) * 0.6)))
    sns.heatmap(df, annot=True, fmt='.3f', cmap='vlag', cbar=True, linewidths=0.5, ax=ax)
    ax.set_title('Submission Similarity Heatmap')
    ax.set_xlabel('Submission')
    ax.set_ylabel('Submission')
    return _encode_figure(fig)


def _build_cluster_scatter_image(submissions: List[Dict[str, Any]], metrics: List[Dict[str, Any]]) -> str:
    if sns is None or pd is None or plt is None or not submissions:
        return ''

    rows = []
    cluster_by_id = {submission.get('id'): submission.get('cluster_id') for submission in submissions}
    metric_by_id = {metric['submission_id']: metric for metric in metrics}
    for submission in submissions:
        metric = metric_by_id.get(submission.get('id'), {})
        rows.append({
            'title': submission.get('title') or submission.get('student_name') or str(submission.get('id')),
            'cluster_id': cluster_by_id.get(submission.get('id'), -1),
            'anomaly_score': metric.get('anomaly_score', 0.0),
            'originality_score': metric.get('originality_score', 0.0),
        })

    df = pd.DataFrame(rows)
    if df.empty:
        return ''

    fig, ax = plt.subplots(figsize=(max(6, len(rows) * 0.6), 4))
    sns.scatterplot(
        data=df,
        x='title',
        y='anomaly_score',
        hue='cluster_id',
        size='originality_score',
        palette='tab10',
        sizes=(50, 300),
        legend='brief',
        ax=ax,
    )
    ax.set_title('Cluster Anomaly vs Originality')
    ax.set_xlabel('Submission')
    ax.set_ylabel('Anomaly Score')
    ax.set_xticklabels(ax.get_xticklabels(), rotation=45, ha='right')
    fig.tight_layout()
    return _encode_figure(fig)


def _build_submission_metrics(submissions: List[Dict[str, Any]], similarity_report: Dict[str, Any]) -> List[Dict[str, Any]]:
    metrics: List[Dict[str, Any]] = []
    matrix = similarity_report.get('matrix', [])

    for idx, submission in enumerate(submissions):
        similarities = []
        for other_idx, row in enumerate(matrix):
            if other_idx == idx:
                continue
            for cell in row:
                if cell.get('submission_id') == submission.get('id') and not cell.get('is_diagonal'):
                    similarities.append(float(cell.get('overall_score', 0.0)))
                    break

        if not similarities:
            similarities = [0.0]

        max_similarity = max(similarities)
        avg_similarity = sum(similarities) / len(similarities)
        metadata_conflict = 0.0
        if submission.get('metadata', {}).get('origin_hash'):
            same_origin_count = sum(
                1 for other in submissions
                if other.get('metadata', {}).get('origin_hash') == submission.get('metadata', {}).get('origin_hash') and other.get('id') != submission.get('id')
            )
            metadata_conflict = 0.5 if same_origin_count else 0.0

        anomaly_score = round(min(1.0, (0.6 * max_similarity) + (0.25 * avg_similarity) + (0.15 * metadata_conflict)), 3)
        originality_score = round(max(0.0, 1.0 - anomaly_score), 3)
        risk_level = 'high' if anomaly_score >= 0.6 else 'medium' if anomaly_score >= 0.3 else 'low'

        metrics.append({
            'submission_id': submission.get('id'),
            'title': submission.get('title') or submission.get('student_name') or 'Submission',
            'student_name': submission.get('student_name') or '',
            'anomaly_score': anomaly_score,
            'originality_score': originality_score,
            'risk_level': risk_level,
            'max_similarity': round(max_similarity, 3),
            'avg_similarity': round(avg_similarity, 3),
        })

    return metrics


def build_document_forensics_report(submissions: List[Any]) -> Dict[str, Any]:
    """Build a JSON-serializable document forensics report for selected submissions."""
    normalized_submissions = [_coerce_submission(submission) for submission in submissions or []]

    for submission in normalized_submissions:
        submission['metadata'] = _extract_submission_metadata(submission)
        submission['origin_hash'] = submission['metadata'].get('origin_hash')

    similarity_report = build_similarity_report(normalized_submissions)
    clusters = _cluster_submissions(normalized_submissions, similarity_report)
    metrics = _build_submission_metrics(normalized_submissions, similarity_report)

    average_anomaly = round(sum(item['anomaly_score'] for item in metrics) / len(metrics), 3) if metrics else 0.0
    flagged_pairs = similarity_report.get('summary', {}).get('flagged_pairs', 0)
    if average_anomaly >= 0.6:
        verdict = 'High anomaly risk: submissions share strong overlap in text and origin metadata.'
    elif average_anomaly >= 0.3:
        verdict = 'Moderate anomaly risk: some submissions show overlap but not enough for a definitive conclusion.'
    else:
        verdict = 'Low anomaly risk: submissions appear largely distinct.'

    cluster_payloads = []
    for cluster_index, cluster in enumerate(clusters):
        cluster_members = []
        for submission in cluster:
            submission['cluster_id'] = cluster_index
            metric = next((item for item in metrics if item['submission_id'] == submission.get('id')), None)
            cluster_members.append({
                'id': submission.get('id'),
                'title': submission.get('title') or submission.get('student_name') or 'Submission',
                'student_name': submission.get('student_name') or '',
                'anomaly_score': metric.get('anomaly_score', 0.0) if metric else 0.0,
                'originality_score': metric.get('originality_score', 0.0) if metric else 0.0,
            })
        weighted_anomaly = round(sum(member['anomaly_score'] for member in cluster_members) / len(cluster_members), 3) if cluster_members else 0.0
        weighted_originality = round(sum(member['originality_score'] for member in cluster_members) / len(cluster_members), 3) if cluster_members else 0.0
        likely_author = 'unknown'
        if cluster_members:
            best_member = max(cluster_members, key=lambda item: item['originality_score'])
            likely_author = best_member.get('student_name') or best_member.get('title') or 'unknown'
        cluster_payloads.append({
            'cluster_id': cluster_index,
            'size': len(cluster),
            'submission_ids': [submission.get('id') for submission in cluster],
            'members': cluster_members,
            'shared_origin': len({submission.get('metadata', {}).get('origin_hash') for submission in cluster}) <= 1,
            'weighted_anomaly_score': weighted_anomaly,
            'weighted_originality_score': weighted_originality,
            'likely_original_author': likely_author,
        })

    searchable_matrix = []
    numeric_matrix = []
    for row in similarity_report.get('matrix', []):
        numeric_row = []
        searchable_matrix.append([
            {
                'submission_id': cell.get('submission_id'),
                'overall_score': round(cell.get('overall_score', 0.0), 3),
                'flagged': bool(cell.get('flagged')),
                'is_diagonal': bool(cell.get('is_diagonal')),
            }
            for cell in row
        ])
        numeric_row.extend([round(cell.get('overall_score', 0.0), 3) for cell in row])
        numeric_matrix.append(numeric_row)

    labels = [submission.get('title') or submission.get('student_name') or str(submission.get('id')) for submission in normalized_submissions]
    similarity_heatmap_image = _build_similarity_heatmap_image(similarity_report.get('matrix', []), labels)
    cluster_scatter_image = _build_cluster_scatter_image(normalized_submissions, metrics)

    return {
        'generated_at': datetime.utcnow().isoformat() + 'Z',
        'summary': {
            'selected_count': len(normalized_submissions),
            'cluster_count': len(clusters),
            'flagged_pairs': flagged_pairs,
            'average_anomaly_score': average_anomaly,
            'average_originality_score': round(1.0 - average_anomaly, 3),
        },
        'verdict': verdict,
        'submissions': [
            {
                'id': submission.get('id'),
                'title': submission.get('title') or submission.get('student_name') or 'Submission',
                'student_name': submission.get('student_name') or '',
                'file_name': submission.get('file_name') or '',
                'file_url': submission.get('file_url') or '',
                'text_preview': submission.get('text', '')[:280],
                'metadata': submission.get('metadata', {}),
                'metrics': next((item for item in metrics if item['submission_id'] == submission.get('id')), {}),
                'cluster_id': next((cluster_index for cluster_index, cluster in enumerate(clusters) if any(item.get('id') == submission.get('id') for item in cluster)), None),
            }
            for submission in normalized_submissions
        ],
        'clusters': cluster_payloads,
        'similarity_report': similarity_report,
        'visualization': {
            'similarity_heatmap': {
                'labels': labels,
                'matrix': numeric_matrix,
                'image_base64': similarity_heatmap_image,
            },
            'cluster_map': {
                'cluster_ids': [submission.get('id') for submission in normalized_submissions],
                'clusters': [
                    {
                        'cluster_id': cluster_index,
                        'submission_ids': [submission.get('id') for submission in cluster],
                    }
                    for cluster_index, cluster in enumerate(clusters)
                ],
                'scatter_image_base64': cluster_scatter_image,
            },
        },
    }
