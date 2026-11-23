/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { ruleFromTarget } from "../tajwidRuleTap";

function el(html: string): HTMLElement {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div;
}

describe("ruleFromTarget", () => {
  it("finds the rule of the colored span the tap landed in, also from a nested element", () => {
    const root = el('<span data-tj-rule="ikhfa">x<b>y</b></span>');
    expect(ruleFromTarget(root.querySelector("span"))).toBe("ikhfa");
    expect(ruleFromTarget(root.querySelector("b"))).toBe("ikhfa");
  });

  it("returns null for plain text, normal, unknown values and non-elements", () => {
    const root = el('<span>a</span><span data-tj-rule="normal">b</span><span data-tj-rule="idgham">c</span>');
    const spans = root.querySelectorAll("span");
    expect(ruleFromTarget(spans[0])).toBeNull();
    expect(ruleFromTarget(spans[1])).toBeNull();
    expect(ruleFromTarget(spans[2])).toBeNull();
    expect(ruleFromTarget(null)).toBeNull();
    expect(ruleFromTarget(document)).toBeNull();
  });
});
