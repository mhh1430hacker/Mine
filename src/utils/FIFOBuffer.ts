/**
 * Strict Causal FIFO Buffer
 * Enforces causality by only allowing access to past data
 * No future data leakage possible by design
 */
export class FIFOBuffer<T> {
  private buffer: T[] = [];
  private capacity: number;
  private head: number = 0;
  private tail: number = 0;
  private size: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /**
   * Push new data point (only from present/past)
   * This is the ONLY way data enters the buffer
   */
  push(value: T): void {
    this.buffer[this.tail] = value;
    this.tail = (this.tail + 1) % this.capacity;
    
    if (this.size < this.capacity) {
      this.size++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
  }

  /**
   * Get data at relative index from current position
   * index=0 is most recent, index=-1 is one step back
   * Positive indices are FORBIDDEN (future data)
   */
  get(relativeIndex: number): T | undefined {
    if (relativeIndex > 0) {
      throw new Error('Causality violation: Cannot access future data');
    }
    
    if (this.size === 0) return undefined;
    
    const actualIndex = (this.tail + relativeIndex - 1 + this.capacity) % this.capacity;
    if (actualIndex < this.head || actualIndex >= this.tail) {
      return undefined;
    }
    
    return this.buffer[actualIndex];
  }

  /**
   * Get window of past data
   * Returns array from oldest to newest within window
   */
  getWindow(windowSize: number): T[] {
    const result: T[] = [];
    const actualWindowSize = Math.min(windowSize, this.size);
    
    for (let i = -actualWindowSize; i < 0; i++) {
      const value = this.get(i);
      if (value !== undefined) {
        result.push(value);
      }
    }
    
    return result;
  }

  /**
   * Compute backward difference (causal derivative)
   * dX[n] = X[n] - X[n-1]
   */
  backwardDifference(): number {
    const current = this.get(0);
    const previous = this.get(-1);
    
    if (current === undefined || previous === undefined) {
      return 0;
    }
    
    return (current as number) - (previous as number);
  }

  /**
   * Get current size
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Clear buffer
   */
  clear(): void {
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  /**
   * Get all data in buffer (oldest to newest)
   */
  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.size; i++) {
      const actualIndex = (this.head + i) % this.capacity;
      result.push(this.buffer[actualIndex]);
    }
    return result;
  }
}

/**
 * Data point for particle system
 * Each particle represents a computed mathematical state
 */
export interface DataPoint {
  x: number;           // State variable X_N
  dx: number;          // Derivative dX_N
  t: number;           // Time
  value: number;       // Computed function value
  isValid: boolean;    // Whether this point is causally valid
}

/**
 * Causal data stream
 * Generates data points with strict causality enforcement
 */
export class CausalDataStream {
  private buffer: FIFOBuffer<DataPoint>;
  private time: number = 0;
  private dt: number;

  constructor(windowSize: number, dt: number = 0.01) {
    this.buffer = new FIFOBuffer<DataPoint>(windowSize);
    this.dt = dt;
  }

  /**
   * Generate next data point using equation
   * Only uses past data for computation
   */
  generate(equation: (t: number, pastData: DataPoint[]) => number): DataPoint {
    this.time += this.dt;
    
    const pastData = this.buffer.toArray();
    const value = equation(this.time, pastData);
    
    // Compute causal derivative using backward difference
    const currentX = value;
    const previousPoint = this.buffer.get(-1);
    const dx = previousPoint ? currentX - previousPoint.x : 0;
    
    const point: DataPoint = {
      x: currentX,
      dx: dx,
      t: this.time,
      value: value,
      isValid: true
    };
    
    this.buffer.push(point);
    return point;
  }

  /**
   * Get current buffer
   */
  getBuffer(): FIFOBuffer<DataPoint> {
    return this.buffer;
  }

  /**
   * Reset time and buffer
   */
  reset(): void {
    this.time = 0;
    this.buffer.clear();
  }
}
