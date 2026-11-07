import { PerspectiveCamera } from "three";
import { describe, expect, it } from "vite-plus/test";
import { Noclip } from "./noclip.ts";

function setup() {
  const camera = new PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 2, 0);
  camera.lookAt(0, 2, -10); // facing -z
  const noclip = new Noclip(camera);
  return { camera, noclip };
}

describe("Noclip", () => {
  it("does nothing until toggled on", () => {
    const { camera, noclip } = setup();
    noclip.press("KeyW");
    noclip.update(1);
    expect(camera.position.toArray()).toEqual([0, 2, 0]);
  });

  it("moves along the view direction, and vertically with R/F", () => {
    const { camera, noclip } = setup();
    noclip.toggle();
    noclip.press("KeyW");
    noclip.update(1);
    expect(camera.position.z).toBeCloseTo(-3);
    noclip.release("KeyW");
    noclip.press("KeyR");
    noclip.update(1);
    expect(camera.position.y).toBeCloseTo(5);
  });

  it("turns with the mouse and reports CameraView settings", () => {
    const { noclip } = setup();
    noclip.toggle();
    noclip.look(-Math.PI / 2 / 0.0025, 0); // turn 90° left: now facing -x
    const s = noclip.settings();
    expect(s.position).toEqual([0, 2, 0]);
    expect(s.lookAt[0]).toBeCloseTo(-10);
    expect(noclip.snippet()).toMatch(/^position: \[0, 2, 0\], lookAt: \[-10, 2, -?0\], fov: 50$/);
  });
});
