import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { noiseGLSL } from '../shaders/noise';
import { createParticleData } from '../utils';

const COUNT = 180000;

const vertexShader = /* glsl */ `
${noiseGLSL}
uniform float uTime;
uniform float uTransition;
attribute float aIndex;
attribute float aRandom;
varying float vAlpha;
varying float vGrid;

void main() {
  float idx = aIndex;
  float total = ${COUNT.toFixed(1)};
  float t = idx / total;

  float rings = 8.0;
  float ring = floor(t * rings);
  float ringT = fract(t * rings);
  float angle = ringT * 6.2831853;
  float radius = (ring + 1.0) * 0.4;
  float polarX = cos(angle) * radius;
  float polarY = sin(angle) * radius;
  float polarZ = sin(angle * 3.0 + uTime) * 0.2;
  vec3 polarPos = vec3(polarX, polarY, polarZ);

  float gridSize = 14.0;
  float sqrtCount = sqrt(total);
  float gx = mod(idx, sqrtCount) / sqrtCount;
  float gy = floor(idx / sqrtCount) / sqrtCount;
  float cartX = (gx - 0.5) * gridSize;
  float cartY = (gy - 0.5) * gridSize;
  vec3 cartPos = vec3(cartX, cartY, 0.0);

  vec3 pos = mix(polarPos, cartPos, uTransition);

  float n = snoise(pos * 0.5 + uTime * 0.15) * 0.08 * (1.0 - uTransition * 0.7);
  pos += vec3(n);

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPos;
  gl_PointSize = (2.5 + aRandom * 1.5) * (180.0 / -mvPos.z);

  vAlpha = 0.3 + aRandom * 0.7;
  vGrid = uTransition;
}
`;

const fragmentShader = /* glsl */ `
varying float vAlpha;
varying float vGrid;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float glow = exp(-d * 6.0);

  vec3 cyan = vec3(0.0, 1.0, 1.0);
  vec3 white = vec3(0.7, 0.95, 1.0);
  float snap = smoothstep(0.7, 1.0, vGrid);
  vec3 color = mix(cyan, white, snap * 0.5 + glow * 0.2);
  float alpha = glow * vAlpha * (0.6 + snap * 0.4);

  gl_FragColor = vec4(color, alpha);
}
`;

const initialUniforms = {
  uTime: { value: 0 },
  uTransition: { value: 0 },
};

export default function AnalyticalGeometry({ transition }) {
  const ref = useRef();
  const matRef = useRef();
  const data = useMemo(() => createParticleData(COUNT, 2), []);

  useFrame((state) => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uTransition.value = THREE.MathUtils.lerp(
      mat.uniforms.uTransition.value,
      transition,
      0.04
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
