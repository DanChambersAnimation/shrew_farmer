import { Vector2, type WebGLRenderer } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import type { World } from "../core/world.ts";

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
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(width, height);
  }

  render(world: World): void {
    const camera = world.viewCamera;
    if (!world.bloom) {
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
