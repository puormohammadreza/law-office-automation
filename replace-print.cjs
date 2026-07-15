const fs = require('fs');
let code = fs.readFileSync('src/components/CaseManager.tsx', 'utf8');

const target = `              <table class="w-full border-collapse border border-slate-350 text-xs text-right" dir="rtl">
                <thead>
                  <tr class="bg-slate-100 font-bold border-b border-slate-350">
                    <th class="border border-slate-350 p-2 text-right">نام و نام خانوادگی</th>
                    <th class="border border-slate-350 p-2 text-right">شماره تماس (تلفن همراه)</th>
                  </tr>
                </thead>
                <tbody>
                  \${caseObj.associatedPersons.map(person => \`
                    <tr>
                      <td class="border border-slate-350 p-2" style="color: #1e40af; font-weight: 600;">\${person.name || "-"}</td>
                      <td class="border border-slate-350 p-2 font-mono" style="color: #1e40af; font-weight: bold;">\${person.phone ? toPersianDigits(person.phone) : "-"}</td>
                    </tr>
                  \`).join("")}
                </tbody>
              </table>`;

const replacement = `              <table class="w-full border-collapse border border-slate-350 text-xs text-right" dir="rtl">
                <thead>
                  <tr class="bg-slate-100 font-bold border-b border-slate-350">
                    <th class="border border-slate-350 p-2 text-right">نام و نام خانوادگی</th>
                    <th class="border border-slate-350 p-2 text-right">سمت</th>
                    <th class="border border-slate-350 p-2 text-right">شماره تماس (تلفن همراه)</th>
                  </tr>
                </thead>
                <tbody>
                  \${caseObj.associatedPersons.map(person => \`
                    <tr>
                      <td class="border border-slate-350 p-2" style="color: #1e40af; font-weight: 600;">\${person.name || "-"}</td>
                      <td class="border border-slate-350 p-2" style="color: #1e40af; font-weight: 600;">\${person.role || "-"}</td>
                      <td class="border border-slate-350 p-2 font-mono" style="color: #1e40af; font-weight: bold;">\${person.phone ? toPersianDigits(person.phone) : "-"}</td>
                    </tr>
                  \`).join("")}
                </tbody>
              </table>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/CaseManager.tsx', code);
  console.log("Success print");
} else {
  console.log("Target not found print");
}
