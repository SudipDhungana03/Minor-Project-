import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import API from '../services/api';
import { Card, Button, Badge, Modal } from './ui';

const STAT_CARD = 'rounded-[28px] p-5 shadow-soft border border-slate-200 bg-white';
const PANEL = 'rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft';
const HEATMAP_COLOR = (score) => {
  const safeScore = Math.max(0, Math.min(1, Number(score) || 0));
  return `hsl(217, ${35 + (safeScore * 50)}%, ${97 - (safeScore * 52)}%)`;
};

const FACTOR_LABELS = {
  editing_history: 'Editing history',
  saves_and_revisions: 'Saves & revisions',
  author_match: 'Author identity match',
  similarity_and_chronology: 'Text similarity & chronology',
};

const formatPercent = (value) => `${((Number(value) || 0) * 100).toFixed(1)}%`;

function OriginalityScoreTooltip({ metrics, visible }) {
  const components = metrics?.originality_components;
  if (!components) return null;
  return (
    <div role="tooltip" className={`pointer-events-none absolute bottom-full right-0 z-50 mb-3 w-80 rounded-xl border border-slate-200 bg-slate-900 p-4 text-left text-white shadow-xl transition-all duration-150 ${visible ? 'visible opacity-100' : 'invisible opacity-0'}`}>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200">Originality calculation</p>
      <p className="mt-2 font-mono text-xs text-slate-300">E × 35% + R × 25% + A × 25% + S × 15%</p>
      <div className="mt-3 space-y-2">{Object.entries(components).map(([key, component]) => (<div key={key} className="flex items-center justify-between gap-3 text-xs"><span className="text-slate-300">{FACTOR_LABELS[key] || key} ({formatPercent(component.weight)})</span><span className="font-bold text-white">{formatPercent(component.contribution)}</span></div>))}</div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-700 pt-3"><span className="text-xs font-semibold text-slate-300">Final score</span><span className="text-base font-bold text-white">{formatPercent(metrics.originality_score)}</span></div>
    </div>
  );
}
const MetadataForensics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [activeCluster, setActiveCluster] = useState(null);
  const [expandedMember, setExpandedMember] = useState(null);
  const [showOriginalModal, setShowOriginalModal] = useState(false);
  const [hoveredOriginality, setHoveredOriginality] = useState(null);

  useEffect(() => {
    const fetchForensics = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const submissionIds = params.get('submission_ids');
        const url = submissionIds ? `/api/plagiarism/for_assignment/${id}/?submission_ids=${encodeURIComponent(submissionIds)}` : `/api/plagiarism/for_assignment/${id}/`;
        const res = await API.get(url);
        setReport(res.data);
        setActiveCluster(res.data?.clusters?.[0]?.cluster_id ?? null);
      } catch (error) {
        console.error('Failed to load metadata forensics report', error);
      } finally {
        setLoading(false);
      }
    };

    fetchForensics();
  }, [id]);

  const cluster = report?.clusters?.find((item) => item.cluster_id === activeCluster) || report?.clusters?.[0] || null;
  const allSubmissions = report?.submissions || [];
  const clusterSubmissionIds = cluster?.submission_ids || [];
  const selectedClusterSubmissions = allSubmissions.filter((item) => clusterSubmissionIds.includes(item.id));
  const submissionOrderIndex = Object.fromEntries(allSubmissions.map((item, index) => [item.id, index]));
  const clusterHeatmapLabels = selectedClusterSubmissions.map((submission) => submission.student_name || submission.title || `Submission ${submission.id}`);
  const clusterMemberScores = cluster?.members?.map((member) => member.originality_score ?? 0) || [];
  const clusterOriginalitySum = clusterMemberScores.reduce((sum, value) => sum + value, 0);
  const clusterMemberCount = clusterMemberScores.length;
  const clusterAvgOriginality = clusterMemberCount ? clusterOriginalitySum / clusterMemberCount : null;
  const clusterWeight = report?.summary?.selected_count ? ((cluster?.members?.length ?? 0) / report.summary.selected_count) : null;
  const clusterHeatmapMatrix = (report?.visualization?.similarity_heatmap?.matrix || []).length
    ? selectedClusterSubmissions.map((rowSubmission) =>
        selectedClusterSubmissions.map((colSubmission) => {
          const rowIndex = submissionOrderIndex[rowSubmission.id];
          const colIndex = submissionOrderIndex[colSubmission.id];
          return report.visualization.similarity_heatmap.matrix?.[rowIndex]?.[colIndex] ?? 0;
        })
      )
    : [];

  const metadataKeys = [
    'author',
    'original_author',
    'application',
    'app_version',
    'created',
    'modified',
    'total_editing_time_minutes',
    'total_saves',
    'paragraph_count',
    'page_count',
    'file_name',
  ];

  const formatMetaValue = (value, key = '') => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value === null || value === undefined || value === '' || (['page_count', 'slide_count', 'word_count', 'total_editing_time_minutes'].includes(key) && Number(value) === 0)) {
      return 'Not embedded in this file';
    }
    if (key === 'total_editing_time_minutes') return `${Number(value).toLocaleString()} minutes`;
    return value;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-4 xl:grid-cols-3">
          <div className={STAT_CARD}><div className="h-14 rounded-2xl bg-slate-100" /></div>
          <div className={STAT_CARD}><div className="h-14 rounded-2xl bg-slate-100" /></div>
          <div className={STAT_CARD}><div className="h-14 rounded-2xl bg-slate-100" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-950">Metadata Forensics</h1>
          <p className="mt-2 text-slate-600 max-w-2xl">
            Deep metadata insights for submission clusters and student documents.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            ← Back to assignment
          </Button>
          <Button variant="primary" size="sm" onClick={() => setExpandedMember(null)}>
            Reset view
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className={`${STAT_CARD} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 opacity-10">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
          </div>
          <div className="relative">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 bg-red-100 rounded-lg p-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  <path d="M12 9v4m0 4v.01"/>
                </svg>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] font-semibold text-slate-500">Risk verdict</p>
                <p className="mt-2 text-xl font-bold text-slate-950">{report?.verdict || 'Unknown'}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-600">Submissions share strong overlap in text and origin metadata.</p>
          </div>
        </div>

        <div className={STAT_CARD}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <path d="M9 11H3v2h6v-2zm0-4H3v2h6V7zm6 0v2h6V7h-6zm0 4v2h6v-2h-6zM9 3H3v2h6V3zm6 0v2h6V3h-6z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-slate-500">Submissions</p>
              <p className="mt-2 text-xl font-bold text-slate-950">{report?.summary?.selected_count ?? 0}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-600">Total student entries analyzed.</p>
        </div>

        <div className={STAT_CARD}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-slate-500">Clusters</p>
              <p className="mt-2 text-xl font-bold text-slate-950">{report?.summary?.cluster_count ?? 0}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-600">Detected similarity groups in this assignment.</p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="p-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500 font-semibold">Cluster heatmap</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Selected cluster similarity</h2>
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full border border-blue-200">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
              Cluster only
            </span>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            {cluster && clusterHeatmapLabels.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="mb-5 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800 border border-blue-200 flex items-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Only submissions in the selected cluster are displayed here.
                </div>
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="px-4 py-4 font-semibold text-slate-900 bg-slate-50">Document</th>
                      {clusterHeatmapLabels.map((label) => (
                        <th key={label} className="px-4 py-4 font-semibold text-slate-900 text-center bg-slate-50 text-xs">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {clusterHeatmapMatrix.map((row, rowIndex) => (
                      <tr key={clusterHeatmapLabels[rowIndex]} className="hover:bg-slate-50 transition">
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900 bg-slate-50">{clusterHeatmapLabels[rowIndex]}</td>
                        {row.map((score, colIndex) => {
                          // Pale blue indicates low similarity; deep blue indicates high similarity.
                          return (
                            <td key={`${rowIndex}-${colIndex}`} className="px-4 py-4 text-center">
                              <span className="inline-flex w-20 items-center justify-center rounded-lg px-3 py-2 text-sm font-bold shadow-sm" style={{ backgroundColor: HEATMAP_COLOR(score), color: score >= 0.5 ? 'white' : 'rgb(30, 64, 175)' }}>
                                {score.toFixed(3)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Legend */}
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Similarity Score</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">Low</span>
                    <div className="flex h-6 w-40 overflow-hidden rounded-lg border border-slate-200">
                      {[0, 0.2, 0.4, 0.6, 0.8, 1].map((val) => (
                        <div key={val} style={{ backgroundColor: HEATMAP_COLOR(val), flex: 1 }} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">High</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-[360px] flex items-center justify-center rounded-[24px] border border-slate-200 bg-slate-50 text-slate-500">
                Select a cluster to view its similarity matrix.
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-slate-500">Cluster size</p>
              <p className="mt-3 text-2xl font-bold text-slate-950">{cluster?.members?.length ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-red-50 border border-red-200 p-5">
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-red-600">Anomaly</p>
              <p className="mt-3 text-2xl font-bold text-red-600">{cluster?.weighted_anomaly_score?.toFixed(3) ?? '0.000'}</p>
            </div>
            <div className="relative cursor-pointer rounded-2xl border border-blue-200 bg-blue-50 p-5" tabIndex="0" onMouseEnter={() => setHoveredOriginality('cluster')} onMouseLeave={() => setHoveredOriginality(null)} onFocus={() => setHoveredOriginality('cluster')} onBlur={() => setHoveredOriginality(null)}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Originality</p>
              <p className="mt-3 text-2xl font-bold text-blue-600">{cluster?.weighted_originality_score?.toFixed(3) ?? '0.000'}</p>
              <div role="tooltip" className={`pointer-events-none absolute bottom-full right-0 z-50 mb-3 w-72 rounded-xl border border-slate-200 bg-slate-900 p-4 text-left text-white shadow-xl transition-all ${hoveredOriginality === 'cluster' ? 'visible opacity-100' : 'invisible opacity-0'}`}><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200">Cluster calculation</p><p className="mt-2 text-xs leading-5 text-slate-300">Average of the exact member originality scores in this cluster.</p><p className="mt-3 border-t border-slate-700 pt-3 text-sm font-bold">{clusterOriginalitySum.toFixed(3)} ÷ {clusterMemberCount || 1} = {cluster?.weighted_originality_score?.toFixed(3) ?? '0.000'}</p></div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500 font-semibold">Cluster selection</p>
          <h3 className="mt-3 text-xl font-bold text-slate-950">Choose a cluster</h3>
          <div className="mt-6 space-y-3">
            {(report?.clusters || []).map((item) => (
              <button
                key={item.cluster_id}
                type="button"
                onClick={() => {
                  setActiveCluster(item.cluster_id);
                  setExpandedMember(null);
                }}
                className={`w-full rounded-[18px] border px-4 py-4 text-left transition-all duration-200 ${item.cluster_id === activeCluster ? 'border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-200' : 'border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md'}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-950">Cluster {item.cluster_id}</p>
                    <p className="mt-1 text-xs text-slate-600">{item.members.length} students</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${item.shared_origin ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                    {item.shared_origin ? 'Shared' : 'Distinct'}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600">
                  <span className="font-medium">Anomaly <span className="text-red-600 font-bold">{item.weighted_anomaly_score.toFixed(3)}</span></span>
                  <span className="font-medium">Originality <span className="text-blue-600 font-bold">{item.weighted_originality_score.toFixed(3)}</span></span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-10">
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500 font-semibold">Plagiarism review</p>
              <h3 className="mt-2 text-xl font-bold text-slate-950">Selected cluster documents</h3>
              <p className="mt-2 text-sm text-slate-600">Review only documents that belong to the active cluster.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 border border-blue-200">
                {cluster ? `${cluster.members.length} submissions` : 'Select a cluster'}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowOriginalModal(true)}
              >
                View original creator
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {cluster ? selectedClusterSubmissions.map((member) => (
              <div key={member.id} className="flex flex-col gap-4 rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-bold text-slate-950">{member.student_name || member.title}</p>
                    <p className="text-xs text-slate-500">Submission ID {member.id}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-center">
                      <p className="text-xs uppercase tracking-[0.18em] font-semibold text-red-600">Anomaly</p>
                      <p className="mt-2 text-lg font-bold text-red-600">{member.metrics?.anomaly_score?.toFixed(3) ?? '0.000'}</p>
                    </div>
                    <div className="relative cursor-pointer rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center" tabIndex="0" onMouseEnter={() => setHoveredOriginality(member.id)} onMouseLeave={() => setHoveredOriginality(null)} onFocus={() => setHoveredOriginality(member.id)} onBlur={() => setHoveredOriginality(null)}>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Originality</p>
                      <p className="mt-2 text-lg font-bold text-blue-600">{member.metrics?.originality_score?.toFixed(3) ?? '0.000'}</p>
                      <OriginalityScoreTooltip metrics={member.metrics} visible={hoveredOriginality === member.id} />
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                    >
                      {expandedMember === member.id ? 'Hide metadata' : 'View metadata'}
                    </Button>
                  </div>
                </div>
                {expandedMember === member.id && (
                  <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {['author','original_author','application','app_version'].map((key) => (
                        <div key={key} className="rounded-lg bg-white p-3 border border-slate-200">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">{key === 'total_editing_time_minutes' ? 'Total edit time' : key === 'page_count' ? 'Pages' : key === 'slide_count' ? 'Slides' : key.replace(/_/g, ' ')}</p>
                          <p className="mt-2 text-sm text-slate-800">{formatMetaValue(member.metadata?.[key] ?? member[key], key)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {['created', 'total_editing_time_minutes', 'page_count', 'slide_count', 'word_count', 'total_saves'].filter((key) => key !== 'slide_count' || member.metadata?.slide_count !== undefined).map((key) => (
                        <div key={key} className="rounded-lg bg-white p-3 border border-slate-200">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">{key === 'total_editing_time_minutes' ? 'Total edit time' : key === 'page_count' ? 'Pages' : key === 'slide_count' ? 'Slides' : key.replace(/_/g, ' ')}</p>
                          <p className="mt-2 text-sm text-slate-800">{formatMetaValue(member.metadata?.[key] ?? member[key], key)}</p>
                  </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-50">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                Select a cluster to review only those selected submissions.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 mt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500 font-semibold">Heatmap & Cluster</p>
              <h3 className="mt-1 text-xl font-bold text-slate-950">Cluster visualization</h3>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-600 font-medium">Showing selected-cluster similarity</p>
              <Button size="sm" variant="outline" onClick={async () => {
                try {
                  const params = new URLSearchParams(location.search);
                  params.set('regen_visuals', '1');
                  const url = params.toString() ? `/api/plagiarism/for_assignment/${id}/?${params.toString()}` : `/api/plagiarism/for_assignment/${id}/?regen_visuals=1`;
                  const res = await API.get(url);
                  setReport(res.data);
                } catch (e) {
                  console.error('Failed to regenerate visuals', e);
                }
              }}>
                Regenerate visuals
              </Button>
            </div>
          </div>

          <div className="mt-6">
            {report?.visualization?.similarity_heatmap?.image_base64 || report?.visualization?.cluster_map?.scatter_image_base64 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {report?.visualization?.cluster_map?.scatter_image_base64 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 overflow-hidden">
                    <img
                      src={`data:image/png;base64,${report.visualization.cluster_map.scatter_image_base64}`}
                      alt="cluster-scatter"
                      className="w-full rounded-lg"
                    />
                  </div>
                )}
                {report?.visualization?.similarity_heatmap?.image_base64 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 overflow-hidden">
                    <img
                      src={`data:image/png;base64,${report.visualization.similarity_heatmap.image_base64}`}
                      alt="cluster-heatmap"
                      className="w-full rounded-lg"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-40">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1"/>
                </svg>
                Visualizations not available. Generate from the backend to display heatmap and cluster plots.
              </div>
            )}
          </div>
        </Card>
      </div>

      {showOriginalModal && cluster && (
        <Modal open={showOriginalModal} onClose={() => setShowOriginalModal(false)} title="Probable original creator & score">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-100 text-blue-700 flex-shrink-0">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19 20C19 16.6863 16.3137 14 13 14H11C7.68629 14 5 16.6863 5 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Probable original creator & score</h2>
                  <p className="mt-2 text-sm text-slate-600">Cluster weighted originality: <span className="font-bold text-blue-600">{cluster.weighted_originality_score?.toFixed(3) ?? '—'}</span></p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Calculation</p>
                  <p className="mt-2 text-sm text-slate-700">Average of member originality scores</p>
                </div>
                <div className="text-right text-sm text-slate-700">
                  <div className="font-semibold">Sum <span className="text-blue-600">{clusterOriginalitySum.toFixed(3)}</span></div>
                  <div className="font-semibold">N <span className="text-blue-600">{clusterMemberCount}</span></div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {cluster.members && cluster.members.length > 0 ? cluster.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19 20C19 16.6863 16.3137 14 13 14H11C7.68629 14 5 16.6863 5 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{m.student_name || m.title}</p>
                        <p className="text-xs text-slate-500">Originality score</p>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-blue-600">{(m.originality_score ?? 0).toFixed(3)}</div>
                  </div>
                )) : (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">No member data available.</div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-sm font-semibold text-slate-700">Average (weighted originality)</span>
                <span className="text-lg font-bold text-blue-600">{cluster.weighted_originality_score?.toFixed(3) ?? '—'}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Verdict</p>
              <p className="mt-3 text-base font-semibold text-emerald-900">{cluster.likely_original_author ? `${cluster.likely_original_author} is the probable creator` : 'No probable creator identified'}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MetadataForensics;
