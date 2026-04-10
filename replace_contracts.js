const fs = require('fs');

const FILES = [
  'd:/App/Laragon/laragon/www/HostechBackEnd/frontendV2Hostech/src/PropertyScope/features/contracts/pages/ContractListPage.tsx',
  'd:/App/Laragon/laragon/www/HostechBackEnd/frontendV2Hostech/src/PropertyScope/features/contracts/pages/ContractCreatePage.tsx',
  'd:/App/Laragon/laragon/www/HostechBackEnd/frontendV2Hostech/src/PropertyScope/features/contracts/components/ContractTable.tsx',
  'd:/App/Laragon/laragon/www/HostechBackEnd/frontendV2Hostech/src/PropertyScope/features/contracts/components/ContractWizard.tsx'
];

FILES.forEach(FILE_PATH => {
  if (!fs.existsSync(FILE_PATH)) {
    console.log('Skipping ' + FILE_PATH);
    return;
  }
  
  let content = fs.readFileSync(FILE_PATH, 'utf8');

  // Colors mapping
  content = content.replace(/bg-slate-/g, 'bg-gray-');
  content = content.replace(/text-slate-/g, 'text-gray-');
  content = content.replace(/border-slate-/g, 'border-gray-');
  content = content.replace(/divide-slate-/g, 'divide-gray-');
  content = content.replace(/shadow-slate-/g, 'shadow-gray-');
  content = content.replace(/ring-slate-/g, 'ring-gray-');
  content = content.replace(/hover:bg-slate-/g, 'hover:bg-gray-');
  content = content.replace(/hover:text-slate-/g, 'hover:text-gray-');
  content = content.replace(/hover:border-slate-/g, 'hover:border-gray-');

  // Indigo to blue transition
  content = content.replace(/bg-indigo-/g, 'bg-blue-');
  content = content.replace(/text-indigo-/g, 'text-blue-');
  content = content.replace(/border-indigo-/g, 'border-blue-');
  content = content.replace(/ring-indigo-/g, 'ring-blue-');
  content = content.replace(/shadow-indigo-/g, 'shadow-blue-');
  content = content.replace(/hover:bg-indigo-/g, 'hover:bg-blue-');
  content = content.replace(/hover:text-indigo-/g, 'hover:text-blue-');

  // Consolidate blue text scale
  content = content.replace(/text-blue-500/g, 'text-blue-900');
  content = content.replace(/text-blue-600/g, 'text-blue-900');
  content = content.replace(/text-blue-700/g, 'text-blue-900');
  
  // Specific Page Layout adjustments
  content = content.replace(/bg-\[#f8fafc\]/g, 'bg-gray-50');

  // Radius normalization
  content = content.replace(/rounded-4xl/g, 'rounded-[12px]');
  content = content.replace(/rounded-3xl/g, 'rounded-[12px]');
  content = content.replace(/rounded-2xl/g, 'rounded-[10px]');
  // For standard elements we leave rounded-xl or rounded-lg alone to not break everything.

  // Primary Create Action Button (ContractListPage)
  if (FILE_PATH.includes('ContractListPage.tsx')) {
    content = content.replace(
      /className="rounded-2xl px-8 h-14 text-base font-black shadow-xl shadow-blue-100 .* text-white"/,
      'className="rounded-[6px] px-8 h-14 text-[14px] font-bold shadow-sm active:scale-95 transition-all bg-amber-500 hover:bg-amber-600 text-white border-0"'
    );
  }

  // Contract Table status badge adjustments
  if (FILE_PATH.includes('ContractTable.tsx')) {
    // Already replaced slate with gray, indigo with blue
    // Enhance status badge styling
  }
  
  if (FILE_PATH.includes('ContractWizard.tsx')) {
    // Keep internal circle radiuses mapped correctly
    content = content.replace(/w-10 h-10 rounded-\[10px\]/g, 'w-10 h-10 rounded-2xl');
    
    // Switch the indicator progress bar to Amber/Navy
    content = content.replace(/from-blue-500 to-blue-400/g, 'from-blue-900 to-blue-800');
    // Switch the active node background
    content = content.replace(/backgroundColor: isActive \? '#4f46e5' : '#ffffff'/g, "backgroundColor: isActive ? '#1E3A8A' : '#ffffff'");
    content = content.replace(/borderColor: isActive \? '#4f46e5' : '#f1f5f9'/g, "borderColor: isActive ? '#1E3A8A' : '#e5e7eb'");
  }

  fs.writeFileSync(FILE_PATH, content);
  console.log(`Refactored ${FILE_PATH}`);
});
