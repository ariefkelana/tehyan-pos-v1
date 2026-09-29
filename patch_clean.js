const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/components/CashierView.jsx', 'utf8');

c = c.replace(/\/\/ ─── New order from customer[\s\S]*?socket\.on\('new-order',[\s\S]*?return \(\) => \{\s*socket\.disconnect\(\);\s*\};\s*\}, \[\]\);/g, "    return () => clearInterval(interval);\n  }, [fetchOrders]);");

// Clean up any remaining socket stuff
c = c.replace(/const \[isConnected, setIsConnected\] = useState\(false\);/, '');
c = c.replace(/const socketRef = useRef\(null\);/, '');

fs.writeFileSync('apps/pos/src/components/CashierView.jsx', c);