import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { noiseGLSL } from '../shaders/noise';
import { createParticleData } from '../utils';

const COUNT = 200000;

const vertexShader = /* glsl */ `
${noiseGLSL}
uniform float uTime;
attribute float aIndex;
attribute float aRandom;
varying float vAlpha;
varying float vCausal;

void main() {
  float idx = aIndex;
  float total = ${COUNT.toFixed(1)};
  float t = idx / total;

  float streamX = (t - 0.5) * 16.0;
  float wavePhase = streamX * 0.8 + uTime * 0.6;
  float streamY = sin(wavePhase) * 2.0 + cos(wavePhase * 0.7) * 0.8;
  float streamZ = cos(wavePhase * 0.5 + aRandom * 3.14) * 1.0;
  vec3 pos = vec3(streamX, streamY, streamZ);

  float presentX = sin(uTime * 0.15) * 2.0;
  float causal = smoothstep(presentX + 0.5, presentX - 0.5, streamX);

  float pastDist = presentX - streamX;
  float tailGlow = exp(-max(pastDist, 0.0) * 0.3);

  float n = snoise(pos * 0.4 + uTime * 0.2) * 0.15;
  pos += vec3(0.0, n, n * 0.5);

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPos;
  gl_PointSize = (2.5 + aRandom * 2.0) * (180.0 / -mvPos.z) * causal;

  vAlpha = causal * tailGlow;
  vCausal = causal;
}
`;

const fragmentShader = /* glsl */ `
varying float vAlpha;
varying float vCausal;

void main() {
  if (vCausal < 0.01) discard;

  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float glow = exp(-d * 6.0);

  vec3 cyan = vec3(0.0, 1.0, 1.0);
  vec3 dimCyan = vec3(0.0, 0.4, 0.5);
  vec3 color = mix(dimCyan, cyan, vAlpha);

  gl_FragColor = vec4(color, glow * vAlpha * 0.8);
}
`;

const initialUniforms = {
  uTime: { value: 0 },
};

export default function CausalFiniteDiff() {
  const ref = useRef();
  const matRef = useRef();
  const data = useMemo(() => createParticleData(COUNT, 4), []);

  useFrame((state) => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
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
