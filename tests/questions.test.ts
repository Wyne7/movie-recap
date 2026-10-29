import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractAnswer, extractRecap } from "../src/lib/extract.ts";
import { assessQuestion, spoilerLineMessage } from "../src/lib/questions.ts";
import { sampleDossier } from "../src/lib/sample-film.ts";
import { slicePlot } from "../src/lib/spoiler.ts";
import { toPublicMovie } from "../src/lib/dossier.ts";

describe("questions and extracts", () => {
  const movie = sampleDossier();

  it("blocks ending questions and later-only details before the line", () => {
    const early = slicePlot(movie.plot, 40);
    assert.equal(assessQuestion("Explain the ending", early, 40).action, "block-spoiler");
    assert.equal(assessQuestion("Where is the saltglass key?", early, 40).action, "block-spoiler");
    assert.equal(spoilerLineMessage(40).includes("saltglass"), false);
  });

  it("answers an in-bounds detail and the ending only at the finish line", () => {
    const early = slicePlot(movie.plot, 40);
    const ledger = assessQuestion("Why is there a green ledger?", early, 40);
    assert.equal(ledger.action, "answer");
    if (ledger.action === "answer") {
      assert.match(ledger.focus.map((unit) => unit.text).join(" "), /green ledger/i);
    }

    const done = slicePlot(movie.plot, 100);
    const ending = assessQuestion("Explain the ending", done, 100);
    assert.equal(ending.action, "answer");
    if (ending.action === "answer") {
      const answer = extractAnswer(ending.focus, movie.runtimeMinutes, "detailed").answer;
      assert.match(answer, /saltglass/i);
    }
  });

  it("does not put later plot into a bounded recap or the public payload", () => {
    const window = slicePlot(movie.plot, 40);
    const recap = extractRecap({
      movie,
      type: "full-plot",
      length: "detailed",
      watchPercent: 40,
      window,
    });
    assert.match(recap.recap, /green ledger/i);
    assert.equal(/saltglass/i.test(recap.recap), false);
    assert.equal(/thirteen/i.test(JSON.stringify(recap.moments)), false);

    const safe = extractRecap({
      movie,
      type: "spoiler-free",
      length: "detailed",
      watchPercent: 100,
      window: slicePlot(movie.plot, 100),
    });
    assert.equal(/ledger/i.test(safe.recap), false);
    assert.equal(/saltglass/i.test(safe.recap), false);

    const payload = JSON.stringify(toPublicMovie(movie));
    assert.equal(payload.includes("saltglass"), false);
    assert.equal(payload.includes("green ledger"), false);
    assert.equal(payload.includes("\"plot\""), false);
  });
});
