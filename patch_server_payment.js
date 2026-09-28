const fs = require('fs');
let c = fs.readFileSync('apps/backend/src/server.js', 'utf8');
if (!c.includes('./routes/payments')) {
  c = c.replace("const usersRouter = require('./routes/users');", "const usersRouter = require('./routes/users');\nconst paymentsRouter = require('./routes/payments');");
  c = c.replace("app.use('/api/users', usersRouter);", "app.use('/api/users', usersRouter);\napp.use('/api/payments', paymentsRouter);");
  fs.writeFileSync('apps/backend/src/server.js', c);
}