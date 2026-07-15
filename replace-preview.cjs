const fs = require('fs');
let code = fs.readFileSync('src/components/CaseManager.tsx', 'utf8');

const target = `                  <table className="w-full border-collapse border border-slate-200 text-xs text-right rounded-2xl overflow-hidden" dir="rtl">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-700">
                        <th className="border border-slate-200 p-3 text-right">نام و نام خانوادگی</th>
                        <th className="border border-slate-200 p-3 text-right">شماره تماس (تلفن همراه)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printableCase.associatedPersons.map((person, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition">
                          <td className="border border-slate-200 p-3 text-blue-600 font-semibold">{person.name || "-"}</td>
                          <td className="border border-slate-200 p-3 font-mono text-blue-600 font-semibold">{person.phone ? toPersianDigits(person.phone) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>`;

const replacement = `                  <table className="w-full border-collapse border border-slate-200 text-xs text-right rounded-2xl overflow-hidden" dir="rtl">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-700">
                        <th className="border border-slate-200 p-3 text-right">نام و نام خانوادگی</th>
                        <th className="border border-slate-200 p-3 text-right">سمت</th>
                        <th className="border border-slate-200 p-3 text-right">شماره تماس (تلفن همراه)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printableCase.associatedPersons.map((person, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition">
                          <td className="border border-slate-200 p-3 text-blue-600 font-semibold">{person.name || "-"}</td>
                          <td className="border border-slate-200 p-3 text-blue-600 font-semibold">{person.role || "-"}</td>
                          <td className="border border-slate-200 p-3 font-mono text-blue-600 font-semibold">{person.phone ? toPersianDigits(person.phone) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/CaseManager.tsx', code);
  console.log("Success preview");
} else {
  console.log("Target not found preview");
}
