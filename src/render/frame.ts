import type { WebGLRenderer } from "three";
import type { World } from "../core/world.ts";

/**
 * Draws the world each frame, straight to the screen. Glow is done with cheap
 * additive cards in the scene (see the Glow trait), so there's no
 * post-processing pass.
 */
export class FrameRenderer {
  private readonly renderer: WebGLRenderer;

  constructor(renderer: WebGLRenderer) {
    this.renderer = renderer;
  }

  render(world: World): void {
    this.renderer.render(world.scene, world.viewCamera);
  }
}
