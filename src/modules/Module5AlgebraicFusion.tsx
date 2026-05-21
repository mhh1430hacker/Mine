/**
 * Module 5: Algebraic Fusion
 * Exponent Laws Visualization
 * 
 * Arabic: "المرحلة 5: علم الحسبان الكسري وقوانين الأسس المتقدمة. العضلات الجبرية... دمج الأسس الكسرية للانتقالان من كسر قطبي لسطر نظيف."
 * 
 * DERIVATION VISUALIZATION:
 * - Particles cluster into groups representing algebraic terms (e.g., (X_N²+dX_N²)^(2/3) and (X_N²+dX_N²)^(1/6)).
 * - With satisfying algebraic snapping, the terms collide and fuse into a single cluster representing (X_N²+dX_N²)^(5/12), visually combining their fraction magnitudes in light, representing exponent summation.
 */

import React, { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EquationEngine } from '../utils/EquationEngine'
import { DataPoint } from '../utils/FIFOBuffer'

interface Module5AlgebraicFusionProps {
  onFusionComplete?: () => void
}

const MODULE5_PARTICLE_COUNT = 9000

const Module5AlgebraicFusion: React.FC<Module5AlgebraicFusionProps> = ({ onFusionComplete }) => {
  const meshRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const [scene, setScene] = useState<'separate' | 'fusing' | 'fused'>('separate')
  const [fusionProgress, setFusionProgress] = useState(0)
  const equationEngine = useMemo(() => new EquationEngine(1000, 0.01), [])

  // Generate particle data for algebraic terms
  const particleData = useMemo(() => {
    const points: DataPoint[] = []
    const particlesPerGroup = MODULE5_PARTICLE_COUNT / 3
    
    // Group 1: (X² + dX²)^(2/3)
    for (let i = 0; i < particlesPerGroup; i++) {
      const angle = (i / particlesPerGroup) * Math.PI * 2
      const r = 2
      const x = r * Math.cos(angle) - 3 // Offset left
      const y = r * Math.sin(angle)
      const value = Math.pow(x * x + y * y, 2/3)
      
      points.push({
        x: x,
        dx: -r * Math.sin(angle),
        t: angle,
        value: value,
        isValid: true,
        groupId: 0
      } as any)
    }

    // Group 2: (X² + dX²)^(1/6)
    for (let i = 0; i < particlesPerGroup; i++) {
      const angle = (i / particlesPerGroup) * Math.PI * 2
      const r = 2
      const x = r * Math.cos(angle) + 3 // Offset right
      const y = r * Math.sin(angle)
      const value = Math.pow(x * x + y * y, 1/6)
      
      points.push({
        x: x,
        dx: -r * Math.sin(angle),
        t: angle,
        value: value,
        isValid: true,
        groupId: 1
      } as any)
    }

    // Group 3: Fused result (X² + dX²)^(5/12)
    for (let i = 0; i < particlesPerGroup; i++) {
      const angle = (i / particlesPerGroup) * Math.PI * 2
      const r = 2
      const x = r * Math.cos(angle) // Center
      const y = r * Math.sin(angle)
      const value = Math.pow(x * x + y * y, 5/12)
      
      points.push({
        x: x,
        dx: -r * Math.sin(angle),
        t: angle,
        value: value,
        isValid: true,
        groupId: 2
      } as any)
    }

    return equationEngine.dataPointsToParticles(points, {
      colorMode: 'phase',
      sizeMode: 'value'
    })
  }, [equationEngine])

  // Handle fusion animation
  const handleFusion = () => {
    setScene('fusing')
    let progress = 0
    const interval = setInterval(() => {
      progress += 0.015
      setFusionProgress(progress)
      if (progress >= 1) {
        clearInterval(interval)
        setScene('fused')
        onFusionComplete?.()
      }
    }, 16)
  }

  useFrame((state: any) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uFusionProgress.value = fusionProgress
      materialRef.current.uniforms.uScene.value = scene === 'separate' ? 0 : scene === 'fusing' ? 1 : 2
    }
  })

  // Create geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    
    const positions = new Float32Array(MODULE5_PARTICLE_COUNT * 3)
    const targetPositions = new Float32Array(MODULE5_PARTICLE_COUNT * 3)
    const colors = new Float32Array(MODULE5_PARTICLE_COUNT * 3)
    const sizes = new Float32Array(MODULE5_PARTICLE_COUNT)
    const groupIds = new Float32Array(MODULE5_PARTICLE_COUNT)

    for (let i = 0; i < MODULE5_PARTICLE_COUNT; i++) {
      const i3 = i * 3
      
      positions[i3] = particleData[i].position[0]
      positions[i3 + 1] = particleData[i].position[1]
      positions[i3 + 2] = particleData[i].position[2]
      
      // Target positions for fusion (all move to center)
      const groupIndex = Math.floor(i / (MODULE5_PARTICLE_COUNT / 3))
      const targetX = particleData[i].position[0]
      const targetY = particleData[i].position[1]
      
      targetPositions[i3] = targetX
      targetPositions[i3 + 1] = targetY
      targetPositions[i3 + 2] = particleData[i].position[2]
      
      colors[i3] = particleData[i].color[0]
      colors[i3 + 1] = particleData[i].color[1]
      colors[i3 + 2] = particleData[i].color[2]
      
      sizes[i] = particleData[i].size
      groupIds[i] = groupIndex
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aTargetPosition', new THREE.BufferAttribute(targetPositions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aGroupId', new THREE.BufferAttribute(groupIds, 1))
    
    return geo
  }, [particleData])

  const vertexShader = `
    uniform float uTime;
    uniform float uFusionProgress;
    uniform int uScene;

    attribute vec3 aTargetPosition;
    attribute float aSize;
    attribute float aGroupId;

    varying vec3 vColor;
    varying float vAlpha;
    varying float vDistance;
    varying float vGroupId;

    void main() {
      vec3 pos = position;
      vGroupId = aGroupId;
      
      if (uScene == 0) {
        // Separate: three distinct groups
        // Add rotation to each group
        float rotationSpeed = 0.5;
        float angle = uTime * rotationSpeed;
        float r = length(pos.xy);
        float currentAngle = atan(pos.y, pos.x);
        
        pos.x = r * cos(currentAngle + angle);
        pos.y = r * sin(currentAngle + angle);
        
        // Color by group
        if (aGroupId < 0.5) {
          vColor = vec3(1.0, 0.5, 0.0); // Orange for 2/3
        } else if (aGroupId < 1.5) {
          vColor = vec3(0.0, 1.0, 0.5); // Green for 1/6
        } else {
          vColor = vec3(0.5, 0.5, 1.0); // Blue for 5/12
        }
      }
      else if (uScene == 1) {
        // Fusing: algebraic snapping and collision
        vec3 startPos = position;
        vec3 endPos = aTargetPosition;
        
        // Group-specific fusion paths
        vec3 fusionTarget;
        if (aGroupId < 0.5) {
          // Group 1 moves toward center
          fusionTarget = vec3(0.0, startPos.y, startPos.z);
        } else if (aGroupId < 1.5) {
          // Group 2 moves toward center
          fusionTarget = vec3(0.0, startPos.y, startPos.z);
        } else {
          // Group 3 stays at center
          fusionTarget = startPos;
        }
        
        // Explosion effect at collision
        float explosion = 0.0;
        if (uFusionProgress > 0.4 && uFusionProgress < 0.6) {
          explosion = sin((uFusionProgress - 0.4) * 31.4159) * 0.5;
        }
        
        pos = mix(startPos, fusionTarget, uFusionProgress);
        pos += vec3(explosion, explosion, explosion * 0.5);
        
        // Color blending during fusion
        vec3 color1 = vec3(1.0, 0.5, 0.0);
        vec3 color2 = vec3(0.0, 1.0, 0.5);
        vec3 color3 = vec3(0.5, 0.5, 1.0);
        vColor = mix(mix(color1, color2, uFusionProgress), color3, uFusionProgress);
      }
      else if (uScene == 2) {
        // Fused: single unified cluster
        pos = aTargetPosition;
        
        // Add orbital motion
        float orbitSpeed = 0.3;
        float angle = uTime * orbitSpeed;
        float r = length(pos.xy);
        float currentAngle = atan(pos.y, pos.x);
        
        pos.x = r * cos(currentAngle + angle);
        pos.y = r * sin(currentAngle + angle);
        
        // Unified color (representing 5/12)
        vColor = vec3(0.0, 1.0, 1.0);
      }
      
      vDistance = length(pos.xy);
      vAlpha = 1.0;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = aSize * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  const fragmentShader = `
    uniform float uTime;
    uniform float uFusionProgress;
    
    varying vec3 vColor;
    varying float vAlpha;
    varying float vDistance;
    varying float vGroupId;

    void main() {
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      
      if (dist > 0.5) {
        discard;
      }
      
      float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
      alpha *= vAlpha;
      
      // Extra glow during fusion
      float innerGlow = 1.0 - smoothstep(0.0, 0.3, dist);
      if (uFusionProgress > 0.0 && uFusionProgress < 1.0) {
        innerGlow *= 1.0 + uFusionProgress;
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
        uFusionProgress: { value: 0 },
        uScene: { value: 0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: false
    })
  }, [])

  return (
    <>
      <points ref={meshRef} geometry={geometry} onClick={handleFusion}>
        <shaderMaterial ref={materialRef} attach="material" args={[material]} />
      </points>
    </>
  )
}

export default Module5AlgebraicFusion
