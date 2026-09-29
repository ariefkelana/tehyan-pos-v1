const fs = require('fs');

function checkFile(file) {
    let c = fs.readFileSync(file, 'utf8');
    if (c.includes('`n')) {
        c = c.replace(/`n/g, '\n');
        fs.writeFileSync(file, c);
        console.log("Fixed " + file);
    }
}

checkFile('apps/pos/src/App.jsx');
checkFile('apps/pos/src/components/LoginPage.jsx');
checkFile('apps/qr-web/app/layout.jsx');