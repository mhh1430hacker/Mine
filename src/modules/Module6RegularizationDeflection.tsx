/**
 * Module 6: Regularization Deflection
 * Visualizing Epsilon Suppressor
 * 
 * Arabic: "المرحلة 6: الهندسة العددية والانتظام الحوسبي. حقن عامل الحماية إبسيلون وأس التنعيم 1.25 لمنع الانفجار الحوسبي وكبح ضوضاء التكميم."
 * 
 * DERIVATION VISUALIZATION:
 * - Scene A: No Regularization. dX_N hits perfect 0 (division by zero simulating ADC noise). Particles violently explode in computational artifact bursts.
 * - Scene B: Turn on Epsilon and p=1.25. Show how the particles are deflected away from the singularity point, visually "buffered" from the infinite collapse by the added regularizer and the exponent softening, turning stable and organized.
 */

import React, { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EquationEngine } from '../utils/EquationEngine'
import { DataPoint } from '../utils/FIFOBuffer'

interface Module6RegularizationDeflectionProps {
  onRegularizationToggle?: (isRegularized: boolean) => void
}

const MODULE6_PARTICLE_COUNT = 8000

const Module6RegularizationDeflection: React.FC<Module6RegularizationDeflectionProps> = ({ onRegularizationToggle }) => {
  const meshRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const [isRegularized, setIsRegularized] = useState(false)
  const [epsilon, setEpsilon] = useState(0.01)
  const [p, setP] = useState(1.25)
  const equationEngine = useMemo(() => new EquationEngine(1000, 0.01), [])

  // Generate particle data for regularization comparison
  const particleData = useMemo(() => {
    const points: DataPoint[] = []
    const gridSize = Math.sqrt(MODULE6_PARTICLE_COUNT)
    
    for (let i = 0; i < MODULE6_PARTICLE_COUNT; i++) {
      const ix = i % Math.floor(gridSize)
      const iy = Math.floor(i / gridSize)
      
      const x = (ix / gridSize - 0.5) * 10
      const y = (iy / gridSize - 0.5) * 10
      
      const rSquared = x * x + y * y
      
      // Without regularization: 1 / r² (singular at origin)
      const z_unregularized = 1.0 / (rSquared + 0.0001)
      
      // With regularization: 1 / (r² + epsilon)^p
      const z_regularized = 1.0 / Math.pow(rSquared + epsilon, p)
      
      // Use regularized value
      const z = z_regularized
      
      const dx = -p * 2 * x / Math.pow(rSquared + epsilon, p + 1)
      
      points.push({
        x: x,
        dx: dx,
        t: 0,
        value: z,
        isValid: true
      })
    }

    return equationEngine.dataPointsToParticles(points, {
      colorMode: 'value',
      sizeMode: 'value'
    })
  }, [equationEngine, epsilon, p])

  const handleToggleRegularization = () => {
    const newState = !isRegularized
    setIsRegularized(newState)
    onRegularizationToggle?.(newState)
  }

  useFrame((state: any) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uIsRegularized.value = isRegularized ? 1.0 : 0.0
      materialRef.current.uniforms.uEpsilon.value = epsilon
      materialRef.current.uniforms.uP.value = p
    }
  })

  // Create geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    
    const positions = new Float32Array(MODULE6_PARTICLE_COUNT * 3)
    const colors = new Float32Array(MODULE6_PARTICLE_COUNT * 3)
    const sizes = new Float32Array(MODULE6_PARTICLE_COUNT)
    const distances = new Float32Array(MODULE6_PARTICLE_COUNT)

    for (let i = 0; i < MODULE6_PARTICLE_COUNT; i++) {
      const i3 = i * 3
      
      positions[i3] = particleData[i].position[0]
      positions[i3 + 1] = particleData[i].position[1]
      positions[i3 + 2] = particleData[i].position[2]
      
      colors[i3] = particleData[i].color[0]
      colors[i3 + 1] = particleData[i].color[1]
      colors[i3 + 2] = particleData[i].color[2]
      
      sizes[i] = particleData[i].size
      distances[i] = Math.sqrt(positions[i3] * positions[i3] + positions[i3 + 1] * positions[i3 + 1])
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aDistance', new THREE.BufferAttribute(distances, 1))
    
    return geo
  }, [particleData])

  const vertexShader = `
    uniform float uTime;
    uniform float uIsRegularized;
    uniform float uEpsilon;
    uniform float uP;

    attribute float aSize;
    attribute float aDistance;

    varying vec3 vColor;
    varying float vAlpha;
    varying float vDistance;

    // Simplex noise for explosion effect
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
      vec3 pos = position;
      
      if (uIsRegularized < 0.5) {
        // No regularization: chaotic jitter and explosion
        float jitter = snoise(vec3(pos.x * 2.0, pos.y * 2.0, uTime * 3.0));
        pos += jitter * 0.5;
        
        // Violent explosion near singularity (origin)
        if (aDistance < 1.0) {
          float explosion = (1.0 - aDistance) * 2.0;
          pos += vec3(jitter * explosion, jitter * explosion, jitter * explosion * 2.0);
          vColor = mix(color, vec3(1.0, 0.0, 0.0), explosion);
        } else {
          vColor = color;
        }
      } else {
        // With regularization: deflected and stable
        // Particles are deflected away from singularity
        float deflection = smoothstep(0.0, 2.0, aDistance);
        
        // Visualize the epsilon buffer
        if (aDistance < sqrt(uEpsilon)) {
          // Inside epsilon buffer: deflected
          pos.xy *= (1.0 + uEpsilon);
          vColor = mix(vec3(0.0, 1.0, 1.0), color, deflection);
        } else {
          // Outside: stable
          vColor = color;
        }
        
        // Add subtle organized motion
        float organizedMotion = 0.1 * sin(uTime + pos.x);
        pos.z += organizedMotion;
      }
      
      vDistance = aDistance;
      vAlpha = 1.0;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = aSize * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  const fragmentShader = `
    uniform float uTime;
    uniform float uIsRegularized;
    
    varying vec3 vColor;
    varying float vAlpha;
    varying float vDistance;

    void main() {
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      
      if (dist > 0.5) {
        discard;
      }
      
      float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
      alpha *= vAlpha;
      
      float innerGlow = 1.0 - smoothstep(0.0, 0.3, dist);
      
      // Different glow for regularized vs unregularized
      if (uIsRegularized < 0.5) {
        // Chaotic glow
        innerGlow *= 0.5 + 0.5 * sin(uTime * 10.0 + vDistance);
      } else {
        // Stable glow
        innerGlow *= 1.0;
      }
      
      float pulse = 0.8 + 0.2 * sin(uTime * 2.0 + vDistance);
      
      vec3 color = vColor;
      color += innerGlow * 0.5;
      color *= pulse;
      
      gl_FragColor = vec4(color, alpha);
    }
  `

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uIsRegularized: { value: 0 },
        uEpsilon: { value: epsilon },
        uP: { value: p }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    })
  }, [epsilon, p])

  return (
    <>
      <points ref={meshRef} geometry={geometry} onClick={handleToggleRegularization}>
        <shaderMaterial ref={materialRef} attach="material" args={[material]} />
      </points>
    </>
  )
}

export default Module6RegularizationDeflection
