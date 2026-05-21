import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { noiseGLSL } from '../shaders/noise';
import { createParticleData } from '../utils';

const COUNT = 250000;

const vertexShader = /* glsl */ `
${noiseGLSL}
uniform float uTime;
uniform float uMomentum;
attribute float aIndex;
attribute float aRandom;
varying float vAlpha;
varying float vDanger;

void main() {
  float idx = aIndex;
  float total = ${COUNT.toFixed(1)};
  float t = idx / total;

  float sqrtN = sqrt(total);
  float gx = mod(idx, sqrtN) / sqrtN;
  float gy = floor(idx / sqrtN) / sqrtN;
  float x = (gx - 0.5) * 10.0;
  float y = (gy - 0.5) * 10.0;

  float denom = max(abs(uMomentum), 0.001);
  float dist = length(vec2(x, y));
  float singularity = -1.0 / (dist * denom + 0.1);

  float smooth_z = sin(x * 0.5 + uTime * 0.3) * cos(y * 0.5) * 1.5;
  float collapse = 1.0 - smoothstep(0.0, 0.5, abs(uMomentum));
  float z = mix(smooth_z, singularity, collapse);

  float suck = collapse * exp(-dist * 0.3) * 2.0;
  vec3 pos = vec3(x, y, z - suck * 3.0);

  float n = snoise(pos * 0.2 + uTime * 0.1) * 0.2 * (1.0 - collapse * 0.5);
  pos += vec3(0.0, 0.0, n);

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPos;
  gl_PointSize = (2.0 + aRandom * 2.0) * (200.0 / -mvPos.z);

  vAlpha = 0.3 + aRandom * 0.7;
  float dangerDist = exp(-dist * 0.5) * collapse;
  vDanger = dangerDist;
}
`;

const fragmentShader = /* glsl */ `
varying float vAlpha;
varying float vDanger;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float glow = exp(-d * 5.0);

  vec3 cyan = vec3(0.0, 1.0, 1.0);
  vec3 red = vec3(1.0, 0.0, 0.235);
  vec3 color = mix(cyan, red, vDanger);

  gl_FragColor = vec4(color, glow * vAlpha * 0.7);
}
`;

const initialUniforms = {
  uTime: { value: 0 },
  uMomentum: { value: 1.0 },
};

export default function BifurcationTheory({ momentum }) {
  const ref = useRef();
  const matRef = useRef();
  const data = useMemo(() => createParticleData(COUNT, 3), []);

  useFrame((state) => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uMomentum.value = THREE.MathUtils.lerp(
      mat.uniforms.uMomentum.value,
      momentum,
      0.05
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
