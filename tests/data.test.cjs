const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {parseCSV,safeURL,normalize} = require('../app.js');
test('CSV preserves quoted commas, escaped quotes, CRLF and multiline fields',()=>{
 assert.deepEqual(parseCSV('Name,Link\r\n"A ""B""","https://example.org/a,b"\r\n"Line\nbreak",x'),[['Name','Link'],['A "B"','https://example.org/a,b'],['Line\nbreak','x']]);
 assert.throws(()=>parseCSV('"unclosed'));
});
test('directory preserves every entry and valid public links',()=>{
 const rows = parseCSV(fs.readFileSync(`${__dirname}/../T1Ds - Sheet1.csv`,'utf8'));
 const metadata=JSON.parse(fs.readFileSync(`${__dirname}/../profiles.json`,'utf8'));
 assert.equal(rows.length-1,28);
 assert.equal(new Set(rows.slice(1).map(r=>r[0])).size,28);
 for(const row of rows.slice(1)){assert.ok(metadata[row[0]]?.field);for(const link of row.slice(2).filter(Boolean))assert.ok(safeURL(link),link);}
 assert.equal(rows.find(r=>r[0]==='Nacho Fernandez')[2],'https://en.wikipedia.org/wiki/Nacho_(footballer,_born_1990)');
 for(const name of ['Lauren Cox','Victor Garber','Brec Bassinger']){assert.ok(safeURL(metadata[name].source));assert.equal(metadata[name].reviewed,'2026-10-01');}
});
test('unsafe protocols are rejected and accented searches normalize',()=>{
 for(const value of ['javascript:alert(1)','data:text/html,hello','invalid',''])assert.equal(safeURL(value),null);
 assert.equal(normalize('Fernández'),'fernandez');
});
