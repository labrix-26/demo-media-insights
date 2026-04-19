import { useEffect, useState } from 'react';
import { getAnalysis, type AnalysisJob } from '../api';

interface Props {
  jobId: string;
  onBack: () => void;
}

const EMOTION_COLORS: Record<string, string> = {
  HAPPY: '#10b981',
  SAD: '#6366f1',
  ANGRY: '#ef4444',
  CONFUSED: '#f59e0b',
  DISGUSTED: '#84cc16',
  SURPRISED: '#f97316',
  CALM: '#06b6d4',
  FEAR: '#8b5cf6',
};

export function AnalysisDetail({ jobId, onBack }: Props) {
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval>;

    const load = async () => {
      try {
        const data = await getAnalysis(jobId);
        if (cancelled) return;
        setJob(data);
        setLoading(false);
        if (data.status === 'IN_PROGRESS') {
          interval = setInterval(async () => {
            const updated = await getAnalysis(jobId);
            if (!cancelled) setJob(updated);
            if (updated.status !== 'IN_PROGRESS') clearInterval(interval);
          }, 5000);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId]);

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const formatDuration = (s: number | null) => {
    if (s == null) return '—';
    if (s < 60) return `${s.toFixed(2)}s`;
    return `${Math.floor(s / 60)}m ${(s % 60).toFixed(0)}s`;
  };

  const sortedEmotions = job?.emotions_summary
    ? Object.entries(job.emotions_summary).sort(([, a], [, b]) => b - a)
    : [];

  const maxScore = sortedEmotions.length > 0 ? sortedEmotions[0][1] : 1;

  if (loading) {
    return (
      <div className="view-container">
        <div className="loading-state"><div className="spinner" /><p>Loading analysis...</p></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="view-container">
        <div className="alert alert-error">{error || 'Job not found'}</div>
        <button className="btn btn-secondary" onClick={onBack}>Back</button>
      </div>
    );
  }

  const statusClass =
    job.status === 'SUCCEEDED' ? 'status-success' : job.status === 'FAILED' ? 'status-error' : 'status-progress';

  return (
    <div className="view-container">
      <button className="btn-back" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Analyses
      </button>

      <div className="detail-header">
        <div>
          <h2>Analysis Detail</h2>
          <p className="detail-id">Job ID: {job.job_id}</p>
        </div>
        <span className={`status-badge ${statusClass}`}>
          {job.status === 'IN_PROGRESS' ? 'In Progress' : job.status === 'SUCCEEDED' ? 'Succeeded' : 'Failed'}
        </span>
      </div>

      {job.status === 'IN_PROGRESS' && (
        <div className="in-progress-banner">
          <div className="spinner spinner-sm" />
          <span>Analysis in progress. This page will update automatically...</span>
        </div>
      )}

      <div className="detail-grid">
        <div className="metric-card">
          <span className="metric-label">Video File</span>
          <span className="metric-value mono">{job.video_key.split('/').pop()}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Processing Time</span>
          <span className="metric-value">{formatDuration(job.processing_time_seconds)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Faces Detected</span>
          <span className="metric-value">{job.face_count ?? '—'}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Frames Sampled</span>
          <span className="metric-value">{job.frames_sampled ?? '—'}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Sample Interval</span>
          <span className="metric-value">{job.sample_interval_seconds ? `${job.sample_interval_seconds}s` : '—'}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Created At</span>
          <span className="metric-value small">{formatDate(job.created_at)}</span>
        </div>
      </div>

      {job.dominant_emotion && (
        <div className="dominant-section">
          <h3>Dominant Emotion</h3>
          <div className="dominant-display">
            <span
              className="dominant-label"
              style={{ color: EMOTION_COLORS[job.dominant_emotion] || '#6366f1' }}
            >
              {job.dominant_emotion}
            </span>
          </div>
        </div>
      )}

      {sortedEmotions.length > 0 && (
        <div className="emotions-section">
          <h3>Emotion Breakdown</h3>
          <div className="emotion-bars">
            {sortedEmotions.map(([emotion, score]) => (
              <div key={emotion} className="emotion-row">
                <span className="emotion-name">{emotion}</span>
                <div className="emotion-bar-track">
                  <div
                    className="emotion-bar-fill"
                    style={{
                      width: `${(score / maxScore) * 100}%`,
                      backgroundColor: EMOTION_COLORS[emotion] || '#94a3b8',
                    }}
                  />
                </div>
                <span className="emotion-score">{score.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="detail-timestamps">
        <span>Created: {formatDate(job.created_at)}</span>
        <span>Completed: {formatDate(job.completed_at)}</span>
      </div>
    </div>
  );
}
