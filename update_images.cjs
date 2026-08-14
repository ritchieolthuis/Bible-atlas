const fs = require('fs');
const path = require('path');

const dataDir = '/Users/ritchie/.gemini/antigravity/scratch/empire/src/data/empires';

for (const lang of ['nl', 'en']) {
  const filePath = path.join(dataDir, lang, 'tabernacle.ts');
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace the image paths
  content = content.replace(/\/img\/tabernacle\/artifacts\.webp/g, '/img/tabernacle/artifacts.png');
  content = content.replace(/\/img\/tabernacle\/daily-life\.webp/g, '/img/tabernacle/daily-life.png');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated images in ${lang}/tabernacle.ts`);
}
