import type { GameObject } from "../core/game-object.ts";
import type { World } from "../core/world.ts";
import {
  AmbientLight,
  DirectionalLight,
  OrthographicCamera,
  Scene,
  Vector3,
  type WebGLRenderer,
} from "three";
import { items } from "../gambits/library.ts";
import type { ItemDef } from "../gambits/effect.ts";
import { resolveItem, type CrowdMember } from "../gambits/resolve.ts";
import { AudienceModel } from "../traits/audience-model.ts";
import { Seat } from "../traits/seat.ts";
import { GameTimer } from "../traits/game-timer.ts";
import { GAMBIT_PLAYED, Gambits, canPlay, gambitStatus, playGambit } from "../traits/gambits.ts";
import { createGambitMedal, medalJiggle } from "../prefabs/gambit-medal.ts";
import { createMaterialise } from "./materialise.ts";

/** Everything the rack needs from the running game. */
export interface RackHost {
  readonly world: World;
  readonly room: GameObject;
}

interface RackEntry {
  readonly button: HTMLButtonElement;
  /** The icon face inside the button. Cooldown marks live here, not on the row slot. */
  readonly icon: HTMLSpanElement;
  readonly item: ItemDef;
  readonly medal: ReturnType<typeof createGambitMedal>;
  readonly phase: number;
  dissolve: ReturnType<typeof createMaterialise> | null;
  placed: boolean;
}

function phaseFor(id: string): number {
  let hash = 0;
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 0x45d9f3b);
  return ((hash >>> 0) / 0x100000000) * Math.PI * 2;
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
 * Accessible hit targets over a separately rendered row of 3D medals. A
 * spent medal boils away; a cooling one remains visible but cannot be used.
 */
export class GambitRack {
  private readonly root: HTMLDivElement;
  private readonly medals = new Map<string, RackEntry>();
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  private host: RackHost | null = null;
  private elapsed = 0;

  constructor(container: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "gambit-rack";
    this.root.setAttribute("role", "toolbar");
    this.root.setAttribute("aria-label", "Gambits");
    container.appendChild(this.root);
    this.scene.add(new AmbientLight(0xffffff, 2));
    const light = new DirectionalLight(0xffffff, 2.5);
    light.position.set(-3, 5, 8);
    this.scene.add(light);
  }

  /** Point the rack at a room, rebuilding the row from that room's hand. */
  show(host: RackHost | null): void {
    this.host = host;
    for (const entry of this.medals.values()) {
      entry.dissolve?.finish();
      this.scene.remove(entry.medal.group);
      entry.medal.dispose();
    }
    this.medals.clear();
    this.root.replaceChildren();
    this.root.hidden = !host;
    if (!host) return;

    const hand = host.room.settingsOf(Gambits)?.hand ?? [];
    if (hand.length === 0) {
      this.root.hidden = true;
      return;
    }
    for (const id of hand) this.addEntry(id);
    this.refresh();
  }

  /** Build a hit target and medal for one gambit and put it in the row. */
  private addEntry(id: string): void {
    if (!items.has(id) || this.medals.has(id)) return;
    const item = items.get(id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gambit-medal-button";
    button.dataset.gambit = id;
    button.dataset.shape = item.medal.shape;
    button.title = item.name;
    button.setAttribute("aria-label", item.name);
    button.addEventListener("click", () => this.play(id));
    // The icon travels with its gambit; the button only reserves the slot.
    const icon = document.createElement("span");
    icon.className = "gambit-medal-icon";
    icon.setAttribute("aria-hidden", "true");
    button.appendChild(icon);
    this.root.appendChild(button);
    const medal = createGambitMedal(item.medal);
    this.scene.add(medal.group);
    this.medals.set(id, {
      button,
      icon,
      item,
      medal,
      phase: phaseFor(id),
      dissolve: null,
      placed: false,
    });
  }

  /** Put the buttons in the hand's order, moving as few as possible. */
  private orderRow(hand: readonly string[]): void {
    let previous: HTMLElement | null = null;
    for (const id of hand) {
      const entry = this.medals.get(id);
      if (!entry) continue;
      const expected: Element | null = previous
        ? previous.nextElementSibling
        : this.root.firstElementChild;
      if (expected !== entry.button) this.root.insertBefore(entry.button, expected);
      previous = entry.button;
    }
  }

  /** Update hit targets, jiggle, and disappearing medals once a frame. */
  refresh(dt = 0): void {
    const host = this.host;
    if (!host) return;
    this.elapsed += dt;
    const clock = host.room.settingsOf(GameTimer);
    const atSeconds = clock?.elapsedSeconds ?? 0;
    const over = clock !== undefined && !clock.running;
    const hand = host.room.settingsOf(Gambits)?.hand ?? [];
    // A fresh gambit may have replaced a burned one; add it and order the row
    // the way the hand is ordered, so it takes the burned gambit's place.
    for (const id of hand) this.addEntry(id);
    this.orderRow(hand);
    for (const [id, entry] of this.medals) {
      const { button, item, medal } = entry;
      const spent = !hand.includes(id);
      const playable = canPlay(host.room, id, atSeconds);
      button.disabled = !playable;
      const cooldown = !over && !spent ? gambitStatus(host.room, id, atSeconds)?.cooldown : null;
      // The countdown is part of the medal's own 3D group, so it travels with
      // the icon when the row re-sorts rather than staying in its old slot.
      if (cooldown) {
        medal.setCooldown(cooldown.remainingSeconds, cooldown.durationSeconds);
        const seconds = Math.ceil(cooldown.remainingSeconds);
        const label = `${item.name}, ready in ${seconds} ${seconds === 1 ? "second" : "seconds"}`;
        button.title = label;
        button.setAttribute("aria-label", label);
      } else {
        medal.setCooldown(0, 0);
        button.title = item.name;
        button.setAttribute("aria-label", item.name);
      }
      if (spent && !entry.dissolve) {
        entry.dissolve = createMaterialise(medal.group, {
          seconds: 0.9,
          out: true,
          reduced: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
        });
      }
      const rect = button.getBoundingClientRect();
      const motion = medalJiggle(this.elapsed, entry.phase);
      const x = rect.left + rect.width / 2 - window.innerWidth / 2;
      const y = window.innerHeight / 2 - rect.top - rect.height / 2 + motion.bob;
      if (entry.placed) {
        medal.group.position.x += (x - medal.group.position.x) * Math.min(1, dt * 12);
        medal.group.position.y += (y - medal.group.position.y) * Math.min(1, dt * 12);
      } else {
        medal.group.position.set(x, y, 0);
        entry.placed = true;
      }
      medal.group.rotation.set(motion.x, motion.y, motion.z);
      const hovered = button.matches(":hover, :focus-visible") && playable;
      medal.group.scale.setScalar(rect.width * (hovered ? 0.95 : 0.88));
      if (entry.dissolve && !entry.dissolve.update(dt)) {
        this.scene.remove(medal.group);
        medal.dispose();
        button.remove();
        this.medals.delete(id);
      }
    }
    this.root.dataset.finished = String(over);
  }

  /** Draw over the world using the existing WebGL canvas and a pixel-sized camera. */
  render(renderer: WebGLRenderer): void {
    if (this.medals.size === 0) return;
    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.position.set(0, 0, 100);
    this.camera.updateProjectionMatrix();
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(this.scene, this.camera);
    renderer.autoClear = autoClear;
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
