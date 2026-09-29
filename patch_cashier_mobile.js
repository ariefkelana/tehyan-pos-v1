const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/components/CashierView.jsx', 'utf8');

c = c.replace(/className="flex w-96 flex-shrink-0 flex-col rounded-\[2rem\]/g, 'className={`flex w-full md:w-96 flex-shrink-0 flex-col rounded-3xl md:rounded-[2rem] ${selectedOrder ? "hidden md:flex" : "flex"}`}');

c = c.replace(/className="flex flex-1 flex-col rounded-\[2rem\]/g, 'className={`flex flex-1 flex-col rounded-3xl md:rounded-[2rem] ${!selectedOrder ? "hidden md:flex" : "flex"}`}');

// Add a "Back" button in the Order Details Header for Mobile!
const headerRegex = /<h2 className="font-semibold text-gray-800">\{order\.orderNumber\}<\/h2>\s*<p className="text-sm text-gray-500">Meja \{order\.table\?\.number \?\? '\?\?\?'\}<\/p>\s*<\/div>/;

const newHeader = `<div className="flex items-center gap-3">
            <button onClick={() => setSelectedOrder(null)} className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
              🔙
            </button>
            <div>
              <h2 className="font-semibold text-gray-800">{order.orderNumber}</h2>
              <p className="text-sm text-gray-500">Meja {order.table?.number ?? '???'}</p>
            </div>
          </div>`;

c = c.replace(headerRegex, newHeader);

// Adjust grid layout for "Tindakan" buttons so it looks good on mobile
c = c.replace(/className="grid grid-cols-2 gap-3"/g, 'className="grid grid-cols-1 md:grid-cols-2 gap-3"');
c = c.replace(/className="grid grid-cols-4 gap-3"/g, 'className="grid grid-cols-2 md:grid-cols-4 gap-3"');

fs.writeFileSync('apps/pos/src/components/CashierView.jsx', c);