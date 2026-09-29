const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/App.jsx', 'utf8');

c = c.replace(/<div className="flex-1 overflow-y-auto p-4 md:p-6">/, '<div className={`flex-1 p-4 md:p-6 ${activeTab === "cashier" ? "overflow-hidden" : "overflow-y-auto"}`}>');

fs.writeFileSync('apps/pos/src/App.jsx', c);