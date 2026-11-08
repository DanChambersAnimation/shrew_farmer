import { Vector2, type WebGLRenderer } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import type { World } from "../core/world.ts";

/** How much smaller than the screen the bloom is computed. */
const BLOOM_DIVISOR = 2;

/**
 * Draws the world each frame: straight to the screen, or through a bloom pass
 * when the room asks for it (world.bloom). Tone mapping stays as configured on
 * the renderer either way.
 */
export class FrameRenderer {
  private readonly renderer: WebGLRenderer;
  private readonly composer: EffectComposer;
  private readonly scenePass: RenderPass;
  private readonly bloomPass: UnrealBloomPass;

  constructor(renderer: WebGLRenderer, world: World) {
    this.renderer = renderer;
    this.composer = new EffectComposer(renderer);
    this.scenePass = new RenderPass(world.scene, world.camera);
    this.bloomPass = new UnrealBloomPass(new Vector2(1, 1), 0.5, 0.5, 0.85);
    this.composer.addPass(this.scenePass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
  }

  setSize(width: number, height: number): void {
    const ratio = this.renderer.getPixelRatio();
    this.composer.setPixelRatio(ratio);
    this.composer.setSize(width, height);
    // Bloom is a blur, so it can run far below screen resolution: half the
    // width and height here, and the pass halves again internally. This is
    // most of bloom's cost, and the difference barely shows.
    this.bloomPass.setSize((width * ratio) / BLOOM_DIVISOR, (height * ratio) / BLOOM_DIVISOR);
  }

  render(world: World): void {
    const camera = world.viewCamera;
    // No bloom, or too faint to see: skip post-processing entirely.
    if (!world.bloom || world.bloom.strength < 0.001) {
      this.renderer.render(world.scene, camera);
      return;
    }
    this.scenePass.camera = camera;
    this.bloomPass.strength = world.bloom.strength;
    this.bloomPass.radius = world.bloom.radius;
    this.bloomPass.threshold = world.bloom.threshold;
    this.composer.render();
  }
}
