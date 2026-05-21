import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { noiseGLSL } from '../shaders/noise';
import { seededRandom } from '../utils';

const COUNT = 150000;

function getDigitPoints(digit, offsetX, offsetY, scale, count) {
  const points = [];
  const segments = {
    '2': [[0,0,1,0],[1,0,1,0.5],[1,0.5,0,0.5],[0,0.5,0,1],[0,1,1,1]],
    '3': [[0,0,1,0],[1,0,1,0.5],[0.3,0.5,1,0.5],[1,0.5,1,1],[0,1,1,1]],
    '5': [[1,0,0,0],[0,0,0,0.5],[0,0.5,1,0.5],[1,0.5,1,1],[1,1,0,1]],
    '6': [[1,0,0,0],[0,0,0,1],[0,1,1,1],[1,1,1,0.5],[1,0.5,0,0.5]],
    '/': [[0.8,0,0.2,1]],
    '1': [[0.3,0,0.5,0],[0.5,0,0.5,1],[0.3,1,0.7,1]],
    '0': [[0,0,1,0],[1,0,1,1],[1,1,0,1],[0,1,0,0]],
    '4': [[0,0,0,0.5],[0,0.5,1,0.5],[0.7,0,0.7,1]],
  };
  const segs = segments[digit] || segments['0'];
  const perSeg = Math.floor(count / segs.length);
  for (const seg of segs) {
    for (let i = 0; i < perSeg; i++) {
      const t = i / perSeg;
      const x = (seg[0] + (seg[2] - seg[0]) * t) * scale + offsetX;
      const y = (1.0 - (seg[1] + (seg[3] - seg[1]) * t)) * scale + offsetY;
      points.push(x, y);
    }
  }
  return points;
}

const vertexShader = /* glsl */ `
${noiseGLSL}
uniform float uTime;
uniform float uTransition;
attribute float aIndex;
attribute float aRandom;
attribute vec2 aTargetA;
attribute vec2 aTargetB;
attribute vec2 aTargetC;
varying float vAlpha;
varying float vFlash;

void main() {
  float idx = aIndex;
  float total = ${COUNT.toFixed(1)};
  float t = idx / total;

  float phase = uTransition;
  vec2 posA = aTargetA;
  vec2 posB = aTargetB;
  vec2 posC = aTargetC;
  vec2 pos2d;
  float flash = 0.0;

  if (t < 0.333) {
    pos2d = mix(posA, posC, smoothstep(0.3, 0.9, phase));
    flash = smoothstep(0.4, 0.6, phase) * (1.0 - smoothstep(0.6, 0.8, phase));
  } else if (t < 0.666) {
    pos2d = mix(posB, posC, smoothstep(0.3, 0.9, phase));
    flash = smoothstep(0.4, 0.6, phase) * (1.0 - smoothstep(0.6, 0.8, phase));
  } else {
    float appear = smoothstep(0.5, 0.9, phase);
    pos2d = posC;
    pos2d += (1.0 - appear) * vec2(sin(idx) * 5.0, cos(idx) * 5.0);
    flash = smoothstep(0.5, 0.7, phase) * (1.0 - smoothstep(0.7, 0.9, phase));
  }

  float n = snoise(vec3(pos2d * 0.5, uTime * 0.3)) * 0.12;
  vec3 pos = vec3(pos2d.x + n, pos2d.y + n, sin(uTime * 0.2 + t * 6.28) * 0.3);

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPos;
  gl_PointSize = (2.5 + aRandom * 2.0) * (180.0 / -mvPos.z);

  vAlpha = 0.4 + aRandom * 0.6;
  vFlash = flash;
}
`;

const fragmentShader = /* glsl */ `
varying float vAlpha;
varying float vFlash;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float glow = exp(-d * 5.0);

  vec3 cyan = vec3(0.0, 1.0, 1.0);
  vec3 white = vec3(1.0, 1.0, 1.0);
  vec3 color = mix(cyan, white, vFlash * 0.8 + glow * 0.1);

  float alpha = glow * vAlpha * (0.6 + vFlash * 0.8);
  gl_FragColor = vec4(color, alpha);
}
`;

const initialUniforms = {
  uTime: { value: 0 },
  uTransition: { value: 0 },
};

function buildFractionData() {
  const rng = seededRandom(5);
  const positions = new Float32Array(COUNT * 3);
  const indices = new Float32Array(COUNT);
  const randoms = new Float32Array(COUNT);
  const targetA = new Float32Array(COUNT * 2);
  const targetB = new Float32Array(COUNT * 2);
  const targetC = new Float32Array(COUNT * 2);

  const third = Math.floor(COUNT / 3);
  const ptsA = getDigitPoints('2', -4, 0.5, 2, third / 2)
    .concat(getDigitPoints('/', -2, 0, 2, third / 4))
    .concat(getDigitPoints('3', -1, -1.5, 2, third / 4));
  const ptsB = getDigitPoints('1', 2, 0.5, 2, third / 2)
    .concat(getDigitPoints('/', 4, 0, 2, third / 4))
    .concat(getDigitPoints('6', 5, -1.5, 2, third / 4));
  const ptsC = getDigitPoints('5', -2, 0.5, 2.5, third / 2)
    .concat(getDigitPoints('/', 0.5, 0, 2.5, third / 4))
    .concat(getDigitPoints('1', 1.5, -1.5, 2.5, third / 8))
    .concat(getDigitPoints('2', 3, -1.5, 2.5, third / 8));

  const sinLookup = (v) => Math.sin(v);
  const cosLookup = (v) => Math.cos(v);

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;
    indices[i] = i;
    randoms[i] = rng();

    const ai = (i * 2) % ptsA.length;
    targetA[i * 2] = ptsA[ai] ?? (sinLookup(i * 0.1) * 1.5 - 3);
    targetA[i * 2 + 1] = ptsA[ai + 1] ?? (cosLookup(i * 0.1) * 1.5);

    const bi = (i * 2) % ptsB.length;
    targetB[i * 2] = ptsB[bi] ?? (sinLookup(i * 0.2) * 1.5 + 3);
    targetB[i * 2 + 1] = ptsB[bi + 1] ?? (cosLookup(i * 0.2) * 1.5);

    const ci = (i * 2) % ptsC.length;
    targetC[i * 2] = ptsC[ci] ?? (sinLookup(i * 0.15) * 1.5);
    targetC[i * 2 + 1] = ptsC[ci + 1] ?? (cosLookup(i * 0.15) * 1.5);
  }

  return { positions, indices, randoms, targetA, targetB, targetC };
}

export default function FractionalExponents({ transition }) {
  const ref = useRef();
  const matRef = useRef();
  const data = useMemo(() => buildFractionData(), []);

  useFrame((state) => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uTransition.value = THREE.MathUtils.lerp(
      mat.uniforms.uTransition.value,
      transition,
      0.02
    );
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={data.positions} count={COUNT} itemSize={3} />
        <bufferAttribute attach="attributes-aIndex" array={data.indices} count={COUNT} itemSize={1} />
        <bufferAttribute attach="attributes-aRandom" array={data.randoms} count={COUNT} itemSize={1} />
        <bufferAttribute attach="attributes-aTargetA" array={data.targetA} count={COUNT} itemSize={2} />
        <bufferAttribute attach="attributes-aTargetB" array={data.targetB} count={COUNT} itemSize={2} />
        <bufferAttribute attach="attributes-aTargetC" array={data.targetC} count={COUNT} itemSize={2} />
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
