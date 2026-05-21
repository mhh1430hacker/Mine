import React from 'react'
import { Chapter } from '../types'

interface SidebarProps {
  chapters: Chapter[]
  activeChapter: Chapter | null
  onSelectChapter: (chapter: Chapter) => void
  momentum: number
  onMomentumChange: (value: number) => void
  isRegularized: boolean
  onRegularize: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
  chapters,
  activeChapter,
  onSelectChapter,
  momentum,
  onMomentumChange,
  isRegularized,
  onRegularize,
}) => {
  return (
    <div className="w-96 h-full bg-lab-black border-l border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-lab-cyan mb-2">FDA Metastable</h1>
        <h2 className="text-lg text-gray-400">Particle Lab</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chapters.map((chapter) => (
          <button
            key={chapter.id}
            onClick={() => onSelectChapter(chapter)}
            className={`w-full text-right p-4 rounded-lg transition-all duration-300 ${
              activeChapter?.id === chapter.id
                ? 'bg-lab-cyan/20 border-2 border-lab-cyan shadow-lg shadow-lab-cyan/20'
                : 'bg-gray-900/50 border border-gray-800 hover:border-lab-cyan/50 hover:bg-gray-800/50'
            }`}
          >
            <div className="text-sm text-gray-500 mb-1">Chapter {chapter.id}</div>
            <div className={`text-lg font-bold mb-2 ${
              activeChapter?.id === chapter.id ? 'text-lab-cyan' : 'text-white'
            }`}>
              {chapter.title}
            </div>
            <div className="text-xs text-gray-400 mb-3">{chapter.subtitle}</div>
            {activeChapter?.id === chapter.id && (
              <div className="text-sm text-gray-300 leading-relaxed border-t border-gray-700 pt-3 mt-3">
                {chapter.description}
              </div>
            )}
          </button>
        ))}
      </div>

      {activeChapter?.id === 3 && (
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <label className="block text-sm text-lab-cyan mb-2">Momentum (dX)</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={momentum}
            onChange={(e) => onMomentumChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-lab-cyan"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0 (Singularity)</span>
            <span>{momentum.toFixed(2)}</span>
            <span>1 (Stable)</span>
          </div>
        </div>
      )}

      {activeChapter?.id === 6 && (
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <button
            onClick={onRegularize}
            className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-300 ${
              isRegularized
                ? 'bg-lab-cyan text-lab-black shadow-lg shadow-lab-cyan/30'
                : 'bg-lab-red text-white shadow-lg shadow-lab-red/30 hover:bg-red-600'
            }`}
          >
            {isRegularized ? '✓ Regularized' : 'Inject Epsilon & p=1.25'}
          </button>
        </div>
      )}

      <div className="p-4 border-t border-gray-800 text-xs text-gray-600">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-lab-cyan"></div>
          <span>Stable Energy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-lab-red"></div>
          <span>Singularity/Collapse</span>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
