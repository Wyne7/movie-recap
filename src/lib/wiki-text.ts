function removeCurlyTemplates(input: string): string {
  let result = "";
  let i = 0;
  while (i < input.length) {
    if (input[i] === "{" && input[i + 1] === "{") {
      let depth = 1;
      i += 2;
      while (i < input.length && depth > 0) {
        if (input[i] === "{" && input[i + 1] === "{") {
          depth += 1;
          i += 2;
        } else if (input[i] === "}" && input[i + 1] === "}") {
          depth -= 1;
          i += 2;
        } else {
          i += 1;
        }
      }
      continue;
    }
    result += input[i];
    i += 1;
  }
  return result;
}

function removeTables(input: string): string {
  let result = "";
  let i = 0;
  while (i < input.length) {
    if (input[i] === "{" && input[i + 1] === "|") {
      const end = input.indexOf("|}", i + 2);
      i = end === -1 ? input.length : end + 2;
      continue;
    }
    result += input[i];
    i += 1;
  }
  return result;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
};

function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (full, entity: string) => {
    if (entity[0] === "#") {
      const hex = entity[1] === "x" || entity[1] === "X";
      const code = hex ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return full;
      return String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? full;
  });
}

export function stripWiki(input: string): string {
  let text = input.replace(/<!--[\s\S]*?-->/g, "");
  text = text.replace(/<ref\b[^>]*\/>/gi, "");
  text = text.replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, "");
  text = removeCurlyTemplates(text);
  text = removeTables(text);
  text = text.replace(/\[\[([^[\]]+)\]\]/g, (_, inner: string) => {
    if (/^(?:file|image):/i.test(inner.trim())) return "";
    const pipe = inner.lastIndexOf("|");
    const label = (pipe >= 0 ? inner.slice(pipe + 1) : inner).trim();
    const hash = label.includes("#") ? (label.split("#").pop() ?? label) : label;
    return hash.trim();
  });
  text = text.replace(/\[(https?:\/\/[^\]\s]+)\s+([^\]]+)\]/g, "$2");
  text = text.replace(/\[https?:\/\/[^\]\s]+\]/g, "");
  text = text.replace(/'''([\s\S]+?)'''/g, "$1");
  text = text.replace(/''([\s\S]+?)''/g, "$1");
  text = text.replace(/^={2,6}\s*(.*?)\s*={2,6}\s*$/gm, "$1");
  text = text.replace(/^[*#;:]+\s?/gm, "");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");
  text = decodeEntities(text);
  text = text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => !/^(plot|synopsis)$/i.test(line))
    .join("\n");
  text = text.replace(/\(\s*\)/g, "");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}
