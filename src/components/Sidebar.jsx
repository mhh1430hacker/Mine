import { chapters } from '../chapters';

export default function Sidebar({ activeChapter, onSelect }) {
  const active = chapters.find((c) => c.id === activeChapter);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>FDA Particle Lab</h1>
        <div className="subtitle">Metastable Systems Dynamics</div>
      </div>

      <div className="chapters-list">
        {chapters.map((ch) => (
          <div
            key={ch.id}
            className={`chapter-card${activeChapter === ch.id ? ' active' : ''}`}
            onClick={() => onSelect(ch.id)}
          >
            <div className="chapter-number">Chapter {String(ch.id).padStart(2, '0')}</div>
            <div className="chapter-title-ar">{ch.titleAr}</div>
            <div className="chapter-title-en">{ch.titleEn}</div>
          </div>
        ))}
      </div>

      {active && (
        <div className="description-panel">
          <div className="desc-label">Description</div>
          <div className="desc-text">{active.description}</div>
        </div>
      )}
    </div>
  );
}
