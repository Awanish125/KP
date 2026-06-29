/**
 * shaders.ts — GLSL source code for the poster panel material.
 *
 * Isolated here so the shader strings don't clutter the hook file,
 * and so they can be unit-tested or linted separately if needed.
 */

// Passes UV coordinates, surface normal, and view direction to the fragment shader.
export const posterVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

// Renders the image/video texture with canvas-print simulation effects:
// woven substrate grain, Fresnel gloss sheen, and a subtle edge vignette.
// printScale controls fiber density; printStrength controls substrate visibility.
export const posterFragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform float brightness;
  uniform float contrast;
  uniform float saturation;
  uniform float opacity;
  uniform float printScale;
  uniform float printStrength;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Simulates woven canvas/vinyl substrate that shows through the printed ink.
  float canvasWeave(vec2 uv, float scale) {
    vec2 s = uv * scale;
    float hFiber = abs(fract(s.y) - 0.5) * 2.0;
    float vFiber = abs(fract(s.x) - 0.5) * 2.0;
    float weave = max(
      smoothstep(0.55, 0.75, hFiber),
      smoothstep(0.55, 0.75, vFiber)
    );
    // Per-cell noise to break the uniform grid pattern
    float noise = hash(floor(s) * 0.5) * 0.45 + hash(floor(s)) * 0.55;
    return mix(noise * 0.4, weave, 0.65);
  }

  void main() {
    vec4 tex = texture2D(map, vUv);

    // Image adjustments
    vec3 color = tex.rgb * brightness;
    color = (color - 0.5) * contrast + 0.5;
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, saturation);

    // Canvas grain: very light modulation so grain reads without darkening overall
    float grain = canvasWeave(vUv, printScale);
    color *= (1.0 - printStrength * 0.08 + grain * printStrength * 0.12);

    // Fresnel gloss: printed vinyl has slight specular sheen at grazing angles
    float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 3.5);
    color += fresnel * 0.04;

    // Subtle vignette to frame the print edges
    vec2 uvc = vUv * 2.0 - 1.0;
    float vignette = 1.0 - dot(uvc, uvc) * 0.05;
    color *= vignette;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), tex.a * opacity);
  }
`;
