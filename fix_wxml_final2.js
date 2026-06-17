const fs = require('fs');
const f = 'D:\\\\codex\\\\guimi3\\\\frontend\\\\miniprogram\\\\pages\\\\disclaimer\\\\disclaimer.wxml';
const q = Buffer.from('22', 'hex')[0];
const crlf = Buffer.from('0D0A', 'hex');
const lines = [];
function add(line) {
  const buf = Buffer.from(line, 'utf8');
  lines.push(buf);
  lines.push(crlf);
}
add('<!--pages/disclaimer/disclaimer.wxml-->');
add('<view class=' + String.fromCharCode(q) + 'modal-mask' + String.fromCharCode(q) + ' wx:if=' + String.fromCharCode(q) + '{{show}}' + String.fromCharCode(q) + ' bindtap=' + String.fromCharCode(q) + 'accept' + String.fromCharCode(q) + '>');
add('  <view class=' + String.fromCharCode(q) + 'modal-content' + String.fromCharCode(q) + ' catchtap=' + String.fromCharCode(q) + 'noop' + String.fromCharCode(62) + String.fromCharCode(q) + '>');
add('    <view class=' + String.fromCharCode(q) + 'modal-title' + String.fromCharCode(q) + '>免责声明</view>');
add('    <view class=' + String.fromCharCode(q) + 'modal-body' + String.fromCharCode(q) + '>');
add('      <text>闺蜜代回复提供聊天建议和表达参考。</text>');
add('      <text>生成内容仅供用户自主判断和参考。</text>');
add('      <text>本产品不保证任何关系结果，</text>');
add('      <text>亦不对用户实际沟通行为产生的后果负责。</text>');
add('      <text>请理性使用，并结合实际情况进行判断。</text>');
add('    </view>');
add('    <button class=' + String.fromCharCode(q) + 'btn-gradient modal-btn' + String.fromCharCode(q) + ' bindtap=' + String.fromCharCode(q) + 'accept' + String.fromCharCode(q) + '>我知道啦</button>');
add('  </view>');
add('</view>');
const full = Buffer.concat(lines);
fs.writeFileSync(f, full);
console.log('Done');