/**
 * Module 3: Singularity Cliff
 * Visualizing Critical Slowing Down
 * 
 * Arabic: "المرحلة 3: نظرية التفرع والتباطؤ الحرج. هذه هي (الفيزياء الكامنة)... عندما تتضخم السعة وتتجمد الحركة ويقترب الزخم من الصفر، ينفجر الكسر جبرياً نحو المالانهاية ويخلق المنحدر المرعب."
 * 
 * DERIVATION VISUALIZATION:
 * - User Control: 2 sliders (Amplitude X_N, Momentum dX_N).
 * - Causal Event: If User makes X_N large AND dX_N very small, the particle surface warps.
 * - The physics of Critical Slowing Down must be visible: The particles on the surface *physically slow down* to almost freezing, while the particles on the central axis turn crimson red and violently collapse downwards into a central singularity black hole, visually proving the algebraic explosion of 1/dX_N.
 */

import React, { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EquationEngine } from '../utils/EquationEngine'
import { DataPoint } from '../utils/FIFOBuffer'

interface Module3SingularityCliffProps {
  onSingularity?: () => void
}

const MODULE3_PARTICLE_COUNT = 10000

const Module3SingularityCliff: React.FC<Module3SingularityCliffProps> = ({ onSingularity }) => {
  const meshRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const [amplitude, setAmplitude] = useState(2.0)
  const [momentum, setMomentum] = useState(1.0)
  const [isSingularity, setIsSingularity] = useState(false)
  const equationEngine = useMemo(() => new EquationEngine(1000, 0.01), [])

  // Generate particle data for bifurcation surface
  const particleData = useMemo(() => {
    const points: DataPoint[] = []
    const gridSize = Math.sqrt(MODULE3_PARTICLE_COUNT)
    
    for (let i = 0; i < MODULE3_PARTICLE_COUNT; i++) {
      const ix = i % Math.floor(gridSize)
      const iy = Math.floor(i / gridSize)
      
      const x = (ix / gridSize - 0.5) * 10
      const y = (iy / gridSize - 0.5) * 10
      
      // Bifurcation equation with momentum parameter
      // As momentum -> 0, creates singularity: z = (x² + y²) / momentum
      const denominator = Math.abs(momentum) + 0.001
      const z = (x * x + y * y) / denominator
      
      // Compute derivatives
      const dx = 2 * x / denominator
      
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
  }, [equationEngine, momentum])

  // Detect singularity condition
  useMemo(() => {
    if (amplitude > 3.0 && momentum < 0.2) {
      if (!isSingularity) {
        setIsSingularity(true)
        onSingularity?.()
      }
    } else {
      setIsSingularity(false)
    }
  }, [amplitude, momentum, isSingularity, onSingularity])

  useFrame((state: any) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uAmplitude.value = amplitude
      materialRef.current.uniforms.uMomentum.value = momentum
      materialRef.current.uniforms.uIsSingularity.value = isSingularity ? 1.0 : 0.0
    }
  })

  // Create geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    
    const positions = new Float32Array(MODULE3_PARTICLE_COUNT * 3)
    const colors = new Float32Array(MODULE3_PARTICLE_COUNT * 3)
    const sizes = new Float32Array(MODULE3_PARTICLE_COUNT)
    const velocities = new Float32Array(MODULE3_PARTICLE_COUNT)

    for (let i = 0; i < MODULE3_PARTICLE_COUNT; i++) {
      const i3 = i * 3
      
      positions[i3] = particleData[i].position[0]
      positions[i3 + 1] = particleData[i].position[1]
      positions[i3 + 2] = particleData[i].position[2]
      
      colors[i3] = particleData[i].color[0]
      colors[i3 + 1] = particleData[i].color[1]
      colors[i3 + 2] = particleData[i].color[2]
      
      sizes[i] = particleData[i].size
      velocities[i] = Math.abs(particleData[i].velocity[0])
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 1))
    
    return geo
  }, [particleData])

  const vertexShader = `
    uniform float uTime;
    uniform float uAmplitude;
    uniform float uMomentum;
    uniform float uIsSingularity;

    attribute float aSize;
    attribute float aVelocity;

    varying vec3 vColor;
    varying float vAlpha;
    varying float vDistance;

    void main() {
      vec3 pos = position;
      
      // Critical Slowing Down: particles slow down near singularity
      float distFromCenter = length(pos.xy);
      float slowingFactor = 1.0;
      
      if (uIsSingularity > 0.5) {
        // Particles physically slow down near center
        slowingFactor = smoothstep(0.0, 2.0, distFromCenter);
        
        // Central axis particles turn crimson and collapse
        if (distFromCenter < 1.0) {
          // Violent collapse into singularity
          float collapseStrength = (1.0 - distFromCenter) * uIsSingularity;
          pos.z -= collapseStrength * 5.0 * sin(uTime * 10.0);
          
          // Turn crimson red
          vColor = mix(vec3(1.0, 0.0, 0.235), vec3(1.0, 0.0, 0.0), collapseStrength);
        } else {
          // Surface particles slow down (critical slowing down)
          float slowMotion = 1.0 - slowingFactor * 0.9;
          pos.z *= slowMotion;
          vColor = color;
        }
      } else {
        // Normal state
        vColor = color;
        slowingFactor = 1.0;
      }
      
      // Apply amplitude scaling
      pos.xy *= uAmplitude;
      
      vDistance = distFromCenter;
      vAlpha = 1.0;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = aSize * slowingFactor * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  const fragmentShader = `
    uniform float uTime;
    uniform float uIsSingularity;
    
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
      
      // Inner glow intensifies near singularity
      float innerGlow = 1.0 - smoothstep(0.0, 0.3, dist);
      if (uIsSingularity > 0.5 && vDistance < 1.0) {
        innerGlow *= 2.0;
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
        uAmplitude: { value: 2.0 },
        uMomentum: { value: 1.0 },
        uIsSingularity: { value: 0 }
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
      {/* Control UI would be rendered in React overlay, not here */}
    </>
  )
}

export default Module3SingularityCliff
