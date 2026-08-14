const fs = require('fs');
const path = require('path');

const dataDir = '/Users/ritchie/.gemini/antigravity/scratch/empire/src/data/empires';

const fixes = {
  'ezekiel_temple.ts': {
    'sanctuary': { anchor: [0.5, 0.6, 0.4], snap: 'roof' },
    'altar': { anchor: [0.5, 0.3, 0.65], snap: 'roof' },
    'east_gate': { anchor: [0.5, 0.2, 0.95], snap: 'wall' },
    'river': { anchor: [0.5, 0.1, 0.8], snap: 'court' },
    'chambers': { anchor: [0.2, 0.4, 0.5], snap: 'roof' }
  },
  'noahs_ark.ts': {
    'pitch': { anchor: [0.2, 0.5, 0.5], snap: 'wall' },
    'window': { anchor: [0.5, 0.9, 0.5], snap: 'roof' },
    'door': { anchor: [0.8, 0.4, 0.5], snap: 'wall' },
    'stories': { anchor: [0.5, 0.5, 0.9], snap: 'wall' }
  },
  'tower_babel.ts': {
    'brick': { anchor: [0.5, 0.3, 0.2], snap: 'wall' },
    'slime': { anchor: [0.5, 0.1, 0.2], snap: 'wall' },
    'top': { anchor: [0.5, 0.95, 0.5], snap: 'roof' },
    'city': { anchor: [0.2, 0.1, 0.8], snap: 'court' }
  },
  'walls_jericho.ts': {
    'wall': { anchor: [0.5, 0.5, 0.9], snap: 'wall' },
    'rahab': { anchor: [0.4, 0.8, 0.9], snap: 'roof' },
    'gate': { anchor: [0.5, 0.2, 0.9], snap: 'wall' },
    'camp': { anchor: [0.5, 0.1, 0.2], snap: 'court' }
  }
};

for (const lang of ['nl', 'en']) {
  for (const [filename, fileFixes] of Object.entries(fixes)) {
    const filePath = path.join(dataDir, lang, filename);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    for (const [id, fix] of Object.entries(fileFixes)) {
      // Use regex to find the hotspot block for this ID
      // This is a bit tricky, let's find id: "something", and then replace its anchor and snap
      const idRegex = new RegExp(`id:\\s*"${id}"[\\s\\S]*?anchor:\\s*\\[[^\\]]+\\][\\s\\S]*?snap:\\s*"[^"]+"`, 'g');
      
      content = content.replace(idRegex, (match) => {
        let newMatch = match.replace(/anchor:\s*\[[^\]]+\]/, `anchor: [${fix.anchor.join(', ')}]`);
        newMatch = newMatch.replace(/snap:\s*"[^"]+"/, `snap: "${fix.snap}"`);
        return newMatch;
      });
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${lang}/${filename}`);
  }
}
