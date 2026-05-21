export interface Chapter {
  id: number
  title: string
  subtitle: string
  description: string
}

export interface ParticleData {
  position: [number, number, number]
  velocity: [number, number, number]
  targetPosition: [number, number, number]
  color: [number, number, number]
  size: number
  alpha: number
}
