const fs = require('fs');
let layout = fs.readFileSync('apps/qr-web/app/layout.jsx', 'utf8');
layout = layout.replace('>`n        <BackgroundMural', '>\n        <BackgroundMural');
fs.writeFileSync('apps/qr-web/app/layout.jsx', layout);