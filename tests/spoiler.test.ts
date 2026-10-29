import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sampleDossier } from "../src/lib/sample-film.ts";
import { slicePlot } from "../src/lib/spoiler.ts";
import { leaksExcluded } from "../src/lib/text.ts";

describe("spoiler window", () => {
  const plot = sampleDossier().plot;

  it("keeps the middle of Glass Harbor and drops the ending at 40%", () => {
    const window = slicePlot(plot, 40);
    assert.match(window.allowedText, /green ledger/i);
    assert.equal(/saltglass/i.test(window.allowedText), false);
    assert.equal(/stopped at thirteen/i.test(window.allowedText), false);
    assert.match(window.excludedText, /saltglass/i);
  });

  it("closes the plot at 0% and opens it at 100%", () => {
    assert.equal(slicePlot(plot, 0).allowedText, "");
    const full = slicePlot(plot, 100);
    assert.match(full.allowedText, /saltglass/i);
    assert.equal(full.excludedText, "");
  });

  it("includes a unit only after the watch percent passes its start", () => {
    const units = slicePlot(plot, 100).units;
    const ledger = units.find((unit) => /green ledger/i.test(unit.text));
    assert.ok(ledger);
    const cutoff = Math.floor(ledger.startRatio * 100);
    assert.equal(
      slicePlot(plot, cutoff).allowed.some((unit) => unit.text === ledger.text),
      false,
    );
    assert.equal(
      slicePlot(plot, cutoff + 1).allowed.some((unit) => unit.text === ledger.text),
      true,
    );
  });

  it("flags later-plot wording that is absent from the allowed source", () => {
    const window = slicePlot(plot, 40);
    const allowed = `${sampleDossier().overview}\n${window.allowedText}`;
    assert.equal(
      leaksExcluded("Mara finds the harbor clock stopped at thirteen.", allowed, window.excludedText),
      true,
    );
    assert.equal(leaksExcluded(window.allowedText, allowed, window.excludedText), false);
  });
});
