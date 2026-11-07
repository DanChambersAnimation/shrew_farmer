import { describe, expect, it } from "vite-plus/test";
import { ARM_POSES, MOUTHS, SPEAKER } from "../characters/speaker.ts";
import { mouthsForText } from "./lipsync.ts";
import { type Rig, renderRig, slotNames, variantNames } from "./rig.ts";

const rig: Rig = {
  width: 10,
  height: 10,
  layers: [
    { svg: "<base/>" },
    { slot: "mouth", variants: { rest: "<rest/>", O: "<o/>" }, defaultVariant: "rest" },
    { slot: "arm", variants: { up: "<up/>" }, defaultVariant: "up", transform: "scale(-1 1)" },
  ],
};

describe("renderRig", () => {
  it("draws layers in order with defaults and selections", () => {
    expect(renderRig(rig)).toContain('<base/><rest/><g transform="scale(-1 1)"><up/></g>');
    expect(renderRig(rig, { mouth: "O" })).toContain("<base/><o/>");
  });

  it("rejects unknown slots and variants", () => {
    expect(() => renderRig(rig, { tail: "wag" })).toThrow(/no slot "tail"/);
    expect(() => renderRig(rig, { mouth: "X" })).toThrow(/no variant "X"/);
  });

  it("lists slots and variants", () => {
    expect(slotNames(rig)).toEqual(["mouth", "arm"]);
    expect(variantNames(rig, "mouth")).toEqual(["rest", "O"]);
  });
});

describe("rig params", () => {
  const painted: Rig = {
    width: 1,
    height: 1,
    params: { top: "red" },
    layers: [{ svg: '<rect fill="{{top}}"/>' }],
  };

  it("fills placeholders from defaults and overrides", () => {
    expect(renderRig(painted)).toContain('fill="red"');
    expect(renderRig(painted, {}, undefined, { top: "blue" })).toContain('fill="blue"');
  });

  it("rejects unknown params", () => {
    expect(() => renderRig(painted, {}, undefined, { hat: "x" })).toThrow(/no param "hat"/);
  });

  it("lets several layers share one slot", () => {
    const layered: Rig = {
      width: 1,
      height: 1,
      layers: [
        { slot: "hair", variants: { a: "<back-a/>", b: "<back-b/>" }, defaultVariant: "a" },
        { slot: "hair", variants: { a: "<front-a/>", b: "<front-b/>" }, defaultVariant: "a" },
      ],
    };
    expect(slotNames(layered)).toEqual(["hair"]);
    expect(renderRig(layered, { hair: "b" })).toContain("<back-b/><front-b/>");
  });
});

describe("speaker rig", () => {
  it("renders every arm pose on both arms and every mouth", () => {
    for (const pose of Object.keys(ARM_POSES)) {
      expect(renderRig(SPEAKER, { armLeft: pose, armRight: pose })).toMatch(/^<svg/);
    }
    for (const mouth of Object.keys(MOUTHS)) {
      expect(renderRig(SPEAKER, { mouth })).toMatch(/^<svg/);
    }
  });
});

describe("mouthsForText", () => {
  it("maps letters, digraphs and pauses to mouths", () => {
    const frames = mouthsForText("Both, ok", MOUTHS, { rest: "rest", fallback: "etc" });
    expect(frames.map((f) => `${f.text}:${f.mouth}`)).toEqual([
      "B:MBP",
      "O:O",
      "TH:L",
      ",:rest",
      " :rest",
      "O:O",
      "K:etc",
    ]);
  });

  it("uses the fallback for uncovered letters", () => {
    expect(mouthsForText("R", MOUTHS, { rest: "rest", fallback: "etc" })[0]?.mouth).toBe("etc");
  });
});
