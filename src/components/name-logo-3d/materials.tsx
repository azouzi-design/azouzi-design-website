"use client";

import type { Look } from "./looks";

/** The surface a look asks for. */
export function LookMaterial({ look, opacity = 1 }: { look: Look; opacity?: number }) {
  const fade = opacity < 1 ? { transparent: true, opacity } : {};
  switch (look.material) {
    case "matte":
      return (
        <meshStandardMaterial color="#c3c3c3" roughness={0.45} metalness={0.1} {...fade} />
      );
    case "paper":
      return <meshStandardMaterial color="#ffffff" roughness={0.9} {...fade} />;
    case "clay":
      return <meshStandardMaterial color="#f4f1ec" roughness={0.95} {...fade} />;
    case "chrome":
      return <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.12} {...fade} />;
    case "ink":
      return (
        <meshPhysicalMaterial
          color="#141414"
          roughness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.05}
          {...fade}
        />
      );
    case "acrylic":
      return (
        // Faintly blue-grey where it's thick, so the edges show on white.
        <meshPhysicalMaterial
          color="#f2f6f8"
          transmission={0.92}
          thickness={10}
          attenuationColor="#b9c6cf"
          attenuationDistance={12}
          roughness={0.12}
          clearcoat={1}
          ior={1.45}
          {...fade}
        />
      );
    case "prism":
      return <meshNormalMaterial {...fade} />;
  }
}
