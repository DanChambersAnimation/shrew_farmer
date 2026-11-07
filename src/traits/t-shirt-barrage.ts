import {
  BufferGeometry,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  Shape,
  ShapeGeometry,
  Vector3,
} from "three";
import { defineTrait } from "../core/trait.ts";
import type { Vec3 } from "./types.ts";

/** Emitted on the room for each shirt as it leaves the cannon. */
export const T_SHIRT_FIRED = "t-shirt-fired";

function shirtOutline(): Vector3[] {
  return [
    [-0.12, 0.13],
    [-0.25, 0.06],
    [-0.32, -0.08],
    [-0.21, -0.14],
    [-0.15, -0.06],
    [-0.15, -0.24],
    [0.15, -0.24],
    [0.15, -0.06],
    [0.21, -0.14],
    [0.32, -0.08],
    [0.25, 0.06],
    [0.12, 0.13],
    [0.07, 0.06],
    [-0.07, 0.06],
  ].map(([x, y]) => new Vector3(x!, y!, 0));
}

/** One short, staggered volley of visible shirts. */
export const TShirtBarrage = defineTrait({
  name: "t-shirt-barrage",
  defaults: {
    origin: [0, 1.5, 2] as Vec3,
    targets: [] as Vec3[],
    intervalSeconds: 0.22,
    flightSeconds: 0.9,
  },
  setup({ object, world, settings }) {
    const outline = shirtOutline();
    const shape = new Shape();
    shape.moveTo(outline[0]!.x, outline[0]!.y);
    for (const point of outline.slice(1)) shape.lineTo(point.x, point.y);
    shape.closePath();
    const faceGeometry = new ShapeGeometry(shape);
    const borderGeometry = new BufferGeometry().setFromPoints(outline);
    const faceMaterial = new MeshBasicMaterial({ color: 0xff7187, side: DoubleSide });
    const borderMaterial = new LineBasicMaterial({ color: 0x211529 });
    const shirts = settings.targets.map(() => {
      const group = new Group();
      group.add(new Mesh(faceGeometry, faceMaterial));
      group.add(new LineLoop(borderGeometry, borderMaterial));
      group.visible = false;
      object.node.add(group);
      return group;
    });
    const fired = shirts.map(() => false);
    const origin = new Vector3(...settings.origin);
    let elapsed = 0;
    return {
      update(dt) {
        elapsed += dt;
        for (let index = 0; index < shirts.length; index++) {
          const startAt = index * settings.intervalSeconds;
          if (elapsed < startAt) continue;
          const shirt = shirts[index]!;
          if (!fired[index]) {
            fired[index] = true;
            shirt.visible = true;
            object.parent?.emit(T_SHIRT_FIRED, { index, target: settings.targets[index] });
            playWhomp();
          }
          const progress = Math.min(1, (elapsed - startAt) / settings.flightSeconds);
          shirt.position.lerpVectors(origin, new Vector3(...settings.targets[index]!), progress);
          shirt.position.y += Math.sin(Math.PI * progress) * 0.65;
          shirt.quaternion.copy(world.camera.quaternion);
          shirt.rotateZ(progress * Math.PI * 3 + index * 0.3);
          shirt.visible = progress < 1;
        }
        const endAt = (shirts.length - 1) * settings.intervalSeconds + settings.flightSeconds;
        if (shirts.length === 0 || elapsed >= endAt) object.dispose();
      },
      dispose() {
        faceGeometry.dispose();
        borderGeometry.dispose();
        faceMaterial.dispose();
        borderMaterial.dispose();
      },
    };
  },
});

let audioContext: AudioContext | null = null;

/** A brief falling bass note, started once for each shirt. */
function playWhomp(): void {
  if (typeof AudioContext === "undefined") return;
  audioContext ??= new AudioContext();
  void audioContext.resume();
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(170, now);
  oscillator.frequency.exponentialRampToValueAtTime(55, now + 0.22);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.26);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
}
