const fs = require('fs');

const FILE_PATH = 'd:/App/Laragon/laragon/www/HostechBackEnd/frontendV2Hostech/src/PropertyScope/features/rooms/pages/RoomListPage.tsx';
let content = fs.readFileSync(FILE_PATH, 'utf8');

// Colors
content = content.replace(/bg-slate-/g, 'bg-gray-');
content = content.replace(/text-slate-/g, 'text-gray-');
content = content.replace(/border-slate-/g, 'border-gray-');
content = content.replace(/divide-slate-/g, 'divide-gray-');
content = content.replace(/shadow-slate-/g, 'shadow-gray-');
content = content.replace(/hover:bg-slate-/g, 'hover:bg-gray-');
content = content.replace(/hover:text-slate-/g, 'hover:text-gray-');
content = content.replace(/hover:border-slate-/g, 'hover:border-gray-');

content = content.replace(/bg-indigo-/g, 'bg-blue-');
content = content.replace(/text-indigo-/g, 'text-blue-');
content = content.replace(/border-indigo-/g, 'border-blue-');
content = content.replace(/ring-indigo-/g, 'ring-blue-');
content = content.replace(/shadow-indigo-/g, 'shadow-blue-');
content = content.replace(/hover:bg-indigo-/g, 'hover:bg-blue-');
content = content.replace(/hover:text-indigo-/g, 'hover:text-blue-');

// Make text-blue-500 or 600 map to 900 for the navy pattern
content = content.replace(/text-blue-500/g, 'text-blue-900');
content = content.replace(/text-blue-600/g, 'text-blue-900');
content = content.replace(/text-blue-700/g, 'text-blue-900');

// Radius
content = content.replace(/rounded-4xl/g, 'rounded-[12px]');
content = content.replace(/rounded-3xl/g, 'rounded-[12px]');
content = content.replace(/rounded-2xl/g, 'rounded-[8px]');
content = content.replace(/rounded-xl/g, 'rounded-[6px]');
content = content.replace(/rounded-\[32px\]/g, 'rounded-[16px]'); // for modals

// Status Badges
content = content.replace(
  /case 'available': return 'bg-emerald-50 text-emerald-600 border-emerald-100';/g,
  "case 'available': return 'bg-green-50 text-green-700 border-green-200';"
);
content = content.replace(
  /case 'occupied': return 'bg-blue-50 text-blue-900 border-blue-100';/g, // Note: already replaced indigo-600 to blue-900
  "case 'occupied': return 'bg-red-50 text-red-700 border-red-200';"
);
content = content.replace(
  /case 'maintenance': return 'bg-amber-50 text-amber-600 border-amber-100';/g,
  "case 'maintenance': return 'bg-amber-50 text-amber-700 border-amber-200';"
);
content = content.replace(
  /case 'reserved': return 'bg-purple-50 text-purple-600 border-purple-100';/g,
  "case 'reserved': return 'bg-blue-50 text-blue-700 border-blue-200';"
);

// Quick Create Button Fix
// Instead of replacing the giant string, find and replace the classes
content = content.replace(/px-5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-\[6px\] font-bold hover:bg-gray-50 dark:hover:bg-gray-800\/80 transition-all shadow-sm active:scale-95/,
  'px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-[6px] font-semibold hover:bg-gray-50 transition-colors shadow-sm text-[13px] outline-none focus:ring-2 focus:ring-blue-900/50'
);

fs.writeFileSync(FILE_PATH, content);
console.log('RoomListPage.tsx refactored for Navy Blue Theme!');
