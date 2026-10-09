const fs = require('fs');
const path = require('path');

const texturesDir = path.join(__dirname, 'textures');
const outputFile = path.join(__dirname, 'js', 'texturesBase64.js');

const files = fs.readdirSync(texturesDir);
let jsContent = 'const TEXTURES_B64 = {\n';

for (const file of files) {
    if (!file.match(/\.(jpg|png)$/)) continue;
    const ext = path.extname(file).substring(1);
    const mimeMap = {
        'jpg': 'jpeg',
        'png': 'png'
    };
    const mime = mimeMap[ext] || 'jpeg';
    const filePath = path.join(texturesDir, file);
    const b64 = fs.readFileSync(filePath, 'base64');
    
    jsContent += `    '${file}': 'data:image/${mime};base64,${b64}',\n`;
    console.log(`Encoded ${file}`);
}

jsContent += '};\n';
fs.writeFileSync(outputFile, jsContent);
console.log('Success: js/texturesBase64.js generated.');
