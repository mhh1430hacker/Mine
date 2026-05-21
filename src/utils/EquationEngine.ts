/**
 * Strict Causal Equation Plotting Engine
 * Computes particle positions dynamically from mathematical equations
 * Every particle position is a data point from FIFO buffer
 */

import { DataPoint, CausalDataStream } from './FIFOBuffer';

export interface EquationConfig {
  type: 'sine' | 'cosine' | 'exponential' | 'polynomial' | 'custom';
  params: Record<string, number>;
}

export interface ParticleState {
  position: [number, number, number];
  color: [number, number, number];
  size: number;
  alpha: number;
  velocity: [number, number, number];
}

/**
 * Equation Plotting Engine
 * Generates particle positions from mathematical equations
 */
export class EquationEngine {
  private dataStream: CausalDataStream;
  private windowSize: number;

  constructor(windowSize: number = 1000, dt: number = 0.01) {
    this.dataStream = new CausalDataStream(windowSize, dt);
    this.windowSize = windowSize;
  }

  /**
   * Generate sine wave data points
   * X(t) = A * sin(ω * t + φ)
   */
  generateSineWave(amplitude: number = 2, frequency: number = 2, phase: number = 0): DataPoint[] {
    this.dataStream.reset();
    const points: DataPoint[] = [];

    for (let i = 0; i < this.windowSize; i++) {
      const point = this.dataStream.generate((t) => {
        return amplitude * Math.sin(frequency * t + phase);
      });
      points.push(point);
    }

    return points;
  }

  /**
   * Generate phase space orbit from sine wave
   * Plots X vs dX instead of X vs t
   */
  generatePhaseOrbit(amplitude: number = 2, frequency: number = 2): DataPoint[] {
    this.dataStream.reset();
    const points: DataPoint[] = [];

    for (let i = 0; i < this.windowSize; i++) {
      const point = this.dataStream.generate((t) => {
        return amplitude * Math.sin(frequency * t);
      });
      points.push(point);
    }

    return points;
  }

  /**
   * Generate polar coordinates
   * (r, θ) -> Cartesian (X, Y)
   */
  generatePolarToCartesian(radius: number = 3, points: number = 1000): DataPoint[] {
    const dataPoints: DataPoint[] = [];

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * Math.PI * 2;
      const x = radius * Math.cos(theta);
      
      // Compute derivatives
      const dx = -radius * Math.sin(theta);

      dataPoints.push({
        x: x,
        dx: dx,
        t: theta,
        value: radius,
        isValid: true
      });
    }

