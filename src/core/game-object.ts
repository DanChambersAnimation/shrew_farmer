import { Group, type Object3D } from "three";
import { Emitter, type Listener } from "./emitter.ts";
import type { AnyTraitDef, TraitContext, TraitDef, TraitEntry } from "./trait.ts";
import type { World } from "./world.ts";

interface Attachment {
  readonly def: AnyTraitDef;
  readonly ctx: TraitContext<object>;
  cleanup?: () => void;
}

const OWNER = "gameObject";

/**
 * A container in the world: a scene node, child objects, an event channel and
 * attached traits. It has no gameplay code of its own; all behavior comes from traits.
 */
export class GameObject {
  readonly node = new Group();
  readonly children: GameObject[] = [];
  parent: GameObject | null = null;

  private readonly traits = new Map<AnyTraitDef, Attachment>();
  private readonly events = new Emitter();
  private disposed = false;

  readonly kind: string;
  readonly world: World;

  constructor(kind: string, world: World) {
    this.kind = kind;
    this.world = world;
    this.node.name = kind;
    this.node.userData[OWNER] = this;
  }

  /** The object that owns a scene node, searching up from `node`. */
  static owning(node: Object3D | null): GameObject | null {
    for (let n = node; n; n = n.parent) {
      const owner: unknown = n.userData[OWNER];
      if (owner instanceof GameObject) return owner;
    }
    return null;
  }

  /** This object followed by its parents, up to the root. */
  ancestry(): GameObject[] {
    const chain: GameObject[] = [this];
    for (let o = this.parent; o; o = o.parent) chain.push(o);
    return chain;
  }

  /** Attach a trait. Settings are merged over the trait's defaults. */
  add<S extends object>(def: TraitDef<S>, settings: Partial<S> = {}): this {
    if (this.traits.has(def)) {
      throw new Error(`Trait "${def.name}" is already attached to "${this.kind}"`);
    }
    const ctx: TraitContext<S> = {
      object: this,
      settings: { ...structuredClone(def.defaults), ...settings },
      world: this.world,
    };
    const attachment: Attachment = { def, ctx };
    this.traits.set(def, attachment);
    const cleanup = def.setup?.(ctx);
    if (cleanup) attachment.cleanup = cleanup;
    return this;
  }

  /** Detach a trait, running its cleanup. No-op if not attached. */
  remove(def: AnyTraitDef): this {
    const attachment = this.traits.get(def);
    if (!attachment) return this;
    this.traits.delete(def);
    attachment.cleanup?.();
    return this;
  }

  has(def: AnyTraitDef): boolean {
    return this.traits.has(def);
  }

  /** The live settings of an attached trait, or undefined. */
  settingsOf<S extends object>(def: TraitDef<S>): S | undefined {
    return this.traits.get(def)?.ctx.settings as S | undefined;
  }

  traitNames(): string[] {
    return [...this.traits.keys()].map((def) => def.name);
  }

  /** Create a child object. */
  spawn(kind: string, traits: readonly TraitEntry[] = []): GameObject {
    const child = new GameObject(kind, this.world);
    child.parent = this;
    this.children.push(child);
    this.node.add(child.node);
    for (const { def, settings } of traits) child.add(def, settings);
    return child;
  }

  /** Subscribe to an event on this object. Returns an unsubscribe function. */
  on(type: string, listener: Listener): () => void {
    return this.events.on(type, listener);
  }

  emit(type: string, payload?: unknown): void {
    this.events.emit(type, payload);
  }

  listens(type: string): boolean {
    return this.events.listens(type);
  }

  // Iterate over snapshots so traits may add or remove things mid-loop.
  update(dt: number): void {
    for (const { def, ctx } of Array.from(this.traits.values())) def.update?.(ctx, dt);
    for (const child of Array.from(this.children)) child.update(dt);
  }

  /** Dispose children, then detach traits in reverse order, then leave the parent. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const child of [...this.children].reverse()) child.dispose();
    for (const def of [...this.traits.keys()].reverse()) this.remove(def);
    this.events.clear();
    this.node.removeFromParent();
    if (this.parent) {
      const siblings = this.parent.children;
      siblings.splice(siblings.indexOf(this), 1);
      this.parent = null;
    }
  }
}
