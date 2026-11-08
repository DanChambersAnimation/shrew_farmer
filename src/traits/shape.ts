import {
  BoxGeometry,
  type BufferGeometry,
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
} from "three";
import { defineTrait } from "../core/trait.ts";
import { makeTexture } from "../textures/index.ts";
import type { Vec3 } from "./types.ts";

export type ShapeKind = "box" | "cylinder" | "sphere" | "plane";

/** `size` is the bounding size [x, y, z]; planes use x and y. */
function makeGeometry(kind: ShapeKind, [x, y, z]: Vec3): BufferGeometry {
  switch (kind) {
    case "box":
      return new BoxGeometry(x, y, z);
    case "cylinder":
      return new CylinderGeometry(x / 2, z / 2, y, 24);
    case "sphere":
      return new SphereGeometry(x / 2, 24, 16);
    case "plane":
      return new PlaneGeometry(x, y);
  }
}

/** Gives the object a solid primitive mesh, centred on the object's origin. */
export const Shape = defineTrait({
  name: "shape",
  defaults: {
    shape: "box" as ShapeKind,
    size: [1, 1, 1] as Vec3,
    color: 0xffffff,
    roughness: 0.8,
    metalness: 0,
    emissive: 0x000000,
    emissiveIntensity: 1,
    castShadow: true,
    receiveShadow: true,
    /** A procedural texture name (see src/textures), tinted by `color`. */
    texture: "",
    /** Metres covered by one repeat of the texture. */
    textureSize: 1.2,
    /** Turn the texture on the surface, degrees (e.g. 45 for diagonal parquet). */
    textureRotation: 0,
    /** Below 1 the surface is see-through (e.g. window glass). */
    opacity: 1,
  },
  setup({ object, settings: s }) {
    const geometry = makeGeometry(s.shape, s.size);
    const map = s.texture ? makeTexture(s.texture) : null;
    // Repeat so one copy of the texture covers `textureSize` metres (on the
    // largest face for boxes: x by z for a floor, x by y for a wall).
    if (map) {
      const [x, y, z] = s.size;
      const [u, v] = s.shape === "box" && y < z ? [x, z] : [x, y];
      map.repeat.set(u / s.textureSize, v / s.textureSize);
      map.center.set(0.5, 0.5);
      map.rotation = (s.textureRotation * Math.PI) / 180;
    }
    const material = new MeshStandardMaterial({
      map,
      color: s.color,
      roughness: s.roughness,
      metalness: s.metalness,
      emissive: s.emissive,
      emissiveIntensity: s.emissiveIntensity,
      opacity: s.opacity,
      transparent: s.opacity < 1,
      // See-through surfaces don't hide what's behind them from the depth test.
      depthWrite: s.opacity >= 1,
    });
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = s.castShadow;
    mesh.receiveShadow = s.receiveShadow;
    object.node.add(mesh);
    return () => {
      mesh.removeFromParent();
      geometry.dispose();
      material.dispose();
      map?.dispose();
    };
  },
});
