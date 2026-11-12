// Recria as pastas do projeto a partir de codigo.json antes do build.
// Arquivos que ja existem no repositorio tem prioridade (correcoes feitas direto no GitHub).
const fs = require('fs'), path = require('path');
const files = JSON.parse(fs.readFileSync(path.join(__dirname, 'codigo.json'), 'utf8'));
let n = 0;
for (const [f, txt] of Object.entries(files)) {
  const dest = path.join(__dirname, f);
  if (fs.existsSync(dest)) continue;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, txt); n++;
}
console.log('Arquivos recriados:', n);
