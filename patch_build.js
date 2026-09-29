const fs = require('fs');

let app = fs.readFileSync('apps/pos/src/App.jsx', 'utf8');
app = app.replace('`n', '\n');
app = app.replace('bg-transparent z-0"\\n      <BackgroundMural opacity="opacity-15" />>', 'bg-transparent z-0">\n      <BackgroundMural opacity="opacity-15" />');
app = app.replace('bg-transparent z-0"\n      <BackgroundMural opacity="opacity-15" />>', 'bg-transparent z-0">\n      <BackgroundMural opacity="opacity-15" />');
fs.writeFileSync('apps/pos/src/App.jsx', app);

let login = fs.readFileSync('apps/pos/src/components/LoginPage.jsx', 'utf8');
login = login.replace('`n', '\n');
login = login.replace('bg-transparent p-4 relative z-0"\\n      <BackgroundMural opacity="opacity-30" />>', 'bg-transparent p-4 relative z-0">\n      <BackgroundMural opacity="opacity-30" />');
login = login.replace('bg-transparent p-4 relative z-0"\n      <BackgroundMural opacity="opacity-30" />>', 'bg-transparent p-4 relative z-0">\n      <BackgroundMural opacity="opacity-30" />');
fs.writeFileSync('apps/pos/src/components/LoginPage.jsx', login);

let layout = fs.readFileSync('apps/qr-web/app/layout.jsx', 'utf8');
layout = layout.replace('`n', '\n');
layout = layout.replace('bg-transparent font-sans text-gray-800 relative z-0"\\n        <BackgroundMural opacity="opacity-10" />>', 'bg-transparent font-sans text-gray-800 relative z-0">\n        <BackgroundMural opacity="opacity-10" />');
layout = layout.replace('bg-transparent font-sans text-gray-800 relative z-0"\n        <BackgroundMural opacity="opacity-10" />>', 'bg-transparent font-sans text-gray-800 relative z-0">\n        <BackgroundMural opacity="opacity-10" />');
fs.writeFileSync('apps/qr-web/app/layout.jsx', layout);