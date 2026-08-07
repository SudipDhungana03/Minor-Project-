import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import API from '../services/api';
import { Card, Button, Badge, Modal } from './ui';

const STAT_CARD = 'rounded-[28px] p-5 shadow-soft border border-slate-200 bg-white';
const PANEL = 'rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft';

const MetadataForensics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [activeCluster, setActiveCluster] = useState(null);
  const [expandedMember, setExpandedMember] = useState(null);
  const [showOriginalModal, setShowOriginalModal] = useState(false);

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

  const formatMetaValue = (value) => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value === null || value === undefined || value === '') return '—';
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
          <h1 className="text-3xl font-extrabold text-slate-950">Metadata Forensics</h1>
          <p className="mt-2 text-slate-500 max-w-2xl">
            Deep metadata insights for submission clusters and student documents.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate(-1)}>
            Back to assignment
          </Button>
          <Button variant="primary" size="sm" onClick={() => setExpandedMember(null)}>
            Reset view
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="bg-white border-slate-200">
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-slate-500">Risk verdict</p>
          <p className="mt-4 text-2xl font-semibold text-slate-950">{report?.verdict || 'Unknown'}</p>
          <p className="mt-3 text-sm text-slate-500">Overall metadata anomaly indicator for this assignment.</p>
        </Card>

        <Card className="bg-white border-slate-200">
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-slate-500">Submissions</p>
          <p className="mt-4 text-2xl font-semibold text-slate-950">{report?.summary?.selected_count ?? 0}</p>
          <p className="mt-3 text-sm text-slate-500">Total student entries analyzed.</p>
        </Card>

        <Card className="bg-white border-slate-200">
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-slate-500">Clusters</p>
          <p className="mt-4 text-2xl font-semibold text-slate-950">{report?.summary?.cluster_count ?? 0}</p>
          <p className="mt-3 text-sm text-slate-500">Detected similarity groups in this assignment.</p>
        </Card>
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="p-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Cluster heatmap</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">Selected cluster similarity</h2>
            </div>
            <Badge variant="brand">Cluster only</Badge>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
            {cluster && clusterHeatmapLabels.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="mb-5 rounded-3xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                  Only submissions in the selected cluster are displayed here.
                </div>
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-slate-600">Document</th>
                      {clusterHeatmapLabels.map((label) => (
                        <th key={label} className="px-4 py-3 text-slate-600">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {clusterHeatmapMatrix.map((row, rowIndex) => (
                      <tr key={clusterHeatmapLabels[rowIndex]} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">{clusterHeatmapLabels[rowIndex]}</td>
                        {row.map((score, colIndex) => (
                          <td key={`${rowIndex}-${colIndex}`} className="px-4 py-4">
                            <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                              {score.toFixed(3)}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="min-h-[360px] flex items-center justify-center rounded-[24px] border border-slate-200 bg-white text-slate-500">
                Select a cluster to view its similarity matrix.
              </div>
            )}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cluster size</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{cluster?.members?.length ?? 0}</p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Anomaly</p>
              <p className="mt-3 text-3xl font-semibold text-brand-700">{cluster?.weighted_anomaly_score?.toFixed(3) ?? '0.000'}</p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Originality</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{cluster?.weighted_originality_score?.toFixed(3) ?? '0.000'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Cluster selection</p>
          <h3 className="mt-3 text-xl font-semibold text-slate-950">Choose a cluster</h3>
          <div className="mt-5 space-y-3">
            {(report?.clusters || []).map((item) => (
              <button
                key={item.cluster_id}
                type="button"
                onClick={() => {
                  setActiveCluster(item.cluster_id);
                  setExpandedMember(null);
                }}
                className={`w-full rounded-[28px] border px-4 py-4 text-left transition-shadow duration-200 ${item.cluster_id === activeCluster ? 'border-brand-500 bg-brand-50 shadow-soft' : 'border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-lift'}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Cluster {item.cluster_id}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.members.length} students</p>
                  </div>
                  <Badge variant={item.shared_origin ? 'danger' : 'success'}>
                    {item.shared_origin ? 'Shared origin' : 'Distinct origin'}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-500">
                  <span>Anomaly {item.weighted_anomaly_score.toFixed(3)}</span>
                  <span>Originality {item.weighted_originality_score.toFixed(3)}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-10">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Plagiarism review</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">Selected cluster documents</h3>
              <p className="mt-2 text-sm text-slate-600">Review only documents that belong to the active cluster.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
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
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cluster score</p>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-950">Weighted originality</p>
                  <p className="mt-1 text-sm text-slate-600">Full contribution and weight breakdown</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-brand-700">{cluster?.weighted_originality_score?.toFixed(3) ?? '0.000'}</p>
                  <p className="text-sm text-slate-500">Weighted score (higher = more original)</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">Avg originality: {cluster?.avg_originality?.toFixed(3) ?? '—'}</div>
                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">Cluster weight: {cluster?.weight?.toFixed(3) ?? '—'}</div>
                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">Members: {cluster?.members?.length ?? 0}</div>
              </div>
            </div>

            {cluster ? selectedClusterSubmissions.map((member) => (
              <div key={member.id} className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lift">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{member.student_name || member.title}</p>
                    <p className="text-sm text-slate-500">Submission ID {member.id}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-3xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-700">
                      <p className="uppercase tracking-[0.18em] text-slate-500">Anomaly</p>
                      <p className="mt-2 font-semibold text-brand-700">{member.metrics?.anomaly_score?.toFixed(3) ?? '0.000'}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-700">
                      <p className="uppercase tracking-[0.18em] text-slate-500">Originality</p>
                      <p className="mt-2 font-semibold text-slate-950">{member.metrics?.originality_score?.toFixed(3) ?? '0.000'}</p>
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
                  <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {['author','original_author','application','app_version'].map((key) => (
                        <div key={key} className="rounded-2xl bg-white p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{key.replace(/_/g, ' ')}</p>
                          <p className="mt-1 text-sm text-slate-800">{formatMetaValue(member.metadata?.[key] ?? member[key])}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {['created','modified','page_count','total_saves'].map((key) => (
                        <div key={key} className="rounded-2xl bg-white p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{key.replace(/_/g, ' ')}</p>
                          <p className="mt-1 text-sm text-slate-800">{formatMetaValue(member.metadata?.[key] ?? member[key])}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-8 text-slate-600">
                Select a cluster to review only those selected submissions.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Heatmap & Cluster</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">Cluster heatmap</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-500">Showing selected-cluster similarity</div>
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

          <div className="mt-4">
            {report?.visualization?.similarity_heatmap?.image_base64 || report?.visualization?.cluster_map?.scatter_image_base64 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {report?.visualization?.cluster_map?.scatter_image_base64 && (
                  <img
                    src={`data:image/png;base64,${report.visualization.cluster_map.scatter_image_base64}`}
                    alt="cluster-scatter"
                    className="w-full rounded-2xl border border-slate-200 bg-white p-2"
                  />
                )}
                {report?.visualization?.similarity_heatmap?.image_base64 && (
                  <img
                    src={`data:image/png;base64,${report.visualization.similarity_heatmap.image_base64}`}
                    alt="cluster-heatmap"
                    className="w-full rounded-2xl border border-slate-200 bg-white p-2"
                  />
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-slate-600">Seaborn heatmap or cluster scatter not available. Generate visualizations from the backend to display rich heatmap and cluster plots.</div>
            )}
          </div>
        </Card>
      </div>

      {showOriginalModal && cluster && (
        <Modal open={showOriginalModal} onClose={() => setShowOriginalModal(false)} title="Probable original creator & score">
          <div className="grid gap-4">
            <div>
              <p className="text-sm text-slate-600">Cluster weighted originality: <span className="font-semibold text-brand-700">{cluster.weighted_originality_score?.toFixed(3) ?? '—'}</span></p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Calculation (average of member originality scores):</p>
              <div className="mt-2 text-sm">
                {cluster.members && cluster.members.length > 0 ? (
                  <>
                    <div className="mb-2">
                      {cluster.members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between">
                          <div className="text-sm text-slate-800">{m.student_name || m.title}</div>
                          <div className="text-sm font-mono text-slate-900">{(m.originality_score ?? 0).toFixed(3)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 border-t pt-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">Sum</div>
                        <div className="text-sm font-mono text-slate-900">{cluster.members.reduce((s, m) => s + (m.originality_score || 0), 0).toFixed(3)}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">N</div>
                        <div className="text-sm font-mono text-slate-900">{cluster.members.length}</div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-sm font-semibold">Average (weighted originality)</div>
                        <div className="text-sm font-extrabold text-brand-700">{cluster.weighted_originality_score?.toFixed(3) ?? '—'}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-600">No member data available.</div>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-600">Verdict</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{cluster.likely_original_author ? `${cluster.likely_original_author} is the probable creator` : 'No probable creator identified'}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MetadataForensics;
