// Jalankan: node scripts/xlsx_to_json.js
const xlsx = require('xlsx');
const fs = require('fs');

const input = 'public/20260505_072732.xlsx';
const output = 'public/20260505_072732.json';

const wb = xlsx.readFile(input);
const sheets = wb.SheetNames;
const result = {};

sheets.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  result[sheetName] = xlsx.utils.sheet_to_json(ws, { defval: null });
});

fs.writeFileSync(output, JSON.stringify(result, null, 2));
console.log('Konversi selesai:', output);
