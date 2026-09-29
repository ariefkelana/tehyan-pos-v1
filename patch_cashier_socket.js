const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/components/CashierView.jsx', 'utf8');

const regex = /socket\.on\('new-order'[\s\S]*?return \(\) => \{\s*socket\.disconnect\(\);\s*\};\s*\}, \[\]\);/g;

c = c.replace(regex, `return () => {
      clearInterval(interval);
    };
  }, [fetchOrders]);`);

fs.writeFileSync('apps/pos/src/components/CashierView.jsx', c);