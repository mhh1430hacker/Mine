import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Scene from './components/Scene';

export default function App() {
  const [activeChapter, setActiveChapter] = useState(1);

  return (
    <>
      <Sidebar activeChapter={activeChapter} onSelect={setActiveChapter} />
      <Scene chapter={activeChapter} />
    </>
  );
}
