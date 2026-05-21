/**
 * Module 2: Topological Morphing
 * Deriving Polar to Cartesian Exponents
 * 
 * Arabic: "المرحلة 2: الهندسة التحليلية والتحويلات الطوبولوجية. المهارة الجراحية التي نقلت المعادلة من الرياضيات النظرية إلى البرمجيات اللحظية المستقرة. الانتقال المرن بين النظام القطبي (r, θ) والكارتيزي التعامدي (X, Y)."
 * 
 * DERIVATION VISUALIZATION:
 * - Scene A: Show a circle (r, θ). Highlight a sector with sinθ and cosθ.
 * - Causal Swap (Shader level): On click, particles representing sinθ must morph into dX_N/√(X_N²+dX_N²). Particles representing cosθ must morph into X_N/√(X_N²+dX_N²).
 * - Scene B: Show the complex polar equation of FDA particles (glowing 3D text). Instantly, they collapse and fuse together, algebraically simplifying based on exponent laws to form the rigid, grid-locked (5/12) and (7/6) exponents of the Cartesian CRFO manifold.
 */

import React, { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EquationEngine } from '../utils/EquationEngine'
import { DataPoint } from '../utils/FIFOBuffer'

interface Module2TopologicalMorphingProps {
  onMorphComplete?: () => void
}

const MODULE2_PARTICLE_COUNT = 8000

