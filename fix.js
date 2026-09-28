const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/components/CashierView.jsx', 'utf8');

// Replace axios import with api import
c = c.replace(/import axios from 'axios';/, "import api from '../lib/api.js';");

// Remove local API_BASE since api instance already has baseURL
c = c.replace(/const API_BASE = 'https:\/\/tehyan-pos-v1-backend\.vercel\.app\/api';/, '');

// Replace the hardcoded axios.get with api.get
c = c.replace(/axios\.get\(API_BASE \+ '\/orders', \{ headers: \{ Authorization: 'Bearer ' \+ localStorage\.getItem\('pos_token'\) \} \}\)/g, "api.get('/orders')");

// Replace the hardcoded axios.patch with api.patch
c = c.replace(/axios\.patch\(API_BASE \+ '\/orders\/' \+ orderId \+ '\/status', \{ status: newStatus \}, \{ headers: \{ Authorization: 'Bearer ' \+ localStorage\.getItem\('pos_token'\) \} \}\)/g, "api.patch('/orders/' + orderId + '/status', { status: newStatus })");

fs.writeFileSync('apps/pos/src/components/CashierView.jsx', c);
