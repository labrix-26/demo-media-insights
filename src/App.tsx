import { useState } from 'react';
import { UploadView } from './components/UploadView';
import { AnalysisList } from './components/AnalysisList';
import { AnalysisDetail } from './components/AnalysisDetail';

type View = 'upload' | 'list' | 'detail';

export default function App() {
  const [view, setView] = useState<View>('list');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const navigateToDetail = (jobId: string) => {
    setSelectedJobId(jobId);
    setView('detail');
  };

  const navigateToList = () => {
    setRefreshKey((k) => k + 1);
    setView('list');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="header-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <div>
              <h1>Media Insights</h1>
              <span className="header-subtitle">Video Emotion Analysis Platform</span>
            </div>
          </div>
          <nav className="header-nav">
            <button
              className={`nav-btn ${view === 'list' ? 'active' : ''}`}
              onClick={navigateToList}
            >
              Analyses
            </button>
            <button
              className={`nav-btn ${view === 'upload' ? 'active' : ''}`}
              onClick={() => setView('upload')}
            >
              Upload
            </button>
          </nav>
        </div>
      </header>
      <main className="app-main">
        {view === 'upload' && (
          <UploadView onUploadComplete={navigateToList} />
        )}
        {view === 'list' && (
          <AnalysisList
            key={refreshKey}
            onSelect={navigateToDetail}
          />
        )}
        {view === 'detail' && selectedJobId && (
          <AnalysisDetail jobId={selectedJobId} onBack={navigateToList} />
        )}
      </main>
    </div>
  );
}
