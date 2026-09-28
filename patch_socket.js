const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/lib/socket.js', 'utf8');
c = c.replace(/transports: \['websocket', 'polling'\],/, "transports: ['polling'],\n  upgrade: false,");
fs.writeFileSync('apps/pos/src/lib/socket.js', c);
