const API_URL = import.meta.env.VITE_API_URL || '';
const API_KEY = import.meta.env.VITE_API_KEY || '';

const headers: Record<string, string> = {
  'x-api-key': API_KEY,
};

export interface AnalysisJob {
  job_id: string;
  video_key: string;
  status: 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';
  created_at: string;
  completed_at: string | null;
  dominant_emotion: string | null;
  emotions_summary: Record<string, number> | null;
  face_count: number | null;
  frames_sampled: number | null;
  sample_interval_seconds: number | null;
  processing_time_seconds: number | null;
}

export interface AnalysisListResponse {
  items: AnalysisJob[];
  next_key: string | null;
}

export interface EmotionSummary {
  dominant_emotion: string | null;
  emotions_summary: Record<string, number> | null;
}

export interface UploadResponse {
  upload_url: string;
  video_key: string;
  expires_in: number;
}

export async function listAnalyses(limit = 50, lastKey?: string): Promise<AnalysisListResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (lastKey) params.set('last_key', lastKey);
  const res = await fetch(`${API_URL}/analyses?${params}`, { headers });
  if (!res.ok) throw new Error(`Failed to list analyses: ${res.status}`);
  return res.json();
}

export async function getAnalysis(jobId: string): Promise<AnalysisJob> {
  const res = await fetch(`${API_URL}/analyses/${jobId}`, { headers });
  if (!res.ok) throw new Error(`Failed to get analysis: ${res.status}`);
  return res.json();
}

export async function getEmotions(jobId: string): Promise<EmotionSummary> {
  const res = await fetch(`${API_URL}/analyses/${jobId}/emotions`, { headers });
  if (!res.ok) throw new Error(`Failed to get emotions: ${res.status}`);
  return res.json();
}

export async function requestUploadUrl(filename: string): Promise<UploadResponse> {
  const res = await fetch(`${API_URL}/uploads`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename }),
  });
  if (!res.ok) throw new Error(`Failed to get upload URL: ${res.status}`);
  return res.json();
}

export async function uploadFile(
  file: File,
  uploadUrl: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    });
    xhr.addEventListener('error', () => reject(new Error('Upload network error')));
    xhr.send(file);
  });
}
