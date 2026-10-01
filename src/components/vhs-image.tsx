"use client";

import { useEffect, useRef } from "react";

// VHS tape effect from https://canvasui.dev/docs/components/vhs, adapted to a
// plain image texture (the original needs Chrome's HTML-in-canvas API).
// Renders only while the parent element is hovered. Handles transparent
// images (the shader works in premultiplied alpha), and sets
// `data-vhs="on"` on the parent while running so the plain image can hide.

export type VhsOptions = typeof OPTIONS;

const OPTIONS = {
  speed: 0.9,
  wave: 3,
  jitter: 1.4,
  crease: 1.2,
  switching: 0.35,
  switchingHeight: 0.09,
  bloom: 0.5,
  aberration: 2.5,
  acBeat: 1,
  grain: 0.14,
  scanlines: 0.3,
  vignette: 0.15,
  saturation: 1.1,
  exposure: 1,
};

// How the photo is placed inside its box (matches the markup in page.tsx).
const IMAGE_OFFSET_X = -0.0396;
const IMAGE_SCALE_X = 1.107;

const VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main () {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uContent;
uniform vec2 uResolution;
uniform float uTime;
uniform float uWave;
uniform float uJitter;
uniform float uCrease;
uniform float uSwitching;
uniform float uSwitchHeight;
uniform float uBloom;
uniform float uAberration;
uniform float uAcBeat;
uniform float uGrain;
uniform float uScanlines;
uniform float uVignette;
uniform float uSaturation;
uniform float uExposure;
uniform float uCreaseNoise;

#define PI 3.14159265

float hash (vec2 v) {
  return fract(sin(dot(v, vec2(89.44, 19.36))) * 22189.22);
}

float iHash (vec2 v, vec2 r) {
  float h00 = hash(floor(v * r + vec2(0.0, 0.0)) / r);
  float h10 = hash(floor(v * r + vec2(1.0, 0.0)) / r);
  float h01 = hash(floor(v * r + vec2(0.0, 1.0)) / r);
  float h11 = hash(floor(v * r + vec2(1.0, 1.0)) / r);
  vec2 ip = smoothstep(vec2(0.0), vec2(1.0), mod(v * r, 1.0));
  return (h00 * (1.0 - ip.x) + h10 * ip.x) * (1.0 - ip.y)
    + (h01 * (1.0 - ip.x) + h11 * ip.x) * ip.y;
}

float noise (vec2 v) {
  float sum = 0.0;
  float s = 2.0;
  for (int i = 1; i < 7; i++) {
    sum += iHash(v + vec2(i), vec2(2.0 * s)) / s;
    s *= 2.0;
  }
  return sum;
}

vec4 tape (vec2 p) {
  p = clamp(p, 0.0005, 0.9995);
  return texture(uContent, vec2(p.x, 1.0 - p.y));
}

void main () {
  vec2 uv = vUv;
  vec2 uvn = uv;
  float t = uTime;

  float lineNoise = noise(vec2(uvn.y * 100.0, t * 10.0));

  uvn.x += (noise(vec2(uvn.y, t)) - 0.5) * 0.005 * uWave;
  uvn.x += (lineNoise - 0.5) * 0.01 * uJitter;

  float tcPhase = clamp(
    (sin(uvn.y * 8.0 - t * PI * 1.2) - 0.92) * uCreaseNoise,
    0.0, 0.01
  ) * 10.0 * uCrease;
  float tcNoise = max(lineNoise - 0.5, 0.0);
  uvn.x -= tcNoise * tcPhase;

  float snPhase = smoothstep(max(uSwitchHeight, 1e-4), 0.0, uvn.y) * uSwitching;
  uvn.y += snPhase * 0.3;
  uvn.x += snPhase * ((lineNoise - 0.5) * 0.2);

  // The texture is premultiplied, so colour and alpha are processed together.
  vec4 base = tape(uvn);
  vec3 col = base.rgb;
  float a = base.a;
  col *= 1.0 - tcPhase;
  col = mix(col, col.yzx, clamp(snPhase, 0.0, 1.0));

  float px = uAberration / max(uResolution.x, 1.0);
  vec3 bloomSum = vec3(0.0);
  float alphaSum = 0.0;
  for (int i = -8; i <= 2; i++) {
    vec4 s = tape(uvn + vec2(float(i) * px, 0.0));
    if (i >= -4) bloomSum.r += s.r;
    if (i >= -6 && i <= 0) {
      bloomSum.g += s.g;
      alphaSum += s.a;
    }
    if (i <= -2) bloomSum.b += s.b;
  }
  bloomSum *= 0.1;
  alphaSum *= 0.1;
  float bloom = clamp(uBloom, 0.0, 1.0);
  col = mix(col, (col + bloomSum) / 1.7, bloom);
  a = mix(a, (a + alphaSum) / 1.7, bloom);

  // Tape damage shows even over transparent areas.
  a = max(a, clamp(snPhase + tcPhase, 0.0, 1.0));
  // Back to straight colour for the finishing passes.
  col = a > 0.001 ? clamp(col / a, 0.0, 1.0) : vec3(0.0);

  col *= 1.0 + clamp(
    noise(vec2(0.0, uv.y + t * 0.2)) * 0.6 - 0.25, 0.0, 0.1
  ) * uAcBeat;

  float g = hash(uv * uResolution + fract(t) * vec2(127.1, 311.7)) - 0.5;
  col += g * uGrain;

  float scan = sin(uv.y * uResolution.y * PI) * 0.5;
  col *= 1.0 - uScanlines * 0.35 * scan;

  vec2 vd = (uv - 0.5) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  col *= 1.0 - uVignette * smoothstep(0.4, 1.1, length(vd));

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, clamp(uSaturation, 0.0, 2.0));
  col *= uExposure;

  outColor = vec4(col, a);
}`;

const fract = (x: number) => x - Math.floor(x);
const hash2 = (x: number, y: number) =>
  fract(Math.sin(x * 89.44 + y * 19.36) * 22189.22);
const smooth01 = (x: number) => x * x * (3 - 2 * x);

function iHashCpu(vx: number, vy: number, r: number) {
  const fx = Math.floor(vx * r);
  const fy = Math.floor(vy * r);
  const h00 = hash2(fx / r, fy / r);
  const h10 = hash2((fx + 1) / r, fy / r);
  const h01 = hash2(fx / r, (fy + 1) / r);
  const h11 = hash2((fx + 1) / r, (fy + 1) / r);
  const ix = smooth01(fract(vx * r));
  const iy = smooth01(fract(vy * r));
  return (
    (h00 * (1 - ix) + h10 * ix) * (1 - iy) + (h01 * (1 - ix) + h11 * ix) * iy
  );
}

function noiseCpu(vx: number, vy: number) {
  let sum = 0;
  let s = 2;
  for (let i = 1; i < 7; i++) {
    sum += iHashCpu(vx + i, vy + i, 2 * s) / s;
    s *= 2;
  }
  return sum;
}

export function VhsImage({
  src,
  fit = "cover",
  opacity: maxOpacity = 1,
  options,
}: {
  src: string;
  /** "cover" replicates the photo crop; "fill" stretches to the box. */
  fit?: "cover" | "fill";
  /** Final opacity, to match an image that is itself semi-transparent. */
  opacity?: number;
  /** Overrides for the default effect strengths. Keep the object stable. */
  options?: Partial<VhsOptions>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    const config = { ...OPTIONS, ...options };
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: false,
      depth: false,
      stencil: false,
      antialias: false,
    });
    if (!gl) return;

    const compile = (type: number, text: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, text);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("VHS shader error:", gl.getShaderInfoLog(shader));
      }
      return shader;
    };
    const vertexShader = compile(gl.VERTEX_SHADER, VERT);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i)!;
      uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const image = new Image();
    let loaded = false;
    let textureDirty = false;
    const scratch = document.createElement("canvas");

    // Bake the photo into the texture with the same crop the <Image> uses
    // (object-cover inside a slightly wider, shifted box).
    const uploadTexture = () => {
      const ctx = scratch.getContext("2d");
      if (!ctx || !loaded) return;
      const w = canvas.width;
      const h = canvas.height;
      scratch.width = w;
      scratch.height = h;
      if (fit === "fill") {
        ctx.drawImage(image, 0, 0, w, h);
      } else {
        const boxW = w * IMAGE_SCALE_X;
        const scale = Math.max(
          boxW / image.naturalWidth,
          h / image.naturalHeight,
        );
        const dw = image.naturalWidth * scale;
        const dh = image.naturalHeight * scale;
        const boxX = w * IMAGE_OFFSET_X;
        ctx.drawImage(image, boxX + (boxW - dw) / 2, (h - dh) / 2, dw, dh);
      }
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scratch);
      textureDirty = false;
    };

    const syncSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        textureDirty = true;
      }
    };

    image.onload = () => {
      loaded = true;
      textureDirty = true;
    };
    image.src = src;

    let time = 0;
    let raf = 0;
    let running = false;
    let last = 0;
    let opacity = 0;
    let target = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const render = () => {
      syncSize();
      if (textureDirty) uploadTexture();
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uniforms.uContent, 0);
      gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, time);
      gl.uniform1f(uniforms.uWave, config.wave);
      gl.uniform1f(uniforms.uJitter, config.jitter);
      gl.uniform1f(uniforms.uCrease, config.crease);
      gl.uniform1f(uniforms.uSwitching, config.switching);
      gl.uniform1f(uniforms.uSwitchHeight, config.switchingHeight);
      gl.uniform1f(uniforms.uBloom, config.bloom);
      gl.uniform1f(
        uniforms.uAberration,
        config.aberration * (canvas.width / Math.max(canvas.clientWidth, 1)),
      );
      gl.uniform1f(uniforms.uAcBeat, config.acBeat);
      gl.uniform1f(uniforms.uGrain, config.grain);
      gl.uniform1f(uniforms.uScanlines, config.scanlines);
      gl.uniform1f(uniforms.uVignette, config.vignette);
      gl.uniform1f(uniforms.uCreaseNoise, noiseCpu(time, time));
      gl.uniform1f(uniforms.uSaturation, config.saturation);
      gl.uniform1f(uniforms.uExposure, config.exposure);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const frame = (now: number) => {
      const delta = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      time += delta * config.speed;
      // Quick fade in, slightly slower fade out.
      opacity += (target - opacity) * Math.min(1, delta * (target ? 20 : 12));
      if (Math.abs(target - opacity) < 0.01) opacity = target;
      canvas.style.opacity = String(opacity * maxOpacity);
      if (loaded) render();
      if (target === 0 && opacity === 0) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const setActive = (active: boolean) => {
      if (active && reduceMotion.matches) return;
      target = active ? 1 : 0;
      host!.dataset.vhs = active && loaded ? "on" : "off";
      if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const on = () => setActive(true);
    const off = () => setActive(false);
    host.addEventListener("pointerenter", on);
    host.addEventListener("pointerleave", off);
    host.addEventListener("pointercancel", off);

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointerenter", on);
      host.removeEventListener("pointerleave", off);
      host.removeEventListener("pointercancel", off);
      delete host.dataset.vhs;
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(quad);
    };
  }, [src, fit, maxOpacity, options]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full opacity-0"
    />
  );
}
