const fs = require('fs');
const path = require('path');

const dataDir = '/Users/ritchie/.gemini/antigravity/scratch/empire/src/data/empires';

const reverts = {
  'solomon_temple.ts': {
    'boaz_pillar': { anchor: [0.35, 0.44, 0.95], snap: 'roof' },
    'jachin_pillar': { anchor: [0.48, 0.44, 0.95], snap: 'roof' },
    'porch': { anchor: [0.415, 0.52, 0.92], snap: 'roof' },
    'brasen_sea': { anchor: [0.72, 0.42, 0.82], snap: 'roof' },
    'oracle': { anchor: [0.415, 0.70, 0.22], snap: 'roof' },
    'side_chambers': { anchor: [0.18, 0.45, 0.50], snap: 'wall' }
  },
  'herods_temple.ts': {
    'sanctuary': { anchor: [0.50, 0.85, 0.45], snap: 'roof' },
    'pinnacle': { anchor: [0.50, 1.0, 0.42], snap: 'roof' },
    'treasury': { anchor: [0.50, 0.08, 0.58], snap: 'court' },
    'outer_court': { anchor: [0.62, 0.02, 0.72], snap: 'court' },
    'solomons_porch': { anchor: [0.50, 0.18, 0.95], snap: 'wall' },
    'beautiful_gate': { anchor: [0.50, 0.22, 0.88], snap: 'wall' },
    'antonia': { anchor: [0.12, 0.70, 0.08], snap: 'roof' }
  }
};

for (const lang of ['nl', 'en']) {
  for (const [filename, fileFixes] of Object.entries(reverts)) {
    const filePath = path.join(dataDir, lang, filename);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    for (const [id, fix] of Object.entries(fileFixes)) {
      const idRegex = new RegExp(`id:\\s*"${id}"[\\s\\S]*?anchor:\\s*\\[[^\\]]+\\][\\s\\S]*?snap:\\s*"[^"]+"`, 'g');
      content = content.replace(idRegex, (match) => {
        let newMatch = match.replace(/anchor:\s*\[[^\]]+\]/, `anchor: [${fix.anchor.join(', ')}]`);
        newMatch = newMatch.replace(/snap:\s*"[^"]+"/, `snap: "${fix.snap}"`);
        return newMatch;
      });
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Reverted ${lang}/${filename}`);
  }
}
