const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/App.jsx', 'utf8');

c = c.replace(/<div className="flex items-center gap-3 border-b border-gray-700 px-5 py-5">[\s\S]*?<\/div>/, `<div className="flex items-center justify-center p-5 border-b border-gray-200 bg-wall">
          <div className="bg-wall border-[3px] border-mural-red p-1">
            <div className="border-[2px] border-mural-blue px-3 py-1 bg-wall flex justify-center items-center">
              <span className="font-cursive text-2xl font-bold text-mural-blue" style={{lineHeight: 1}}>Teh Yan</span>
            </div>
          </div>
        </div>`);

c = c.replace(/<aside className="flex w-56 flex-col bg-gray-900 text-white shadow-xl">/, `<aside className="flex w-56 flex-col bg-wall-texture border-r border-gray-200 shadow-xl">`);
c = c.replace(/bg-emerald-500 text-white shadow-md/g, `bg-mural-red text-white shadow-md`);
c = c.replace(/text-gray-300 hover:bg-gray-800 hover:text-white/g, `text-gray-600 hover:bg-mural-red/10 hover:text-mural-red`);
c = c.replace(/border-t border-gray-700/g, `border-t border-gray-200`);
c = c.replace(/text-gray-500 uppercase/g, `text-mural-red uppercase font-bold`);
c = c.replace(/text-white/g, `text-gray-800`); // For the username
c = c.replace(/bg-mural-red text-gray-800 shadow-md/g, `bg-mural-red text-white shadow-md`); // Fix the active tab text color back to white
c = c.replace(/text-xs font-semibold text-gray-800/g, `text-xs font-semibold text-gray-800`); 
c = c.replace(/hover:text-red-400/g, `hover:text-mural-red`);

// Wait, the "Memuat" screen
c = c.replace(/bg-gray-900/g, `bg-wall-texture`);
c = c.replace(/text-gray-400/g, `text-gray-600`);

fs.writeFileSync('apps/pos/src/App.jsx', c);