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
  },
  setup({ object, settings: s }) {
    const geometry = makeGeometry(s.shape, s.size);
    const material = new MeshStandardMaterial({
      color: s.color,
      roughness: s.roughness,
      metalness: s.metalness,
      emissive: s.emissive,
      emissiveIntensity: s.emissiveIntensity,
    });
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = s.castShadow;
    mesh.receiveShadow = s.receiveShadow;
    object.node.add(mesh);
    return () => {
      mesh.removeFromParent();
      geometry.dispose();
      material.dispose();
    };
  },
});
