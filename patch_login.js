const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/components/LoginPage.jsx', 'utf8');

c = c.replace(/bg-zinc-50/g, 'bg-wall-texture');
c = c.replace(/bg-zinc-900/g, 'bg-wall');
c = c.replace(/text-white/g, 'text-mural-blue');
c = c.replace(/text-emerald-400/g, 'text-mural-red');

// Replace the header content specifically
c = c.replace(/<span className="text-5xl">.*<\/span>\s*<h1 className="mt-4 text-2xl font-black text-mural-blue tracking-tight">Kedai TehYan<\/h1>/g, `<div className="inline-block bg-wall border-[4px] border-mural-red p-1 mb-4 shadow-sm">
              <div className="border-[3px] border-mural-blue px-6 py-3 bg-wall flex justify-center items-center">
                <span className="font-cursive text-5xl font-bold text-mural-blue" style={{lineHeight: 1}}>Teh Yan</span>
              </div>
            </div>`);

// Revert the button text color that we accidentally changed
c = c.replace(/<button([^>]*)bg-wall(.*?)text-mural-blue(.*?)>/g, '<button$1bg-mural-red$2text-white$3>');

// Focus rings
c = c.replace(/focus:border-zinc-900 focus:ring-zinc-900/g, 'focus:border-mural-blue focus:ring-mural-blue');

// Revert the header class since bg-zinc-900 was changed to bg-wall but we need border
c = c.replace(/className="bg-wall px-8 py-10 text-center"/g, 'className="bg-wall-dark px-8 py-10 text-center border-b-2 border-gray-200"');

fs.writeFileSync('apps/pos/src/components/LoginPage.jsx', c);