    return dataPoints;
  }

  /**
   * Generate CRFO manifold surface
   * Shows the (5/12) and (7/6) exponents
   */
  generateCRFOManifold(): DataPoint[] {
    const points: DataPoint[] = [];
    const gridSize = 50;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = (i / gridSize - 0.5) * 10;
        const y = (j / gridSize - 0.5) * 10;
        
        // CRFO equation: (X^2 + dX^2)^(5/12)
        const rSquared = x * x + y * y;
        const z = Math.pow(rSquared + 0.01, 5/12);
        
        // Compute gradient (derivative)
        const dx = (5/12) * Math.pow(rSquared + 0.01, 5/12 - 1) * 2 * x;

        points.push({
          x: x,
          dx: dx,
          t: 0,
          value: z,
          isValid: true
        });
      }
    }

    return points;
  }

  /**
   * Generate bifurcation surface with singularity
   * Shows critical slowing down
   */
  generateBifurcationSurface(momentum: number = 1.0): DataPoint[] {
    const points: DataPoint[] = [];
    const gridSize = 50;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = (i / gridSize - 0.5) * 10;
        const y = (j / gridSize - 0.5) * 10;
        
        // Bifurcation equation with momentum parameter
        // As momentum -> 0, creates singularity
        const denominator = Math.abs(momentum) + 0.001;
        const z = (x * x + y * y) / denominator;
        
        // Compute derivatives
        const dx = 2 * x / denominator;

        points.push({
          x: x,
          dx: dx,
          t: 0,
          value: z,
          isValid: true
        });
      }
    }

    return points;
  }

  /**
   * Generate causal data stream with FIFO visualization
   */
  generateCausalStream(windowSize: number = 100): DataPoint[] {
    this.dataStream.reset();
    const points: DataPoint[] = [];

    for (let i = 0; i < windowSize; i++) {
      const point = this.dataStream.generate((t) => {
        return Math.sin(t * 2) + Math.cos(t * 3) * 0.5;
      });
      points.push(point);
    }

    return points;
  }

  /**
   * Generate algebraic fusion visualization
   * Shows exponent combination: (2/3) + (1/6) = (5/12)
   */
  generateAlgebraicFusion(): DataPoint[] {
    const points: DataPoint[] = [];
    
    // Group 1: (X^2 + dX^2)^(2/3)
    for (let i = 0; i < 333; i++) {
      const angle = (i / 333) * Math.PI * 2;
      const r = 2;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      const value = Math.pow(x*x + y*y, 2/3);
      
      points.push({
        x: x - 3,
        dx: -r * Math.sin(angle),
        t: angle,
        value: value,
        isValid: true
      });
    }

    // Group 2: (X^2 + dX^2)^(1/6)
    for (let i = 0; i < 333; i++) {
      const angle = (i / 333) * Math.PI * 2;
      const r = 2;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      const value = Math.pow(x*x + y*y, 1/6);
      
      points.push({
        x: x + 3,
        dx: -r * Math.sin(angle),
        t: angle,
        value: value,
        isValid: true
      });
    }

    // Group 3: Fused result (X^2 + dX^2)^(5/12)
    for (let i = 0; i < 334; i++) {
      const angle = (i / 334) * Math.PI * 2;
      const r = 2;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      const value = Math.pow(x*x + y*y, 5/12);
      
      points.push({
        x: x,
        dx: -r * Math.sin(angle),
        t: angle,
        value: value,
        isValid: true
      });
    }

    return points;
  }

  /**
   * Generate regularization comparison
   * Shows effect of epsilon and p=1.25
   */
  generateRegularizationSurface(epsilon: number = 0.01, p: number = 1.25): DataPoint[] {
    const points: DataPoint[] = [];
    const gridSize = 50;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = (i / gridSize - 0.5) * 10;
        const y = (j / gridSize - 0.5) * 10;
        
        const rSquared = x * x + y * y;
        
        // With regularization: 1 / (r^2 + epsilon)^p
        const z = 1.0 / Math.pow(rSquared + epsilon, p);
        
        const dx = -p * 2 * x / Math.pow(rSquared + epsilon, p + 1);

        points.push({
          x: x,
          dx: dx,
          t: 0,
          value: z,
          isValid: true
        });
      }
    }

    return points;
  }

  /**
   * Generate fading memory tail
   * Shows exponential decay convolution
   */
  generateFadingMemoryTail(lambda: number = 0.5, tailLength: number = 100): DataPoint[] {
    const points: DataPoint[] = [];
    
    // Moving sphere
    for (let i = 0; i < tailLength; i++) {
      const t = i * 0.1;
      const x = Math.sin(t) * 3;
      
      // Exponential decay weight
      const weight = Math.exp(-lambda * (tailLength - i) * 0.1);
      
      points.push({
        x: x,
        dx: Math.cos(t) * 3,
        t: t,
        value: weight,
        isValid: true
      });
    }

    return points;
  }

  /**
   * Convert data points to particle states for rendering
   */
  dataPointsToParticles(dataPoints: DataPoint[], config: {
    colorMode?: 'phase' | 'velocity' | 'value' | 'time';
    sizeMode?: 'uniform' | 'value' | 'velocity';
  } = {}): ParticleState[] {
    return dataPoints.map((point) => {
      let color: [number, number, number] = [0, 1, 1];
      let size = 2.0;
      let alpha = 1.0;

      // Color based on mode
      switch (config.colorMode) {
        case 'phase':
          // Color based on phase angle
          const angle = Math.atan2(point.dx, point.x);
          color = [
            0.5 + 0.5 * Math.cos(angle),
            0.5 + 0.5 * Math.sin(angle),
            1.0
          ];
          break;
        case 'velocity':
          // Color based on velocity magnitude
          const velMag = Math.sqrt(point.dx * point.dx);
          color = [
            Math.min(1, velMag * 0.5),
            1.0 - Math.min(1, velMag * 0.5),
            1.0
          ];
          break;
        case 'value':
          // Color based on function value
          color = [
            Math.min(1, point.value * 0.3),
            1.0 - Math.min(1, point.value * 0.3),
            1.0
          ];
          break;
        case 'time':
          // Color based on time
          color = [
            0.5 + 0.5 * Math.sin(point.t),
            0.5 + 0.5 * Math.cos(point.t),
            1.0
          ];
          break;
      }

      // Size based on mode
      switch (config.sizeMode) {
        case 'value':
          size = 1.0 + Math.min(3, point.value * 0.5);
          break;
        case 'velocity':
          size = 1.0 + Math.min(3, Math.abs(point.dx) * 0.5);
          break;
        default:
          size = 2.0;
      }

      return {
        position: [point.x, point.dx, point.value],
        color: color,
        size: size,
        alpha: alpha,
        velocity: [point.dx, point.dx, 0]
      };
    });
  }

  /**
   * Get current data stream
   */
  getDataStream(): CausalDataStream {
    return this.dataStream;
  }
}
