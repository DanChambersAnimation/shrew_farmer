import { describe, expect, it } from "vite-plus/test";
import "../effects/library.ts";
import { effects } from "../effects/registry.ts";
import { items } from "../gambits/library.ts";
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

  it("registers a different success and failure recording on every gambit", () => {
    for (const name of items.names()) {
      const item = items.get(name);
      for (const verdict of ["success", "failure"] as const) {
        const id = `gambit/${item.id}/${verdict}`;
        expect(item.simulation[verdict === "success" ? "onSuccess" : "onFailure"]).toContainEqual({
          id,
        });
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
    }
  });
});
