import { Group } from "three";
import type { AnyTraitDef, TraitContext, TraitDef, TraitEntry } from "./trait.ts";
import type { World } from "./world.ts";

type Listener = (payload: unknown) => void;

interface Attachment {
  readonly def: AnyTraitDef;
  readonly ctx: TraitContext<object>;
  cleanup?: () => void;
}

/**
 * A container in the world: a scene node, child objects, an event channel and
 * attached traits. It has no gameplay code of its own; all behavior comes from traits.
 */
export class GameObject {
  readonly node = new Group();
  readonly children: GameObject[] = [];
  parent: GameObject | null = null;

  private readonly traits = new Map<AnyTraitDef, Attachment>();
  private readonly listeners = new Map<string, Set<Listener>>();
  private disposed = false;

  readonly kind: string;
  readonly world: World;

  constructor(kind: string, world: World) {
    this.kind = kind;
    this.world = world;
    this.node.name = kind;
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
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(listener);
    return () => set.delete(listener);
  }

  // Iterate over snapshots so listeners and traits may add or remove things mid-loop.
  emit(type: string, payload?: unknown): void {
    for (const listener of Array.from(this.listeners.get(type) ?? [])) listener(payload);
  }

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
    this.listeners.clear();
    this.node.removeFromParent();
    if (this.parent) {
      const siblings = this.parent.children;
      siblings.splice(siblings.indexOf(this), 1);
      this.parent = null;
    }
  }
}
