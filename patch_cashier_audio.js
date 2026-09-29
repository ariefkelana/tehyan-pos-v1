const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/components/CashierView.jsx', 'utf8');

c = c.replace(/\{\/\* Hidden audio for new order notification \*\/}[\s\S]*?<audio ref=\{audioRef\} src="\/notification\.mp3" preload="auto" \/>/g, "");
c = c.replace(/const audioRef = useRef\(null\);\r?\n/, "");

fs.writeFileSync('apps/pos/src/components/CashierView.jsx', c);