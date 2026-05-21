uniform vec3 uColorCyan;
uniform vec3 uColorRed;
uniform float uTime;

varying vec3 vColor;
varying float vAlpha;
varying float vDistance;

void main() {
  // Circular particle shape
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  
  if (dist > 0.5) {
    discard;
  }
  
  // Soft edge glow
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
  alpha *= vAlpha;
  
  // Inner glow
  float innerGlow = 1.0 - smoothstep(0.0, 0.3, dist);
  
  // Pulsing effect
  float pulse = 0.8 + 0.2 * sin(uTime * 2.0 + vDistance);
  
  // Final color with glow
  vec3 color = vColor;
  color += innerGlow * 0.5;
  color *= pulse;
  
  gl_FragColor = vec4(color, alpha);
}
