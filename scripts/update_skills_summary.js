const fs = require('fs');
const path = require('path');

const skillsDir = path.resolve('.gemini/antigravity/skills/skills');
const dirs = fs.readdirSync(skillsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<skills>\n';

for (const dir of dirs.sort()) {
  const skillFile = path.join(skillsDir, dir, 'SKILL.md');
  let desc = '';
  if (fs.existsSync(skillFile)) {
    const content = fs.readFileSync(skillFile, 'utf8');
    const match = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
    if (match) {
      const front = match[1];
      const descMatch = front.match(/description:\s*(?:>|\|)?\s*\n?([^\n\r]+(?:\n[ \t]+[^\n\r]+)*)/);
      if (descMatch) {
        desc = descMatch[1].replace(/^[ \t]+/gm, ' ').replace(/\n/g, ' ').trim();
      }
    }
  }
  const safeDesc = desc
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  xml += `  <skill>\n    <name>${dir}</name>\n    <description>${safeDesc}</description>\n  </skill>\n`;
}
xml += '</skills>\n';

fs.writeFileSync(path.resolve('.gemini/antigravity/skills/skills_summary.xml'), xml, 'utf8');
console.log(`Successfully updated skills_summary.xml with ${dirs.length} skills.`);