const Module2TopologicalMorphing: React.FC<Module2TopologicalMorphingProps> = ({ onMorphComplete }) => {
  const meshRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const [scene, setScene] = useState<'polar' | 'morphing' | 'cartesian'>('polar')
  const [morphProgress, setMorphProgress] = useState(0)
  const equationEngine = useMemo(() => new EquationEngine(1000, 0.01), [])

  // Generate particle data for both scenes
  const particleData = useMemo(() => {
    // Scene A: Polar coordinates (r, θ)
    const polarPoints: DataPoint[] = []
    for (let i = 0; i < MODULE2_PARTICLE_COUNT; i++) {
      const theta = (i / MODULE2_PARTICLE_COUNT) * Math.PI * 2
      const radius = 3
      const x = radius * Math.cos(theta)
      const y = radius * Math.sin(theta)
      
      // sinθ and cosθ components
      const sinTheta = Math.sin(theta)
      const cosTheta = Math.cos(theta)
      
      polarPoints.push({
        x: x,
        dx: sinTheta, // Store sinθ in dx for morphing
        t: theta,
        value: cosTheta, // Store cosθ in value for morphing
        isValid: true
      })
    }

    // Scene B: Cartesian CRFO manifold with (5/12) and (7/6) exponents
    const cartesianPoints: DataPoint[] = []
    const gridSize = Math.sqrt(MODULE2_PARTICLE_COUNT)
    
    for (let i = 0; i < MODULE2_PARTICLE_COUNT; i++) {
      const ix = i % Math.floor(gridSize)
      const iy = Math.floor(i / gridSize)
      
      const x = (ix / gridSize - 0.5) * 10
      const y = (iy / gridSize - 0.5) * 10
      
      // CRFO equation: (X² + dX²)^(5/12)
      const rSquared = x * x + y * y
      const z = Math.pow(rSquared + 0.01, 5/12)
      
      // Derivative for visualization
      const dx = (5/12) * Math.pow(rSquared + 0.01, 5/12 - 1) * 2 * x
      
      cartesianPoints.push({
        x: x,
        dx: dx,
        t: 0,
        value: z,
        isValid: true
      })
    }

    // Convert to particle states
    const polarParticles = equationEngine.dataPointsToParticles(polarPoints, {
      colorMode: 'phase',
      sizeMode: 'uniform'
    })

    const cartesianParticles = equationEngine.dataPointsToParticles(cartesianPoints, {
      colorMode: 'value',
      sizeMode: 'value'
    })

    return {
      polar: polarParticles,
      cartesian: cartesianParticles
    }
  }, [equationEngine])

  // Handle morphing animation
  const handleMorph = () => {
    setScene('morphing')
    let progress = 0
    const interval = setInterval(() => {
      progress += 0.02
      setMorphProgress(progress)
      if (progress >= 1) {
        clearInterval(interval)
        setScene('cartesian')
        onMorphComplete?.()
      }
    }, 16)
  }

  useFrame((state: any) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uMorphProgress.value = morphProgress
      materialRef.current.uniforms.uScene.value = scene === 'polar' ? 0 : scene === 'morphing' ? 1 : 2
    }
  })

  // Create geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    
    const positions = new Float32Array(MODULE2_PARTICLE_COUNT * 3)
    const targetPositions = new Float32Array(MODULE2_PARTICLE_COUNT * 3)
    const colors = new Float32Array(MODULE2_PARTICLE_COUNT * 3)
    const sizes = new Float32Array(MODULE2_PARTICLE_COUNT)
    const sinTheta = new Float32Array(MODULE2_PARTICLE_COUNT)
    const cosTheta = new Float32Array(MODULE2_PARTICLE_COUNT)

    for (let i = 0; i < MODULE2_PARTICLE_COUNT; i++) {
      const i3 = i * 3
      
      // Polar positions (initial)
      positions[i3] = particleData.polar[i].position[0]
      positions[i3 + 1] = particleData.polar[i].position[1]
      positions[i3 + 2] = particleData.polar[i].position[2]
      
      // Cartesian positions (target)
      targetPositions[i3] = particleData.cartesian[i].position[0]
      targetPositions[i3 + 1] = particleData.cartesian[i].position[1]
      targetPositions[i3 + 2] = particleData.cartesian[i].position[2]
      
      // Colors
      colors[i3] = particleData.polar[i].color[0]
      colors[i3 + 1] = particleData.polar[i].color[1]
      colors[i3 + 2] = particleData.polar[i].color[2]
      
      // Sizes
      sizes[i] = particleData.polar[i].size
      
      // Store sinθ and cosθ for shader morphing
      sinTheta[i] = particleData.polar[i].position[1] / 3 // Normalized
      cosTheta[i] = particleData.polar[i].position[0] / 3 // Normalized
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aTargetPosition', new THREE.BufferAttribute(targetPositions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aSinTheta', new THREE.BufferAttribute(sinTheta, 1))
    geo.setAttribute('aCosTheta', new THREE.BufferAttribute(cosTheta, 1))
    
    return geo
  }, [particleData])

  const vertexShader = `
    uniform float uTime;
    uniform float uMorphProgress;
    uniform int uScene;

    attribute vec3 aTargetPosition;
    attribute float aSize;
    attribute float aSinTheta;
    attribute float aCosTheta;

    varying vec3 vColor;
    varying float vAlpha;
    varying float vDistance;

    void main() {
      vec3 pos = position;
      
      if (uScene == 0) {
        // Polar: circle with rotating particles
        float angle = uTime * 0.5;
        float r = length(pos.xy);
        float currentAngle = atan(pos.y, pos.x);
        
        pos.x = r * cos(currentAngle + angle);
        pos.y = r * sin(currentAngle + angle);
        
        // Highlight sinθ and cosθ sectors
        float sectorHighlight = step(0.9, abs(aSinTheta)) + step(0.9, abs(aCosTheta));
        pos.z += sectorHighlight * 0.5;
      }
      else if (uScene == 1) {
        // Morphing: algebraic transformation
        // sinθ → dX_N/√(X_N²+dX_N²)
        // cosθ → X_N/√(X_N²+dX_N²)
        
        vec3 polarPos = position;
        vec3 cartesianPos = aTargetPosition;
        
        // Causal swap: morph sinθ to derivative form
        float rSquared = dot(polarPos.xy, polarPos.xy);
        float r = sqrt(rSquared + 0.001);
        
        // Algebraic transformation
        vec3 morphedPos = polarPos;
        morphedPos.x = aCosTheta * r; // cosθ → X_N/√(...)
        morphedPos.y = aSinTheta * r; // sinθ → dX_N/√(...)
        
        // Mix towards cartesian
        pos = mix(morphedPos, cartesianPos, uMorphProgress);
        
        // Add snapping effect at end
        if (uMorphProgress > 0.8) {
          float snap = smoothstep(0.8, 1.0, uMorphProgress);
          pos = mix(pos, cartesianPos, snap);
        }
      }
      else if (uScene == 2) {
        // Cartesian: CRFO manifold
        pos = aTargetPosition;
        
        // Add subtle breathing motion
        float breath = 1.0 + 0.05 * sin(uTime);
        pos.xy *= breath;
      }
      
      vDistance = length(pos.xy);
      vAlpha = 1.0;
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
        uMorphProgress: { value: 0 },
        uScene: { value: 0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    })
  }, [])

  return (
    <>
      <points ref={meshRef} geometry={geometry} onClick={handleMorph}>
        <shaderMaterial ref={materialRef} attach="material" args={[material]} />
      </points>
      {/* Click instruction */}
      <mesh position={[0, -4, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={[0, 1, 1]} />
      </mesh>
    </>
  )
}

export default Module2TopologicalMorphing
