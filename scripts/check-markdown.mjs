// Verifies what the editor's renderer (marked + gfm) actually produces for each
// construct, and whether the article CSS styles the result. Run with:
//   node scripts/check-markdown.mjs
//
// This exists so the cheat sheet in docs/markdown-cheatsheet.html documents
// real behaviour instead of what Markdown "should" do.

import { marked } from "marked";

const samples = {
  "heading h2": "## Sub judul",
  "heading h3": "### Sub-sub judul",
  "heading h1": "# Judul level satu",
  bold: "**tebal**",
  italic: "*miring*",
  strikethrough: "~~coret~~",
  "inline code": "Pakai `npm run build` sekarang.",
  link: "[teks](https://contoh.com)",
  "image": "![keterangan](https://contoh.com/gambar.png)",
  "unordered list": "- satu\n- dua",
  "ordered list": "1. satu\n2. dua",
  "nested list": "- satu\n  - satu.a\n- dua",
  "task list": "- [ ] belum\n- [x] sudah",
  blockquote: "> kutipan",
  "fenced code": "```bash\nnpm run build\n```",
  "fenced code no lang": "```\nplain\n```",
  table: "| Kolom | Isi |\n| --- | --- |\n| satu | dua |",
  "table aligned": "| Kiri | Tengah | Kanan |\n| :-- | :-: | --: |\n| a | b | c |",
  hr: "---",
  "html passthrough": "<div class=\"x\">html mentah</div>",
  "line break (two spaces)": "baris satu  \nbaris dua",
  "autolink": "https://contoh.com",
};

for (const [name, source] of Object.entries(samples)) {
  const html = marked.parse(source, { gfm: true, async: false }).trim();
  console.log(`\n--- ${name} ---`);
  console.log("input :", JSON.stringify(source));
  console.log("output:", html.length > 300 ? `${html.slice(0, 300)}…` : html);
}
