// Deterministic pseudo-random using a simple hash
export function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function createParticleData(count, seed = 42) {
  const rng = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  const indices = new Float32Array(count);
  const randoms = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;
    indices[i] = i;
    randoms[i] = rng();
  }
  return { positions, indices, randoms };
}
