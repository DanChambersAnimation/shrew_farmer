import type { AudiencePersonality, AudienceState } from "../characters/audience-model.ts";
import { driftAudienceState, type MemoryEntry, type Neighbour } from "../characters/crowd.ts";
import type { GameObject } from "../core/game-object.ts";
import { defineTrait } from "../core/trait.ts";
import { AudienceModel } from "./audience-model.ts";
import { GameTimer } from "./game-timer.ts";
import { Seat } from "./seat.ts";

/** Emitted on the room after every simulation step, with the step's number and round time. */
export const CROWD_TICK = "crowd-tick";

export interface CrowdTick {
  readonly tick: number;
  /** Round time when the step ran, in seconds. */
  readonly atSeconds: number;
}

/** Adjacency weights: the people beside carry most, the rows in front and behind less. */
export interface NeighbourWeights {
  readonly beside: number;
  readonly aheadOrBehind: number;
}

interface Member {
  readonly object: GameObject;
  readonly state: AudienceState;
  readonly personality: AudiencePersonality;
  readonly memory: MemoryEntry[];
  /** Neighbours and their weights, resolved when the crowd was linked. */
  readonly neighbours: { member: Member; weight: number }[];
}

interface SeatFrame {
  readonly x: number;
  readonly z: number;
}

const seatOf = (member: Member): SeatFrame => {
  const { x, z } = member.object.parent!.node.position;
  return { x, z };
};

/**
 * The room's crowd simulation: once per tick it asks every seated audience
 * member to update, with its neighbours already in hand. Adjacency comes from
 * where the seats sit, so the crowd starts out knowing who sits next to whom.
 */
export const CrowdSimulation = defineTrait({
  name: "crowd-simulation",
  defaults: {
    /** Fixed step so a seeded run replays exactly. */
    tickSeconds: 1,
    neighbourWeights: { beside: 0.5, aheadOrBehind: 0.25 } as NeighbourWeights,
    /** How near another seat must be to count, in metres. */
    neighbourRadius: 1.4,
  },
  setup({ object, settings }) {
    if (!(settings.tickSeconds > 0))
      throw new Error("CrowdSimulation tickSeconds must be positive");
    let members = collect(object);
    linkNeighbours(members, settings.neighbourRadius, settings.neighbourWeights);
    let accumulator = 0;
    let tick = 0;

    return {
      update(dt) {
        accumulator += dt;
        if (accumulator < settings.tickSeconds) return;
        accumulator -= settings.tickSeconds;
        if (members.length === 0) {
          members = collect(object);
          linkNeighbours(members, settings.neighbourRadius, settings.neighbourWeights);
        }
        // Snapshot every mood first, so a step never depends on update order.
        const moods = new Map(members.map((member) => [member, { ...member.state }]));
        for (const member of members) {
          const neighbours: Neighbour[] = member.neighbours.map(({ member: other, weight }) => ({
            state: moods.get(other)!,
            weight,
          }));
          driftAudienceState(member.state, member.personality, neighbours);
        }
        tick++;
        object.emit(CROWD_TICK, {
          tick,
          atSeconds: object.settingsOf(GameTimer)?.elapsedSeconds ?? 0,
        } satisfies CrowdTick);
      },
    };
  },
});

function collect(room: GameObject): Member[] {
  return [...room.descendants()]
    .filter((o) => o.has(AudienceModel) && o.parent?.has(Seat))
    .map((o) => {
      const model = o.settingsOf(AudienceModel)!;
      return {
        object: o,
        state: model.state,
        personality: model.personality,
        memory: model.memory,
        neighbours: [],
      };
    });
}

/**
 * Link the nearest few seats to each other, both ways. Seats in the same row
 * count as beside; anything else within the radius counts as ahead or behind.
 */
function linkNeighbours(members: Member[], radius: number, weights: NeighbourWeights): void {
  const distance = (a: Member, b: Member) =>
    Math.hypot(seatOf(a).x - seatOf(b).x, seatOf(a).z - seatOf(b).z);
  for (const member of members) {
    const near = members
      .filter((other) => other !== member && distance(member, other) <= radius)
      .sort((a, b) => distance(member, a) - distance(member, b))
      .slice(0, 4);
    for (const other of near) {
      const beside = Math.abs(seatOf(other).z - seatOf(member).z) < 0.4;
      const weight = beside ? weights.beside : weights.aheadOrBehind;
      // Both directions share one weight, so influence stays symmetric.
      if (!member.neighbours.some((n) => n.member === other)) {
        member.neighbours.push({ member: other, weight });
      }
      if (!other.neighbours.some((n) => n.member === member)) {
        other.neighbours.push({ member, weight });
      }
    }
  }
}
