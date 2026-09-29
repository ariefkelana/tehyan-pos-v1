const fs = require('fs');
let c = fs.readFileSync('apps/pos/index.html', 'utf8');
c = c.replace(
  '</title>', 
  '</title>\n    <link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">'
);
fs.writeFileSync('apps/pos/index.html', c);