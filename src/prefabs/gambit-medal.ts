import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  SphereGeometry,
  TorusGeometry,
  type BufferGeometry,
  type Material,
} from "three";
import type { MedalDef } from "../gambits/effect.ts";
import { createMedalCooldown } from "./gambit-medal-cooldown.ts";

/** Small independent movements, in radians and screen pixels. */
export function medalJiggle(seconds: number, phase: number) {
  const cycle = (Math.PI * 2 * seconds) / 2.6 + phase;
  return {
    x: 0.08 * Math.sin(cycle),
    y: 0.11 * Math.sin(cycle * 0.8 + 0.5),
    z: 0.05 * Math.sin(cycle * 1.3 + 1),
    bob: 1.5 * Math.sin(cycle * 1.1),
  };
}

/** Make a shallow metal medal with a raised geometric emblem on its face. */
export function createGambitMedal(def: MedalDef) {
  const group = new Group();
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const metal = new MeshStandardMaterial({
    color: def.metal,
    metalness: 0.35,
    roughness: 0.3,
  });
  const inset = new MeshBasicMaterial({ color: 0x211529, toneMapped: false });
  const enamel = new MeshBasicMaterial({ color: 0xfff0bd, toneMapped: false });
  const accent = new MeshBasicMaterial({ color: 0xff7187, toneMapped: false });
  const ink = new MeshBasicMaterial({ color: 0x211529, toneMapped: false });
  const beats: Mesh[][] = [];
  materials.push(metal, inset, enamel, accent, ink);

  const addShape = (
    points: readonly (readonly [number, number])[],
    material: Material = enamel,
    depth = 0.055,
  ) => {
    const shape = new Shape();
    shape.moveTo(...points[0]!);
    for (const [x, y] of points.slice(1)) shape.lineTo(x, y);
    shape.closePath();
    const geometry = new ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 1,
    });
    geometries.push(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.position.z = 0.135;
    group.add(mesh);
    return mesh;
  };
  const addBar = (
    x: number,
    y: number,
    width: number,
    height: number,
    material: Material = enamel,
  ) => {
    const geometry = new BoxGeometry(width, height, 0.06);
    geometries.push(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, 0.17);
    group.add(mesh);
    return mesh;
  };
  const addDot = (x: number, y: number, radius: number, material: Material = enamel) => {
    const geometry = new SphereGeometry(radius, 14, 10);
    geometries.push(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, 0.17);
    group.add(mesh);
    return mesh;
  };

  if (def.shape === "round") {
    const body = new CylinderGeometry(0.5, 0.5, 0.18, 48);
    body.rotateX(Math.PI / 2);
    const rim = new TorusGeometry(0.46, 0.035, 8, 48);
    const well = new CircleGeometry(0.43, 48);
    geometries.push(body, rim, well);
    group.add(new Mesh(body, metal));
    const darkFace = new Mesh(well, inset);
    darkFace.position.z = 0.095;
    group.add(darkFace);
    const raisedRim = new Mesh(rim, metal);
    raisedRim.position.z = 0.12;
    group.add(raisedRim);
  } else {
    const body = new BoxGeometry(1, 1, 0.18);
    const well = new PlaneGeometry(0.9, 0.9);
    geometries.push(body, well);
    group.add(new Mesh(body, metal));
    const darkFace = new Mesh(well, inset);
    darkFace.position.z = 0.095;
    group.add(darkFace);
  }

  switch (def.emblem) {
    case "story":
      addShape([
        [-0.28, 0.23],
        [0.28, 0.23],
        [0.28, -0.13],
        [-0.08, -0.13],
        [-0.25, -0.29],
        [-0.25, -0.13],
        [-0.28, -0.13],
      ]);
      addDot(0, 0.1, 0.055, ink);
      addBar(0, -0.01, 0.2, 0.045, ink);
      break;
    case "callback": {
      const arc = new TorusGeometry(0.22, 0.055, 8, 40, Math.PI * 1.55);
      geometries.push(arc);
      const loop = new Mesh(arc, enamel);
      loop.position.z = 0.17;
      group.add(loop);
      addShape([
        [0.02, -0.28],
        [0.27, -0.22],
        [0.15, -0.02],
      ]);
      addDot(0, 0, 0.055, accent);
      break;
    }
    case "three":
      for (const [index, height] of [0.15, 0.25, 0.36].entries()) {
        const x = (index - 1) * 0.24;
        beats.push([addBar(x, -0.28 + height / 2, 0.12, height), addDot(x, -0.28 + height, 0.07)]);
      }
      break;
    case "book":
      addShape([
        [-0.32, 0.16],
        [-0.04, 0.09],
        [-0.04, -0.25],
        [-0.32, -0.18],
      ]);
      addShape([
        [0.04, 0.09],
        [0.32, 0.16],
        [0.32, -0.18],
        [0.04, -0.25],
      ]);
      addBar(0, -0.08, 0.035, 0.34, ink);
      addBar(0, 0.28, 0.05, 0.19, accent);
      addBar(0, 0.3, 0.18, 0.05, accent);
      break;
    case "praise":
      addBar(0, 0, 0.12, 0.57);
      addBar(0, 0.09, 0.4, 0.12);
      for (let index = 0; index < 8; index++) {
        const angle = (index * Math.PI) / 4;
        const ray = new BoxGeometry(0.045, 0.11, 0.045);
        geometries.push(ray);
        const mesh = new Mesh(ray, accent);
        mesh.position.set(Math.sin(angle) * 0.38, Math.cos(angle) * 0.38, 0.17);
        mesh.rotation.z = -angle;
        group.add(mesh);
      }
      break;
    case "shirt":
      addShape(
        [
          [-0.12, 0.28],
          [-0.32, 0.15],
          [-0.37, -0.03],
          [-0.22, -0.11],
          [-0.17, -0.03],
          [-0.17, -0.28],
          [0.17, -0.28],
          [0.17, -0.03],
          [0.22, -0.11],
          [0.37, -0.03],
          [0.32, 0.15],
          [0.12, 0.28],
          [0.07, 0.18],
          [-0.07, 0.18],
        ],
        accent,
      );
      addBar(0, -0.1, 0.17, 0.055, enamel);
      break;
  }

  const cooldown = createMedalCooldown(def.shape);
  group.add(cooldown.group);

  return {
    group,
    setCooldown: (remaining: number, duration: number) => cooldown.set(remaining, duration),
    /** Light one mark for each accepted beat of Rule of Three. */
    setStage(uses: number) {
      for (const [index, meshes] of beats.entries()) {
        for (const mesh of meshes) mesh.material = index < uses ? accent : enamel;
      }
    },
    dispose() {
      cooldown.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
    },
  };
}
