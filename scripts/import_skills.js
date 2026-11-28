const fs = require("fs");
const path = require("path");

const targetBase = path.resolve(".gemini/antigravity/skills/skills");

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Anthropic skills
const anthropicSkillsDir = path.resolve(".temp_anthropics_skills/skills");
if (fs.existsSync(anthropicSkillsDir)) {
  for (const item of fs.readdirSync(anthropicSkillsDir)) {
    const fullItem = path.join(anthropicSkillsDir, item);
    if (fs.statSync(fullItem).isDirectory()) {
      const destDir = path.join(targetBase, item);
      console.log(`Copying Anthropic skill: ${item} -> ${destDir}`);
      copyDirRecursive(fullItem, destDir);
    }
  }
}

// 2. Karpathy skills
const karpathySkillDir = path.resolve(".temp_karpathy_skills/skills/karpathy-guidelines");
if (fs.existsSync(karpathySkillDir)) {
  const destDir = path.join(targetBase, "karpathy-guidelines");
  console.log(`Copying Karpathy skill: karpathy-guidelines -> ${destDir}`);
  copyDirRecursive(karpathySkillDir, destDir);
}

// 3. Matt Pocock skills
const mpCategories = ["engineering", "productivity", "misc"];
for (const cat of mpCategories) {
  const catDir = path.resolve(".temp_mattpocock_skills/skills", cat);
  if (fs.existsSync(catDir)) {
    for (const item of fs.readdirSync(catDir)) {
      const fullItem = path.join(catDir, item);
      if (fs.statSync(fullItem).isDirectory()) {
        let targetName = item;
        const potentialDest = path.join(targetBase, item);
        if (fs.existsSync(potentialDest)) {
          targetName = `mp-${item}`;
        }
        const destDir = path.join(targetBase, targetName);
        console.log(`Copying Matt Pocock (${cat}) skill: ${item} -> ${targetName}`);
        copyDirRecursive(fullItem, destDir);
      }
    }
  }
}

console.log("All skills successfully copied.");
