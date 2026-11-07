import type { AudienceAppearance } from "../characters/audience.ts";
import {
  audienceVisual,
  clampAudienceState,
  type AudiencePersonality,
  type AudienceState,
} from "../characters/audience-model.ts";
import { defineTrait } from "../core/trait.ts";
import { Inspectable, refreshInspection } from "./inspectable.ts";
import { PaperFigure } from "./paper-figure.ts";

/** Inner state is mutable; appearance is the person's fixed visual identity. */
export const AudienceModel = defineTrait({
  name: "audience-model",
  defaults: {
    appearance: { slots: {}, params: {} } as AudienceAppearance,
    personality: {
      gullibility: 0.5,
      intelligence: 0.5,
      superstition: 0.5,
      forgiveness: 0.5,
      sociability: 0.5,
    } as AudiencePersonality,
    state: { approval: 0, engagement: 0.5 } as AudienceState,
  },
  setup({ object, settings }) {
    const figure = object.settingsOf(PaperFigure);
    if (!figure) throw new Error("AudienceModel requires PaperFigure");
    let lastVisual = "";
    const sync = () => {
      clampAudienceState(settings.state);
      const visual = audienceVisual(settings.state);
      const key = `${visual.face}/${visual.arms}`;
      if (key === lastVisual) return;
      lastVisual = key;
      figure.slots = { ...settings.appearance.slots, face: visual.face, arms: visual.arms };
      figure.params = settings.appearance.params;
      const inspect = object.settingsOf(Inspectable);
      if (inspect) {
        inspect.description = visual.description;
        refreshInspection(object);
      }
    };
    sync();
    return { update: sync };
  },
});
