import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { noiseGLSL } from '../shaders/noise';
import { createParticleData } from '../utils';

const COUNT = 220000;

const vertexShader = /* glsl */ `
${noiseGLSL}
uniform float uTime;
uniform float uRegularized;
attribute float aIndex;
attribute float aRandom;
varying float vAlpha;
varying float vChaos;

void main() {
  float idx = aIndex;
  float total = ${COUNT.toFixed(1)};
  float t = idx / total;

  float sqrtN = sqrt(total);
  float gx = mod(idx, sqrtN) / sqrtN;
  float gy = floor(idx / sqrtN) / sqrtN;
  float x = (gx - 0.5) * 12.0;
  float y = (gy - 0.5) * 12.0;

  float smoothZ = sin(x * 0.4) * cos(y * 0.4) * 2.0 +
                  sin(x * 0.7 + y * 0.3) * 1.0;

  float chaos = 1.0 - uRegularized;
  float quantNoise = fract(sin(idx * 12.9898 + uTime * 50.0) * 43758.5453) * 2.0 - 1.0;
  float divZero = 1.0 / (length(vec2(x, y)) * 0.3 + 0.01 * (1.0 - chaos) + 0.001);
  float chaosZ = quantNoise * 3.0 * chaos + divZero * chaos * 0.5;

  float epsilon = 0.1 * uRegularized;
  float safeDiv = 1.0 / (length(vec2(x, y)) * 0.3 + epsilon + 0.1);
  float regZ = smoothZ + safeDiv * 0.2;
  float pSmooth = pow(abs(regZ) + 0.001, 1.0 / 1.25) * sign(regZ);
  regZ = mix(regZ, pSmooth, uRegularized * 0.5);

  float z = mix(smoothZ + chaosZ, regZ, uRegularized);

  float n = snoise(vec3(x * 0.3, y * 0.3, uTime * 0.2)) * 0.15 * uRegularized;
  z += n;

  vec3 pos = vec3(x, y, z);

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPos;

  float jitter = chaos * (fract(sin(idx * 43.12 + uTime * 100.0) * 9812.0) - 0.5) * 4.0;
  gl_PointSize = max(1.0, (2.0 + aRandom * 2.0 + abs(jitter) * 0.5) * (180.0 / -mvPos.z));

  vAlpha = 0.3 + aRandom * 0.7;
  vChaos = chaos;
}
`;

const fragmentShader = /* glsl */ `
varying float vAlpha;
varying float vChaos;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float glow = exp(-d * 5.0);

  vec3 cyan = vec3(0.0, 1.0, 1.0);
  vec3 red = vec3(1.0, 0.0, 0.235);
  vec3 calm = vec3(0.3, 0.9, 1.0);
  vec3 color = mix(calm, mix(cyan, red, vChaos * 0.6), 0.5 + vChaos * 0.5);

  gl_FragColor = vec4(color, glow * vAlpha * 0.7);
}
`;

const initialUniforms = {
  uTime: { value: 0 },
  uRegularized: { value: 0 },
};

export default function NumericalRegularization({ regularized }) {
  const ref = useRef();
  const matRef = useRef();
  const data = useMemo(() => createParticleData(COUNT, 6), []);

  useFrame((state) => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uRegularized.value = THREE.MathUtils.lerp(
      mat.uniforms.uRegularized.value,
      regularized,
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
