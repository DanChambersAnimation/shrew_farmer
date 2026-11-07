import { describe, expect, it } from "vite-plus/test";
import { makeTexture, textures } from "./index.ts";

describe("procedural textures", () => {
  it("registers parquet and floorboards", () => {
    expect(textures.names()).toEqual(expect.arrayContaining(["parquet", "floorboards"]));
  });

  it("returns nothing headless, but still rejects unknown names", () => {
    expect(makeTexture("parquet")).toBeNull();
    expect(() => makeTexture("tartan")).toThrow(/Unknown texture "tartan"/);
  });
});
