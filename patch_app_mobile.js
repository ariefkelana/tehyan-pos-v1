const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/App.jsx', 'utf8');

// Hide sidebar on mobile
c = c.replace(/<aside className="flex w-56 flex-col bg-wall-texture border-r border-gray-200 shadow-xl">/, '<aside className="hidden md:flex w-56 flex-col bg-wall-texture border-r border-gray-200 shadow-xl z-20">');

// Add bottom nav before the end of the flex container
const bottomNav = `
      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full bg-wall-texture border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <ul className="flex justify-around items-center p-2">
          {NAV_ITEMS.map((item) => {
            if (user?.role === 'CASHIER' && !['cashier', 'tables', 'reports'].includes(item.id)) return null;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id} className="flex-1">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={\`flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-colors \${isActive ? 'text-mural-red font-bold bg-mural-red/10' : 'text-gray-500'}\`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
`;
c = c.replace(/<\/div>\s*<main/, '<main');
c = c.replace(/<\/main>\s*<\/div>/, '</main>' + bottomNav);

// Add pb-20 to main on mobile so content doesn't get covered by bottom nav
c = c.replace(/<main className="flex flex-1 flex-col overflow-hidden">/, '<main className="flex flex-1 flex-col overflow-hidden pb-20 md:pb-0 relative">');

fs.writeFileSync('apps/pos/src/App.jsx', c);