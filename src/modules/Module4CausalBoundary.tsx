/**
 * Module 4: Causal Boundary
 * Visualizing FIFO & Backward Difference
 * 
 * Arabic: "المرحلة 4: الفروق المحدودة والتحليل العددي السببي. كيف تحسب المشتقات لحظة بلحظة دون معرفة المستقبل؟ يضمن الحفاظ على السببية الصارمة لمنع تسريب البيانات زمنياً."
 * 
 * DERIVATION VISUALIZATION:
 * - A data stream of particles flows left to right.
 * - Highlight a strict, glowing "FIFO Buffer Plane" of length 'w'. The calculation of dX_N must only be visibly computed based on particles *inside* this glowing plane (X(t) - X(t-1)).
 * - To the right of the plane (the Future), the grid is pitch black and undefined, physically proving that future data leakage is impossible.
 */

import React, { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EquationEngine } from '../utils/EquationEngine'
import { DataPoint } from '../utils/FIFOBuffer'

interface Module4CausalBoundaryProps {
  onBoundaryChange?: () => void
}

const MODULE4_PARTICLE_COUNT = 6000
const FIFO_WINDOW = 100

const Module4CausalBoundary: React.FC<Module4CausalBoundaryProps> = ({ onBoundaryChange }) => {
  const meshRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const [windowPosition, setWindowPosition] = useState(0)
  const equationEngine = useMemo(() => new EquationEngine(FIFO_WINDOW, 0.01), [])

  // Generate causal data stream
  const particleData = useMemo(() => {
    const points: DataPoint[] = []
    
    for (let i = 0; i < MODULE4_PARTICLE_COUNT; i++) {
      const t = (i / MODULE4_PARTICLE_COUNT) * 10 - 5
      const x = t
      const y = Math.sin(t * 2) * 2
      
      // Compute backward difference (causal derivative)
      // dX_N = X(t) - X(t-1)
      const previousY = Math.sin((t - 0.01) * 2) * 2
      const dy = y - previousY
      
      points.push({
        x: x,
        dx: dy,
        t: t,
        value: y,
        isValid: true
      })
    }

    return equationEngine.dataPointsToParticles(points, {
      colorMode: 'velocity',
      sizeMode: 'uniform'
    })
  }, [equationEngine])

  useFrame((state: any) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uWindowPosition.value = windowPosition
      materialRef.current.uniforms.uFIFOSize.value = FIFO_WINDOW
    }
  })

  // Create geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    
    const positions = new Float32Array(MODULE4_PARTICLE_COUNT * 3)
    const colors = new Float32Array(MODULE4_PARTICLE_COUNT * 3)
    const sizes = new Float32Array(MODULE4_PARTICLE_COUNT)
    const timeValues = new Float32Array(MODULE4_PARTICLE_COUNT)

    for (let i = 0; i < MODULE4_PARTICLE_COUNT; i++) {
      const i3 = i * 3
      
      positions[i3] = particleData[i].position[0]
      positions[i3 + 1] = particleData[i].position[1]
      positions[i3 + 2] = particleData[i].position[2]
      
      colors[i3] = particleData[i].color[0]
      colors[i3 + 1] = particleData[i].color[1]
      colors[i3 + 2] = particleData[i].color[2]
      
      sizes[i] = particleData[i].size
      timeValues[i] = particleData[i].position[0] // Store x position as time
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aTime', new THREE.BufferAttribute(timeValues, 1))
    
    return geo
  }, [particleData])

  const vertexShader = `
    uniform float uTime;
    uniform float uWindowPosition;
    uniform float uFIFOSize;

    attribute float aSize;
    attribute float aTime;

    varying vec3 vColor;
    varying float vAlpha;
    varying float vDistance;
    varying float vInWindow;

    void main() {
      vec3 pos = position;
      
      // FIFO Buffer Plane: glowing region where computation is valid
      float windowStart = uWindowPosition - uFIFOSize * 0.01;
      float windowEnd = uWindowPosition;
      
      // Check if particle is inside FIFO window
      float inWindow = step(windowStart, pos.x) * step(pos.x, windowEnd);
      vInWindow = inWindow;
      
      // Particles to the right (future) are pitch black and undefined
      float isFuture = step(windowEnd, pos.x);
      
      if (isFuture > 0.5) {
        // Future: pitch black, undefined
        vAlpha = 0.0;
        vColor = vec3(0.0, 0.0, 0.0);
      } else if (inWindow > 0.5) {
        // Inside FIFO window: glowing, valid computation
        vAlpha = 1.0;
        vColor = color;
        
        // Add glow effect for particles in window
        pos.z += 0.5 * sin(uTime * 3.0 + pos.x * 2.0);
      } else {
        // Past: dimmed but visible
        vAlpha = 0.3;
        vColor = color * 0.5;
      }
      
      // Animate window position
      pos.x += sin(uTime * 0.5) * 0.5;
      
      vDistance = length(pos.xy);
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = aSize * (inWindow * 1.5 + 0.5) * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  const fragmentShader = `
    uniform float uTime;
    
    varying vec3 vColor;
    varying float vAlpha;
    varying float vDistance;
    varying float vInWindow;

    void main() {
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      
      if (dist > 0.5) {
        discard;
      }
      
      float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
      alpha *= vAlpha;
      
      // Extra glow for particles in FIFO window
      float innerGlow = 1.0 - smoothstep(0.0, 0.3, dist);
      if (vInWindow > 0.5) {
        innerGlow *= 1.5;
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
        uWindowPosition: { value: 0 },
        uFIFOSize: { value: FIFO_WINDOW }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    })
  }, [])

  return (
    <>
      <points ref={meshRef} geometry={geometry}>
        <shaderMaterial ref={materialRef} attach="material" args={[material]} />
      </points>
      {/* FIFO Buffer Plane visualization */}
      <mesh position={[windowPosition, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[0.1, 10]} />
        <meshBasicMaterial color={[0, 1, 1]} transparent opacity={0.3} />
      </mesh>
    </>
  )
}

export default Module4CausalBoundary
