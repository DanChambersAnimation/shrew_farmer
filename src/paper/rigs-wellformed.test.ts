import { describe, expect, it } from "vite-plus/test";
import { rigs } from "./library.ts";
import { renderRig, slotNames, variantNames } from "./rig.ts";

/**
 * Browsers load SVG images with a strict XML parser and silently show nothing
 * on errors, so check every tag: no duplicate attributes, tags balanced.
 */
function xmlProblems(svg: string): string[] {
  const problems: string[] = [];
  const stack: string[] = [];
  for (const [tag, closing, name, attrs, selfClosing] of svg.matchAll(
    /<(\/?)([\w:-]+)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g,
  )) {
    if (closing) {
      if (stack.pop() !== name) problems.push(`unbalanced ${tag}`);
      continue;
    }
    const names = [...attrs!.matchAll(/([\w:-]+)="/g)].map((m) => m[1]);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    if (dupes.length) problems.push(`duplicate ${dupes.join(", ")} in ${tag.slice(0, 80)}`);
    if (!selfClosing) stack.push(name!);
  }
  if (stack.length) problems.push(`unclosed ${stack.join(", ")}`);
  // Anything that looks like a tag but didn't match the pattern is malformed.
  const tags = svg.match(/<[^>]*>/g) ?? [];
  const matched = svg.match(/<(\/?)([\w:-]+)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g) ?? [];
  if (tags.length !== matched.length) problems.push("malformed tag");
  return problems;
}

describe("every rig variant is well-formed SVG", () => {
  for (const name of rigs.names()) {
    const rig = rigs.get(name);
    it(name, () => {
      const problems = new Set<string>();
      for (const slot of slotNames(rig)) {
        for (const variant of variantNames(rig, slot)) {
          for (const p of xmlProblems(renderRig(rig, { [slot]: variant }))) {
            problems.add(`${slot}=${variant}: ${p}`);
          }
        }
      }
      expect([...problems]).toEqual([]);
    });
  }

  it("the checker catches duplicates", () => {
    expect(xmlProblems('<svg><path a="1" a="2"/></svg>')).toHaveLength(1);
  });
});
