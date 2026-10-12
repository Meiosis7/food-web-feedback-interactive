const assert = require('node:assert/strict');
const {test} = require('node:test');
let M; try { M=require('./model.js'); } catch { M={}; }
test('从生产者到最高捕食者完整枚举食物链，箭头为食物到取食者',()=>{
  assert.equal(typeof M.chains,'function');
  const chains=M.chains();
  assert.equal(chains.length,5);
  assert.ok(chains.every(c=>c[0]==='grass' && c.at(-1)==='hawk'));
  assert.deepEqual(chains.map(c=>c.join('>')).sort(),[
    'grass>rabbit>hawk','grass>mouse>hawk','grass>mouse>snake>hawk',
    'grass>hopper>frog>hawk','grass>hopper>frog>snake>hawk'].sort());
});
test('鹰跨三个营养级，蛇跨两个；消费者级别比营养级少一',()=>{
  assert.equal(typeof M.levels,'function');
  assert.deepEqual(M.levels('grass'),[1]);
  assert.deepEqual(M.levels('hawk'),[3,4,5]);
  assert.deepEqual(M.levels('snake'),[3,4]);
  assert.equal(M.consumerName(3),'次级消费者');
});
test('鼠增加后鹰滞后增加，鼠回落并在阻尼模型中趋于初始平衡',()=>{
  assert.equal(typeof M.simulate,'function');
  const data=M.simulate('pulse',40);
  const first=data.find(p=>p.t>=8);
  assert.ok(first.mouse>139 && first.mouse<141);
  assert.ok(Math.abs(first.hawk-100)<.1);
  assert.ok(data.some(p=>p.t>10 && p.hawk>105));
  assert.ok(data.some(p=>p.t>10 && p.mouse<100));
  assert.ok(Math.abs(data.at(-1).mouse-100)<2);
  assert.ok(Math.abs(data.at(-1).hawk-100)<2);
});
test('持续降低鹰数量改变长期平衡；数据有界且重复定位一致',()=>{
  assert.equal(typeof M.simulate,'function');
  const data=M.simulate('removal',40);
  assert.ok(data.at(-1).mouse>120);
  assert.ok(data.at(-1).hawk<90);
  assert.ok(data.every(p=>p.mouse>=0 && p.hawk>=0 && Number.isFinite(p.mouse+p.hawk)));
  assert.deepEqual(M.sample(data,20),M.sample(data,20));
  assert.equal(M.sample(data,-3).t,0);
  assert.equal(M.sample(data,900).t,64);
});
test('无干扰时平衡保持；负反馈阶段与时间边界一致',()=>{
  assert.equal(typeof M.simulate,'function');
  assert.ok(M.simulate('baseline',40).every(p=>Math.abs(p.mouse-100)<1e-8 && Math.abs(p.hawk-100)<1e-8));
  assert.equal(M.phaseAt(0),0);
  assert.equal(M.phaseAt(8),1);
  assert.equal(M.phaseAt(15),2);
  assert.equal(M.phaseAt(30),3);
  assert.equal(M.phaseAt(64),4);
});
test('一次扰动发生在时间8，不被进度插值提前；幅度边界均有效',()=>{
  for(const strength of [20,40,80]){
    const data=M.simulate('pulse',strength);
    assert.equal(M.sample(data,7.99).mouse,100);
    assert.equal(M.sample(data,8).mouse,100+strength);
    assert.ok(data.every(p=>Number.isFinite(p.mouse+p.hawk)&&p.mouse>0&&p.hawk>0));
  }
});
