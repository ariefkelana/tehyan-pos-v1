const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/App.jsx', 'utf8');

// Add users tab
c = c.replace(/\{ id: 'reports', label: 'Laporan', icon: '.*' \},/, "{ id: 'reports', label: 'Laporan', icon: '??' },\n  { id: 'users', label: 'Akun', icon: '??' },");

// Change cashier visibility logic
c = c.replace(/if \(user\?\.role === 'CASHIER' && !.*\.includes\(item\.id\)\) \{/, "if (user?.role === 'CASHIER' && !['cashier', 'tables', 'reports'].includes(item.id)) {");

// Add UserManager component rendering
c = c.replace(/\{activeTab === 'reports' && <ReportsDashboard \/>\}/, "{activeTab === 'reports' && <ReportsDashboard />}\n          {activeTab === 'users' && <UserManager />}");

// Add import for UserManager
c = c.replace(/import ReportsDashboard from '.\/components\/ReportsDashboard.jsx';/, "import ReportsDashboard from './components/ReportsDashboard.jsx';\nimport UserManager from './components/UserManager.jsx';");

fs.writeFileSync('apps/pos/src/App.jsx', c);
