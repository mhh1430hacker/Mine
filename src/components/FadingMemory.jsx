import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { noiseGLSL } from '../shaders/noise';
import { createParticleData } from '../utils';

const COUNT = 250000;

const vertexShader = /* glsl */ `
${noiseGLSL}
uniform float uTime;
attribute float aIndex;
attribute float aRandom;
varying float vAlpha;
varying float vAge;

void main() {
  float idx = aIndex;
  float total = ${COUNT.toFixed(1)};
  float t = idx / total;

  float headAngle = uTime * 0.4;
  float headR = 3.0;
  vec3 headPos = vec3(
    cos(headAngle) * headR,
    sin(headAngle * 0.7) * 2.0,
    sin(headAngle) * headR
  );

  float age = t * 8.0;
  float pastAngle = headAngle - age * 0.4;
  float pastR = headR + sin(age * 0.5) * 0.5;
  vec3 pastPos = vec3(
    cos(pastAngle) * pastR,
    sin(pastAngle * 0.7) * 2.0,
    sin(pastAngle) * pastR
  );

  vec3 pos;
  float ageDecay;

  if (t < 0.1) {
    float phi = aRandom * 6.2831853;
    float cosTheta = aRandom * 2.0 - 1.0;
    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
    float r = pow(fract(sin(idx * 78.233) * 43758.5453), 0.333) * 0.6;
    pos = headPos + vec3(
      sinTheta * cos(phi) * r,
      sinTheta * sin(phi) * r,
      cosTheta * r
    );
    ageDecay = 1.0;
  } else {
    pos = pastPos;
    float spread = age * 0.08;
    float noise1 = snoise(vec3(idx * 0.01, uTime * 0.1, 0.0));
    float noise2 = snoise(vec3(idx * 0.01, 0.0, uTime * 0.1));
    pos += vec3(noise1, noise2, noise1 * noise2) * spread;
    ageDecay = exp(-age * 0.5);
  }

  float n = snoise(pos * 0.3 + uTime * 0.15) * 0.1;
  pos += normalize(pos + 0.001) * n * ageDecay;

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPos;
  gl_PointSize = (2.0 + aRandom * 3.0 * ageDecay) * (200.0 / -mvPos.z);

  vAlpha = ageDecay * (0.3 + aRandom * 0.7);
  vAge = 1.0 - ageDecay;
}
`;

const fragmentShader = /* glsl */ `
varying float vAlpha;
varying float vAge;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float glow = exp(-d * 5.0);

  vec3 brightCyan = vec3(0.0, 1.0, 1.0);
  vec3 dimBlue = vec3(0.0, 0.2, 0.4);
  vec3 color = mix(brightCyan, dimBlue, vAge);

  float alpha = glow * vAlpha * 0.8;
  if (alpha < 0.01) discard;

  gl_FragColor = vec4(color, alpha);
}
`;

const initialUniforms = {
  uTime: { value: 0 },
};

export default function FadingMemory() {
  const ref = useRef();
  const matRef = useRef();
  const data = useMemo(() => createParticleData(COUNT, 7), []);

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
