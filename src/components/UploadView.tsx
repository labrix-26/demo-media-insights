import { useCallback, useRef, useState } from 'react';
import { requestUploadUrl, uploadFile } from '../api';

interface Props {
  onUploadComplete: () => void;
}

export function UploadView({ onUploadComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'signing' | 'uploading' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith('video/')) {
      setError('Please select a video file.');
      return;
    }
    setFile(f);
    setError(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      setPhase('signing');
      const { upload_url } = await requestUploadUrl(file.name);
      setPhase('uploading');
      await uploadFile(file, upload_url, setProgress);
      setPhase('done');
      setTimeout(onUploadComplete, 1500);
    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <h2>Upload Video</h2>
        <p className="view-desc">Upload a video file to analyze facial emotions. Supported formats: MP4, MOV, AVI, WebM.</p>
      </div>

      <div className="upload-card">
        <div
          className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {!file ? (
            <>
              <div className="drop-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="drop-text">Drag and drop a video file here</p>
              <p className="drop-hint">or click to browse</p>
            </>
          ) : (
            <div className="file-info">
              <div className="file-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <div className="file-details">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatSize(file.size)}</span>
              </div>
              {!uploading && (
                <button
                  className="btn-text"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          )}
        </div>

        {uploading && (
          <div className="upload-progress">
            <div className="progress-header">
              <span className="progress-label">
                {phase === 'signing' && 'Preparing upload...'}
                {phase === 'uploading' && `Uploading — ${progress}%`}
                {phase === 'done' && 'Upload complete'}
                {phase === 'error' && 'Upload failed'}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-fill ${phase === 'done' ? 'success' : ''}`}
                style={{ width: `${phase === 'signing' ? 5 : progress}%` }}
              />
            </div>
            {phase === 'done' && (
              <p className="progress-note">Analysis started. Redirecting to results...</p>
            )}
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <div className="upload-actions">
          <button
            className="btn btn-primary"
            disabled={!file || uploading}
            onClick={handleUpload}
          >
            {uploading ? 'Uploading...' : 'Start Analysis'}
          </button>
        </div>
      </div>
    </div>
  );
}
