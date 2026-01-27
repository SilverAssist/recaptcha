#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const clientFiles = [
  'dist/client/index.js',
  'dist/client/index.mjs',
];

clientFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.startsWith('"use client"')) {
      fs.writeFileSync(filePath, '"use client";\n\n' + content, 'utf8');
      console.log(`✅ Added "use client" directive to ${file}`);
    } else {
      console.log(`⏭️  ${file} already has "use client" directive`);
    }
  }
});
