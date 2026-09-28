const fs=require('fs');
let c=fs.readFileSync('apps/backend/src/server.js', 'utf8');
c = c.replace("const apiRouter = require('./routes/api');", "const apiRouter = require('./routes/api');\nconst usersRouter = require('./routes/users');");
c = c.replace("app.use('/api', apiRouter);", "app.use('/api', apiRouter);\napp.use('/api/users', usersRouter);");
fs.writeFileSync('apps/backend/src/server.js', c);