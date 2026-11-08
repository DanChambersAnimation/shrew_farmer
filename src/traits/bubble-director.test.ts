import { describe, expect, it } from "vite-plus/test";
import { moodOf } from "../characters/mood.ts";
import type { GameObject } from "../core/game-object.ts";
import { rooms } from "../core/room-registry.ts";
import { World } from "../core/world.ts";
import { AudienceModel } from "./audience-model.ts";
import { BubbleDirector, bubblesShown } from "./bubble-director.ts";
import { MOOD_CHANGED, type MoodChange } from "./mood-watch.ts";

import "../rooms/dev0.ts";

/** dev0's hall and audience, with a bubble director added. */
function hall(settings: Partial<typeof BubbleDirector.defaults> = {}) {
  const world = new World();
  world.camera.aspect = 2;
  const room = rooms.load(world, "dev0");
  room.add(BubbleDirector, settings);
  room.update(0);
  const people = [...room.descendants()].filter((o) => o.has(AudienceModel));
  const changes: MoodChange[] = [];
  world.events.on(MOOD_CHANGED, (c) => changes.push(c as MoodChange));
  return { world, room, people, changes };
}

const setMood = (who: GameObject, approval: number, engagement: number) => {
  who.settingsOf(AudienceModel)!.state = { approval, engagement };
};

describe("moodOf", () => {
  it("names the bands", () => {
    expect(moodOf({ approval: 0.9, engagement: 0.9 })).toBe("ecstatic");
    expect(moodOf({ approval: -0.9, engagement: 0.7 })).toBe("hostile");
    expect(moodOf({ approval: 0.9, engagement: 0.1 })).toBe("asleep");
  });
});

describe("speech bubbles", () => {
  it("announces a mood change once it has settled", () => {
    const { room, people, changes } = hall();
    setMood(people[0]!, -0.9, 0.8);
    room.update(0.2);
    expect(changes).toHaveLength(0); // not settled yet
    room.update(0.3);
    expect(changes.map((c) => c.to)).toEqual(["hostile"]);
  });

  it("never shows more than two at once, and spaces them out", () => {
    const { room, people } = hall({ gap: 0.5, spacing: 0 });
    // Everyone turns hostile at once.
    for (const p of people) setMood(p, -0.9, 0.8);
    let most = 0;
    for (let i = 0; i < 40; i++) {
      room.update(0.1);
      most = Math.max(most, bubblesShown(room));
    }
    expect(most).toBe(2);
  });

  it("drops requests nobody had room for", () => {
    const { room, people } = hall({ maxShown: 1, gap: 100, hold: 100, spacing: 0 });
    for (const p of people) setMood(p, -0.9, 0.8);
    for (let i = 0; i < 30; i++) room.update(0.1);
    expect(bubblesShown(room)).toBe(1); // only the first; the rest expired
  });
});
