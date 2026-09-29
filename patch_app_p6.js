const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/App.jsx', 'utf8');

c = c.replace(/className="flex-1 overflow-y-auto p-6"/g, 'className="flex-1 overflow-y-auto p-4 md:p-6"');

fs.writeFileSync('apps/pos/src/App.jsx', c);