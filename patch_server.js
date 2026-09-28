const fs = require('fs');
let c = fs.readFileSync('apps/backend/src/server.js', 'utf8');
c = c.replace("app.use('/api/orders', require('./routes/orders'));", "app.use('/api/orders', require('./routes/orders'));\napp.use('/api/users', require('./routes/users'));");
fs.writeFileSync('apps/backend/src/server.js', c);
