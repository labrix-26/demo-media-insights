import { useEffect, useState } from 'react';
import { listAnalyses, type AnalysisJob } from '../api';

interface Props {
  onSelect: (jobId: string) => void;
}

export function AnalysisList({ onSelect }: Props) {
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextKey, setNextKey] = useState<string | null>(null);

  const load = async (lastKey?: string) => {
    try {
      setLoading(true);
      const data = await listAnalyses(50, lastKey);
      const sorted = [...data.items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setJobs((prev) => (lastKey ? [...prev, ...sorted] : sorted));
      setNextKey(data.next_key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const statusClass = (s: string) =>
    s === 'SUCCEEDED' ? 'status-success' : s === 'FAILED' ? 'status-error' : 'status-progress';

  const statusLabel = (s: string) =>
    s === 'IN_PROGRESS' ? 'In Progress' : s === 'SUCCEEDED' ? 'Succeeded' : 'Failed';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds == null) return '—';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toFixed(0);
    return `${m}m ${s}s`;
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Analysis Results</h2>
          <button className="btn btn-secondary" onClick={() => load()} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p className="view-desc">View all video emotion analysis jobs and their results.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && jobs.length === 0 && !error && (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>No analyses found. Upload a video to get started.</p>
        </div>
      )}

      <div className="table-wrap">
        {jobs.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Video</th>
                <th>Dominant Emotion</th>
                <th>Faces</th>
                <th>Frames</th>
                <th>Processing Time</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.job_id} onClick={() => onSelect(job.job_id)} className="clickable-row">
                  <td>
                    <span className={`status-badge ${statusClass(job.status)}`}>
                      {statusLabel(job.status)}
                    </span>
                  </td>
                  <td className="cell-mono">{job.video_key.split('/').pop()}</td>
                  <td>
                    {job.dominant_emotion ? (
                      <span className="emotion-tag">{job.dominant_emotion}</span>
                    ) : '—'}
                  </td>
                  <td>{job.face_count ?? '—'}</td>
                  <td>{job.frames_sampled ?? '—'}</td>
                  <td>{formatDuration(job.processing_time_seconds)}</td>
                  <td className="cell-date">{formatDate(job.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {nextKey && (
        <div className="load-more">
          <button className="btn btn-secondary" onClick={() => load(nextKey)} disabled={loading}>
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {loading && jobs.length === 0 && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading analyses...</p>
        </div>
      )}
    </div>
  );
}
