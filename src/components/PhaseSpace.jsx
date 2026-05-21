import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { noiseGLSL } from '../shaders/noise';
import { createParticleData } from '../utils';

const COUNT = 200000;

const vertexShader = /* glsl */ `
${noiseGLSL}
uniform float uTime;
uniform float uTransition;
attribute float aIndex;
attribute float aRandom;
varying float vAlpha;
varying float vPhase;

void main() {
  float idx = aIndex;
  float total = ${COUNT.toFixed(1)};
  float t = idx / total;

  // Sine wave state (time vs X)
  float sineX = (t - 0.5) * 12.0;
  float sineY = sin(sineX * 1.5 + uTime * 0.5) * 2.0;
  vec3 sinePos = vec3(sineX, sineY, 0.0);

  // Phase space state (X vs dX — circular attractor)
  float angle = t * 6.2831853 * 3.0 + uTime * 0.3;
  float radius = 2.5 + sin(t * 20.0 + uTime) * 0.3;
  float phaseX = cos(angle) * radius;
  float phaseY = sin(angle) * radius;
  float phaseZ = sin(t * 10.0 + uTime * 0.5) * 0.5;
  vec3 phasePos = vec3(phaseX, phaseY, phaseZ);

  vec3 pos = mix(sinePos, phasePos, uTransition);

  float n = snoise(pos * 0.3 + uTime * 0.2) * 0.15;
  pos += normalize(pos + 0.001) * n;

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPos;
  gl_PointSize = (3.0 + aRandom * 2.0) * (200.0 / -mvPos.z);

  vAlpha = 0.4 + aRandom * 0.6;
  vPhase = uTransition;
}
`;

const fragmentShader = /* glsl */ `
varying float vAlpha;
varying float vPhase;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float glow = exp(-d * 6.0);

  vec3 cyan = vec3(0.0, 1.0, 1.0);
  vec3 white = vec3(1.0);
  vec3 color = mix(cyan, white, glow * 0.3);

  gl_FragColor = vec4(color, glow * vAlpha * 0.8);
}
`;

const initialUniforms = {
  uTime: { value: 0 },
  uTransition: { value: 0 },
};

export default function PhaseSpace({ transition }) {
  const ref = useRef();
  const matRef = useRef();
  const data = useMemo(() => createParticleData(COUNT, 1), []);

  useFrame((state) => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uTransition.value = THREE.MathUtils.lerp(
      mat.uniforms.uTransition.value,
      transition,
      0.03
    );
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={data.positions} count={COUNT} itemSize={3} />
        <bufferAttribute attach="attributes-aIndex" array={data.indices} count={COUNT} itemSize={1} />
        <bufferAttribute attach="attributes-aRandom" array={data.randoms} count={COUNT} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={initialUniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
