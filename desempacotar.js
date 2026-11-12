// Recria as pastas do projeto a partir de codigo.json antes do build.
const fs = require('fs'), path = require('path');
const files = JSON.parse(fs.readFileSync(path.join(__dirname, 'codigo.json'), 'utf8'));
for (const [f, txt] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(path.join(__dirname, f)), { recursive: true });
  fs.writeFileSync(path.join(__dirname, f), txt);
}
console.log('Arquivos recriados:', Object.keys(files).length);
