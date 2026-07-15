const fs = require('fs');
let code = fs.readFileSync('src/components/CaseManager.tsx', 'utf8');

const target = `                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] text-slate-400 block pr-1">شماره تماس</label>
`;

const replacement = `                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] text-slate-400 block pr-1">سمت</label>
                        <input 
                          type="text" 
                          placeholder="مثال: کارشناس" 
                          value={p.role || ""} 
                          onChange={(e) => {
                            const newList = [...caseAssociatedPersons];
                            newList[idx].role = e.target.value;
                            setCaseAssociatedPersons(newList);
                          }} 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-slate-900 text-xs font-bold" 
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] text-slate-400 block pr-1">شماره تماس</label>
`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/CaseManager.tsx', code);
  console.log("Success");
} else {
  console.log("Target not found");
}
