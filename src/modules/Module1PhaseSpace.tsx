/**
 * Module 1: Phase Space Theatre
 * Deriving X vs dX
 * 
 * Arabic: "المرحلة 1: فضاء الطور والجاذبات الديناميكية. الرياضيات التقليدية تدرس الإشارة مع الزمن، أما هندسة الأنظمة فتدرس (الحالة ضد التغير). كيف نلغي محور الزمن، لنجعل المحور الأفقي هو (X_N) والعمودي هو المشتقة."
 * 
 * DERIVATION VISUALIZATION:
 * - Scene A: Particles plot a glowing Sin(t) wave (Time on X, Amplitude on Y).
 * - Transition: A FIFO window of length 'w' is highlighted. We "record" the particles' (y) and (dy/dt) values from this window.
 * - Scene B: The Time-axis violently snaps and dissolves into dust. X-axis becomes X_N, Y-axis becomes dX_N. The recorded particles swirl to form a clean, glowing circular orbit (Causal Phase Portrait). Particles move along this orbit, representing changing system state.
 */

import React, { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EquationEngine } from '../utils/EquationEngine'
import { DataPoint } from '../utils/FIFOBuffer'

interface Module1PhaseSpaceProps {
  onTransitionComplete?: () => void
}

const MODULE1_PARTICLE_COUNT = 5000
const FIFO_WINDOW_SIZE = 100

const Module1PhaseSpace: React.FC<Module1PhaseSpaceProps> = ({ onTransitionComplete }) => {
  const meshRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const [scene, setScene] = useState<'time-domain' | 'transition' | 'phase-space'>('time-domain')
  const [transitionProgress, setTransitionProgress] = useState(0)
  const equationEngine = useMemo(() => new EquationEngine(FIFO_WINDOW_SIZE, 0.01), [])

  // Generate particle data for both scenes
  const particleData = useMemo(() => {
    // Scene A: Time domain - Sin(t) wave
    const timeDomainPoints: DataPoint[] = []
    for (let i = 0; i < MODULE1_PARTICLE_COUNT; i++) {
      const t = (i / MODULE1_PARTICLE_COUNT) * 10 - 5
      const x = t
      const y = Math.sin(t * 2) * 2
      const dy = 2 * Math.cos(t * 2) * 2 // derivative of sin(2t)*2
      
      timeDomainPoints.push({
        x: x,
        dx: dy,
        t: t,
        value: y,
        isValid: true
      })
    }

    // Scene B: Phase space - X vs dX orbit
    const phaseSpacePoints: DataPoint[] = []
    for (let i = 0; i < MODULE1_PARTICLE_COUNT; i++) {
      const angle = (i / MODULE1_PARTICLE_COUNT) * Math.PI * 2
      const radius = 2
      const x = radius * Math.cos(angle)
      const dx = radius * Math.sin(angle) // This is dX in phase space
      
      phaseSpacePoints.push({
        x: x,
        dx: dx,
        t: angle,
        value: Math.sqrt(x * x + dx * dx),
        isValid: true
      })
    }

    // Convert to particle states
    const timeDomainParticles = equationEngine.dataPointsToParticles(timeDomainPoints, {
      colorMode: 'value',
      sizeMode: 'uniform'
    })

    const phaseSpaceParticles = equationEngine.dataPointsToParticles(phaseSpacePoints, {
      colorMode: 'phase',
      sizeMode: 'uniform'
    })

    return {
      timeDomain: timeDomainParticles,
      phaseSpace: phaseSpaceParticles
    }
  }, [equationEngine])

  // Handle transition animation
  useEffect(() => {
    if (scene === 'transition') {
      const interval = setInterval(() => {
        setTransitionProgress(prev => {
          const next = prev + 0.02
          if (next >= 1) {
            setScene('phase-space')
            onTransitionComplete?.()
            return 1
          }
          return next
        })
      }, 16)
      return () => clearInterval(interval)
    }
  }, [scene, onTransitionComplete])

  useFrame((state: any) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uTransition.value = transitionProgress
      materialRef.current.uniforms.uScene.value = scene === 'time-domain' ? 0 : scene === 'transition' ? 1 : 2
    }
  })

  // Create geometry with both initial and target positions
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    
    const positions = new Float32Array(MODULE1_PARTICLE_COUNT * 3)
    const targetPositions = new Float32Array(MODULE1_PARTICLE_COUNT * 3)
    const colors = new Float32Array(MODULE1_PARTICLE_COUNT * 3)
    const sizes = new Float32Array(MODULE1_PARTICLE_COUNT)
    const alphas = new Float32Array(MODULE1_PARTICLE_COUNT)

    for (let i = 0; i < MODULE1_PARTICLE_COUNT; i++) {
      const i3 = i * 3
      
      // Time domain positions (initial)
      positions[i3] = particleData.timeDomain[i].position[0]
      positions[i3 + 1] = particleData.timeDomain[i].position[1]
      positions[i3 + 2] = particleData.timeDomain[i].position[2]
      
      // Phase space positions (target)
      targetPositions[i3] = particleData.phaseSpace[i].position[0]
      targetPositions[i3 + 1] = particleData.phaseSpace[i].position[1]
      targetPositions[i3 + 2] = particleData.phaseSpace[i].position[2]
      
      // Colors
      colors[i3] = particleData.timeDomain[i].color[0]
      colors[i3 + 1] = particleData.timeDomain[i].color[1]
      colors[i3 + 2] = particleData.timeDomain[i].color[2]
      
      // Sizes and alphas
      sizes[i] = particleData.timeDomain[i].size
      alphas[i] = particleData.timeDomain[i].alpha
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aTargetPosition', new THREE.BufferAttribute(targetPositions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))
    
    return geo
  }, [particleData])

  const vertexShader = `
    uniform float uTime;
    uniform float uTransition;
    uniform int uScene;

    attribute vec3 aTargetPosition;
    attribute float aSize;
    attribute float aAlpha;

    varying vec3 vColor;
    varying float vAlpha;
    varying float vDistance;

    void main() {
      vec3 pos = position;
      
      // Scene 0: Time domain (Sin wave)
      // Scene 1: Transition (swirling)
      // Scene 2: Phase space (orbit)
      
      if (uScene == 1) {
        // Transition: swirl particles
        float angle = uTransition * 6.28318;
        float swirlRadius = length(pos.xy);
        float swirlAngle = atan(pos.y, pos.x) + angle * 0.5;
        
        pos.x = swirlRadius * cos(swirlAngle);
        pos.y = swirlRadius * sin(swirlAngle);
        
        // Mix towards phase space
        pos = mix(pos, aTargetPosition, uTransition);
      } else if (uScene == 2) {
        // Phase space: particles orbit
        pos = aTargetPosition;
        
        // Add orbital motion
        float orbitSpeed = 1.0;
        float orbitAngle = uTime * orbitSpeed;
        float r = length(pos.xy);
        float currentAngle = atan(pos.y, pos.x);
        
        pos.x = r * cos(currentAngle + orbitAngle * 0.1);
        pos.y = r * sin(currentAngle + orbitAngle * 0.1);
      }
      
      vDistance = length(pos.xy);
      vAlpha = aAlpha;
      vColor = color;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = aSize * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  const fragmentShader = `
    uniform float uTime;
    
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
        uTransition: { value: 0 },
        uScene: { value: 0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    })
  }, [])

  return (
    <points ref={meshRef} geometry={geometry}>
      <shaderMaterial ref={materialRef} attach="material" args={[material]} />
    </points>
  )
}

export default Module1PhaseSpace
