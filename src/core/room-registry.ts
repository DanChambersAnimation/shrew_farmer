import type { GameObject } from "./game-object.ts";
import type { World } from "./world.ts";

export interface RoomDef {
  /** Unique id used to load the room, e.g. "dev0", "auditorium", "green-room". */
  readonly name: string;
  readonly title?: string;
  /** Free-form tags, e.g. "dev" or "game". */
  readonly tags?: readonly string[];
  /** Populate the room object (already the world root) with objects and traits. */
  build(room: GameObject): void;
}

export class RoomRegistry {
  private readonly rooms = new Map<string, RoomDef>();

  register(def: RoomDef): void {
    if (this.rooms.has(def.name)) throw new Error(`Room "${def.name}" is already registered`);
    this.rooms.set(def.name, def);
  }

  get(name: string): RoomDef | undefined {
    return this.rooms.get(name);
  }

  list(): RoomDef[] {
    return [...this.rooms.values()];
  }

  /** Dispose the current room and build `name` as the world's new root. */
  load(world: World, name: string): GameObject {
    const def = this.rooms.get(name);
    if (!def) throw new Error(`Unknown room "${name}"`);
    const room = world.createRoot(`room:${def.name}`);
    def.build(room);
    return room;
  }
}

/** The game's room registry. Room modules register themselves here. */
export const rooms = new RoomRegistry();
