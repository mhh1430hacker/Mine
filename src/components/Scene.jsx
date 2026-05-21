import { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import PhaseSpace from './PhaseSpace';
import AnalyticalGeometry from './AnalyticalGeometry';
import BifurcationTheory from './BifurcationTheory';
import CausalFiniteDiff from './CausalFiniteDiff';
import FractionalExponents from './FractionalExponents';
import NumericalRegularization from './NumericalRegularization';
import FadingMemory from './FadingMemory';

function SceneContent({ chapter, momentum, regularized, phaseTransition, geoTransition, fracTransition }) {
  return (
    <>
      {chapter === 1 && <PhaseSpace transition={phaseTransition} />}
      {chapter === 2 && <AnalyticalGeometry transition={geoTransition} />}
      {chapter === 3 && <BifurcationTheory momentum={momentum} />}
      {chapter === 4 && <CausalFiniteDiff />}
      {chapter === 5 && <FractionalExponents transition={fracTransition} />}
      {chapter === 6 && <NumericalRegularization regularized={regularized} />}
      {chapter === 7 && <FadingMemory />}
    </>
  );
}

export default function Scene({ chapter }) {
  const [momentum, setMomentum] = useState(1.0);
  const [regularized, setRegularized] = useState(0);
  const [phaseTransition, setPhaseTransition] = useState(0);
  const [geoTransition, setGeoTransition] = useState(0);
  const [fracTransition, setFracTransition] = useState(0);

  const handlePhaseToggle = useCallback(() => {
    setPhaseTransition((p) => (p > 0.5 ? 0 : 1));
  }, []);

  const handleGeoToggle = useCallback(() => {
    setGeoTransition((p) => (p > 0.5 ? 0 : 1));
  }, []);

  const handleFracToggle = useCallback(() => {
    setFracTransition((p) => (p > 0.5 ? 0 : 1));
  }, []);

  const handleRegToggle = useCallback(() => {
    setRegularized((r) => (r > 0.5 ? 0 : 1));
  }, []);

  const cameraPositions = {
    1: [0, 0, 12],
    2: [0, 0, 10],
    3: [8, 6, 8],
    4: [0, 3, 12],
    5: [0, 0, 14],
    6: [8, 6, 8],
    7: [0, 4, 10],
  };

  const camPos = cameraPositions[chapter] || [0, 0, 12];

  return (
    <div className="canvas-container">
      <div className="chapter-indicator">
        Chapter <span>{String(chapter).padStart(2, '0')}</span> / 07
      </div>

      <Canvas
        camera={{ position: camPos, fov: 60, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#050505' }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 15, 40]} />
        <Suspense fallback={null}>
          <SceneContent
            chapter={chapter}
            momentum={momentum}
            regularized={regularized}
            phaseTransition={phaseTransition}
            geoTransition={geoTransition}
            fracTransition={fracTransition}
          />
        </Suspense>
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={30}
          autoRotate
          autoRotateSpeed={0.3}
        />
      </Canvas>

      {/* Chapter-specific controls */}
      {chapter === 1 && (
        <div className="scene-controls">
          <button className="control-btn" onClick={handlePhaseToggle}>
            {phaseTransition > 0.5 ? '← Sine Wave' : 'Phase Space →'}
          </button>
        </div>
      )}

      {chapter === 2 && (
        <div className="scene-controls">
          <button className="control-btn" onClick={handleGeoToggle}>
            {geoTransition > 0.5 ? '← Polar' : 'Cartesian Grid →'}
          </button>
        </div>
      )}

      {chapter === 3 && (
        <div className="slider-container">
          <div className="slider-label">Momentum (dX)</div>
          <div className={`slider-value${momentum < 0.2 ? ' danger' : ''}`}>
            {momentum.toFixed(2)}
          </div>
          <input
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            value={momentum}
            onChange={(e) => setMomentum(parseFloat(e.target.value))}
          />
        </div>
      )}

      {chapter === 5 && (
        <div className="scene-controls">
          <button className="control-btn" onClick={handleFracToggle}>
            {fracTransition > 0.5 ? '← Separate' : 'Fuse Fractions →'}
          </button>
        </div>
      )}

      {chapter === 6 && (
        <div className="scene-controls">
          <button
            className={`control-btn${regularized > 0.5 ? ' danger' : ''}`}
            onClick={handleRegToggle}
          >
            {regularized > 0.5 ? 'Remove Epsilon' : 'Inject ε & p=1.25'}
          </button>
        </div>
      )}
    </div>
  );
}
