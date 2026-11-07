import type { GameObject } from "../core/game-object.ts";
import type { World } from "../core/world.ts";
import { Vector3 } from "three";
import { items } from "../gambits/library.ts";
import type { ItemDef } from "../gambits/effect.ts";
import { resolveItem, type CrowdMember } from "../gambits/resolve.ts";
import { AudienceModel } from "../traits/audience-model.ts";
import { Seat } from "../traits/seat.ts";
import { GameTimer } from "../traits/game-timer.ts";
import { GAMBIT_PLAYED, Gambits, canPlay, playGambit } from "../traits/gambits.ts";

/** Everything the rack needs from the running game. */
export interface RackHost {
  readonly world: World;
  readonly room: GameObject;
}

/** The audience as the resolver wants it: state, personality, memory and seat. */
function crowdOf(room: GameObject): CrowdMember[] {
  return [...room.descendants()]
    .filter((object) => object.has(AudienceModel) && object.parent?.has(Seat))
    .map((object) => {
      const model = object.settingsOf(AudienceModel)!;
      const { x, y, z } = object.node.getWorldPosition(new Vector3());
      return {
        state: model.state,
        personality: model.personality,
        memory: model.memory,
        position: [x, y + 0.55, z] as CrowdMember["position"],
      };
    });
}

/**
 * The row of gambit icons above the round meter. Shows the round's hand, plays
 * one when clicked, and greys out anything unplayable (spent, on cooldown, or
 * the round is over).
 */
export class GambitRack {
  private readonly root: HTMLDivElement;
  private readonly buttons = new Map<string, HTMLButtonElement>();
  private host: RackHost | null = null;

  constructor(container: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "gambit-rack";
    this.root.setAttribute("role", "toolbar");
    this.root.setAttribute("aria-label", "Gambits");
    container.appendChild(this.root);
  }

  /** Point the rack at a room, rebuilding the row from that room's hand. */
  show(host: RackHost | null): void {
    this.host = host;
    this.root.replaceChildren();
    this.buttons.clear();
    this.root.hidden = !host;
    if (!host) return;

    const hand = host.room.settingsOf(Gambits)?.hand ?? [];
    if (hand.length === 0) {
      this.root.hidden = true;
      return;
    }
    for (const id of hand) {
      if (!items.has(id)) continue;
      const item = items.get(id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gambit-icon";
      button.dataset.gambit = id;
      button.title = item.name;
      button.setAttribute("aria-label", item.name);

      const image = document.createElement("img");
      image.src = item.icon;
      image.alt = "";
      image.draggable = false;
      button.appendChild(image);

      button.addEventListener("click", () => this.play(id));
      this.root.appendChild(button);
      this.buttons.set(id, button);
    }
    this.refresh();
  }

  /** Update the enabled state of every icon. Call once a frame. */
  refresh(): void {
    const host = this.host;
    if (!host) return;
    const clock = host.room.settingsOf(GameTimer);
    const atSeconds = clock?.elapsedSeconds ?? 0;
    const over = clock !== undefined && !clock.running;
    for (const [id, button] of this.buttons) {
      const playable = canPlay(host.room, id, atSeconds);
      button.disabled = !playable;
      button.dataset.spent = String(over || !playable);
    }
    this.root.dataset.finished = String(over);
  }

  private play(id: string): void {
    const host = this.host;
    if (!host || !items.has(id)) return;
    const item = items.get(id);
    const atSeconds = host.room.settingsOf(GameTimer)?.elapsedSeconds ?? 0;
    // The room emits synchronously. Listen before the use so a third beat is
    // resolved exactly once; earlier beats only advance the counter.
    let triggered = false;
    const off = host.room.on(GAMBIT_PLAYED, (payload) => {
      const event = payload as { item: ItemDef };
      if (event.item.id === item.id) triggered = true;
    });
    const accepted = playGambit(host.room, item, atSeconds);
    off();
    if (!accepted) return;
    if (triggered) this.resolve(item, atSeconds);
    this.refresh();
  }

  private resolve(item: ItemDef, atSeconds: number): void {
    if (!this.host) return;
    resolveItem(item, crowdOf(this.host.room), atSeconds, this.host);
  }
}
