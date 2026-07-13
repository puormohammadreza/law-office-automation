import fs from 'fs';
let code = fs.readFileSync('src/utils/calculators.ts', 'utf8');

// Find the first /** which is the start of the original file
const idx = code.indexOf('/**\n * Legal calculations');
if (idx !== -1) {
  code = code.substring(idx);
}

// Write back
fs.writeFileSync('src/utils/calculators.ts', code);
