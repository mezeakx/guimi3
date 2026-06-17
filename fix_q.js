const fs = require('fs');
const f = 'D:\\\\codex\\\\guimi3\\\\frontend\\\\miniprogram\\\\pages\\\\disclaimer\\\\disclaimer.wxml';
let t = fs.readFileSync(f, 'utf8');
t = t.replace('catchtap=\\"noop>\\"', 'catchtap=\\"noop\\"');
fs.writeFileSync(f, t, 'utf8');
console.log('Done');