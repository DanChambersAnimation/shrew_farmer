import { describe, expect, it } from "vite-plus/test";
import "../effects/library.ts";
import { effects } from "../effects/registry.ts";
import { personalAnecdote } from "../gambits/items/anecdote.ts";
import { AUDIO_CLIPS, clips } from "./clips.ts";

describe("recorded audio registry", () => {
  it("indexes every file with review metadata and an exact filename", () => {
    for (const clip of AUDIO_CLIPS) {
      expect(clips.get(clip.id)).toBe(clip);
      expect(clip.filename).toBe(`${clip.id}.mp3`);
      expect(clip.id.startsWith(`${clip.category}/`)).toBe(true);
      expect(clip.name).toBeTruthy();
      expect(clip.purpose).toBeTruthy();
      expect(clip.caption).toBeTruthy();
    }
  });

  it("registers distinct success and failure sounds on the gambit's verdict hooks", () => {
    const successId = "gambit/personal-anecdote/success";
    const failureId = "gambit/personal-anecdote/failure";
    expect(personalAnecdote.simulation.onSuccess).toContainEqual({ id: successId });
    expect(personalAnecdote.simulation.onFailure).toContainEqual({ id: failureId });
    for (const id of [successId, failureId]) {
      const clip = clips.get(id);
      expect(effects.get(id)).toMatchObject({
        id,
        kind: "audio",
        name: clip.name,
        category: clip.category,
        purpose: clip.purpose,
        filename: clip.filename,
      });
    }
  });
});
