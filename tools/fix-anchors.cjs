#!/usr/bin/env node
/** Applies a verified anchor correction to both locales at once, so NL and EN
 *  never drift apart. Matches on the hotspot id, not on line numbers. */
const fs = require('fs');

const [, , building, ...pairs] = process.argv;
const fixes = {};
for (const p of pairs) {
  const [id, vec, snap] = p.split('=');
  fixes[id] = { vec, snap };
}

for (const loc of ['nl', 'en']) {
  const file = `src/data/empires/${loc}/${building}.ts`;
  if (!fs.existsSync(file)) { console.log('skip (missing) ' + file); continue; }
  let src = fs.readFileSync(file, 'utf8');
  let n = 0;
  for (const [id, { vec, snap }] of Object.entries(fixes)) {
    // find the hotspot block for this id, then rewrite only its anchor/snap
    const re = new RegExp(`(id: "${id}"[\\s\\S]{0,900}?anchor: )\\[[^\\]]*\\]`);
    if (!re.test(src)) { console.log(`  !! ${loc}/${building}: id "${id}" not found`); continue; }
    src = src.replace(re, `$1[${vec}]`);
    if (snap) {
      const rs = new RegExp(`(id: "${id}"[\\s\\S]{0,900}?anchor: \\[[^\\]]*\\],\\n\\s*snap: )"[a-z]*"`);
      if (rs.test(src)) src = src.replace(rs, `$1"${snap}"`);
    }
    n++;
  }
  fs.writeFileSync(file, src);
  console.log(`${file}: ${n} anchors updated`);
}
