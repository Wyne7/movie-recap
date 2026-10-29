import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stripWiki } from "../src/lib/wiki-text.ts";

describe("stripWiki", () => {
  it("turns a plot-shaped wikitext fixture into prose", () => {
    const raw = `== Plot ==
<!-- note -->
{{Infobox film|name=Example}}
Mara rang the [[fog bell|brass fog bell]] after the ferry.<ref>A citation.</ref>
[[File:Example.jpg|thumb|A bell]]
She opened the ''green'' ledger.
* A spare list item
{{cite web|url=https://example.com|title=Hidden}}
See [https://example.com the harbor log].`;

    const text = stripWiki(raw);
    assert.match(text, /Mara rang the brass fog bell after the ferry\./);
    assert.match(text, /She opened the green ledger\./);
    assert.match(text, /A spare list item/);
    assert.match(text, /See the harbor log\./);
    assert.equal(text.includes("[["), false);
    assert.equal(text.includes("{{"), false);
    assert.equal(text.includes("<ref"), false);
    assert.equal(/^plot$/im.test(text), false);
  });
});
