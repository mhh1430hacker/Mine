# FDA Metastable Particle Lab

A mind-blowing, interactive 3D Web Application visualizing advanced mathematical concepts through particle systems using WebGL, React, Three.js, and custom GLSL shaders.

## Features

- **100,000+ Particles**: Rendered using custom GLSL shaders with noise-based movement
- **7 Interactive Chapters**: Each demonstrating a different mathematical concept
- **Real-time Transitions**: Smooth morphing between different visualizations
- **Arabic UI**: Full right-to-left support with Arabic text
- **Dark Academic Aesthetic**: Pitch black background with glowing cyan and crimson accents

## Chapters

1. **Phase Space & Attractors**: Sine wave to orbit transition
2. **Analytical Geometry**: Polar to Cartesian morph
3. **Bifurcation Theory**: Momentum slider with black hole singularity
4. **Causal Finite Differences**: Causal particle stream
5. **Fractional Exponents**: Particle number collision
6. **Numerical Regularization**: Chaos to smooth transition
7. **Fading-Memory Operators**: Exponential decay tail

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The application will open at `http://localhost:3000`

## Build

```bash
npm run build
```

## Tech Stack

- React 18
- Three.js
- @react-three/fiber
- @react-three/drei
- TailwindCSS
- Custom GLSL Shaders

## Controls

- **Mouse**: Rotate and zoom the 3D scene
- **Sidebar**: Click chapters to activate different visualizations
- **Chapter 3**: Use the momentum slider to control bifurcation
- **Chapter 6**: Click the regularization button to smooth chaos

## Color Scheme

- Background: `#050505` (Pitch Black)
- Stable Energy: `#00ffff` (Cyan)
- Singularity/Collapse: `#ff003c` (Crimson Red)
