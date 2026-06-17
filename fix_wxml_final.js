const fs = require('fs');
const f = 'D:\\\\codex\\\\guimi3\\\\frontend\\\\miniprogram\\\\pages\\\\disclaimer\\\\disclaimer.wxml';
const content = '<!--pages/disclaimer/disclaimer.wxml-->' + String.fromCharCode(13,10) +
'<view class="' + String.fromCharCode(34) + 'modal-mask' + String.fromCharCode(34) + ' wx:if="' + String.fromCharCode(34) + '{{show}}' + String.fromCharCode(34) + ' bindtap="' + String.fromCharCode(34) + 'accept' + String.fromCharCode(34) + '">' + String.fromCharCode(13,10) +
'  <view class="' + String.fromCharCode(34) + 'modal-content' + String.fromCharCode(34) + ' catchtap="' + String.fromCharCode(34) + 'noop' + String.fromCharCode(62) + String.fromCharCode(34) + '">' + String.fromCharCode(13,10) +
'    <view class="' + String.fromCharCode(34) + 'modal-title' + String.fromCharCode(34) + '">免责声明</view>' + String.fromCharCode(13,10) +
'    <view class="' + String.fromCharCode(34) + 'modal-body' + String.fromCharCode(34) + '">' + String.fromCharCode(13,10) +
'      <text>闺蜜代回复提供聊天建议和表达参考。</text>' + String.fromCharCode(13,10) +
'      <text>生成内容仅供用户自主判断和参考。</text>' + String.fromCharCode(13,10) +
'      <text>本产品不保证任何关系结果，</text>' + String.fromCharCode(13,10) +
'      <text>亦不对用户实际沟通行为产生的后果负责。</text>' + String.fromCharCode(13,10) +
'      <text>请理性使用，并结合实际情况进行判断。</text>' + String.fromCharCode(13,10) +
'    </view>' + String.fromCharCode(13,10) +
'    <button class="' + String.fromCharCode(34) + 'btn-gradient modal-btn' + String.fromCharCode(34) + ' bindtap="' + String.fromCharCode(34) + 'accept' + String.fromCharCode(34) + '">我知道啦</button>' + String.fromCharCode(13,10) +
'  </view>' + String.fromCharCode(13,10) +
'</view>';
fs.writeFileSync(f, content, 'utf8');
console.log('Done');