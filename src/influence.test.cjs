const {test}=require('node:test');const assert=require('node:assert/strict');
const M=require('./model.js');let I;try{I=require('./influence.js');}catch{I={};}
const path=(routes,ids)=>routes.find(r=>r.nodes.join(',')===ids.join(','));
test('取食关系转换为两种不同的直接影响，而不反转食物流向',()=>{
 assert.equal(typeof I.effect,'function');
 assert.equal(I.effect('mouse','hawk').sign,1);
 assert.equal(I.effect('hawk','mouse').sign,-1);
 assert.equal(I.effect('mouse','rabbit'),null);
 assert.ok(M.edges.some(e=>e[0]==='mouse'&&e[1]==='hawk'));
});
test('竞争通过共享资源传递，隔级作用沿中间生物传播',()=>{
 assert.equal(typeof I.paths,'function');
 assert.equal(path(I.paths('mouse','rabbit'),['mouse','grass','rabbit']).sign,-1);
 assert.equal(path(I.paths('frog','grass'),['frog','hopper','grass']).sign,1);
 assert.ok(I.relationship('mouse','rabbit').sharedFood.includes('grass'));
 assert.equal(I.relationship('frog','grass').sameChain,true);
});
test('非同一食物链的生物通过共同天敌联系，并非没有关系',()=>{
 assert.equal(typeof I.relationship,'function');
 assert.equal(I.relationship('rabbit','frog').sameChain,false);
 assert.ok(I.relationship('rabbit','frog').sharedPredators.includes('hawk'));
 assert.equal(path(I.paths('rabbit','frog'),['rabbit','hawk','frog']).sign,-1);
});
test('鹰既捕食蛇又与蛇竞争；相反路径必须保留，不能按路径数量投票',()=>{
 assert.equal(typeof I.summary,'function');
 assert.ok(I.relationship('hawk','snake').direct);
 assert.deepEqual(I.relationship('hawk','snake').sharedFood.sort(),['frog','mouse']);
 const routes=I.paths('hawk','mouse');
 assert.equal(path(routes,['hawk','mouse']).sign,-1);
 assert.equal(path(routes,['hawk','snake','mouse']).sign,1);
 assert.equal(I.summary(routes).net,'undetermined');
 assert.equal(I.summary([routes.find(r=>r.sign===1),...Array(10).fill(routes.find(r=>r.sign===-1))]).net,'undetermined');
});
test('只有闭合且符号乘积为负的回路才标记负反馈，其他闭环也须区分',()=>{
 assert.equal(typeof I.loops,'function');
 const loops=I.loops('mouse','hawk');
 assert.equal(path(loops,['mouse','hawk','mouse']).sign,-1);
 assert.equal(path(loops,['mouse','hawk','snake','mouse']).sign,1);
 assert.ok(loops.every(r=>r.nodes[0]==='mouse'&&r.nodes.at(-1)==='mouse'&&r.nodes.includes('hawk')));
 assert.equal(I.trace(['mouse','hawk','mouse'],1).kind,'negative');
 assert.equal(I.trace(['mouse','hawk'],1).kind,'open');
});
test('初始增减会反转所有响应方向，不改变闭环性质',()=>{
 assert.equal(typeof I.trace,'function');
 const up=I.trace(['frog','hopper','grass'],1),down=I.trace(['frog','hopper','grass'],-1);
 assert.deepEqual(up.changes,[1,-1,1]);assert.deepEqual(down.changes,[-1,1,-1]);
 assert.equal(I.trace(['mouse','hawk','mouse'],-1).kind,'negative');
 assert.equal(I.trace(['mouse','hawk','mouse'],-1).changes.at(-1),1);
});
test('全部42组有序种群组合可分析；路径不重复节点，闭环只重复起点',()=>{
 assert.equal(typeof I.paths,'function');
 for(const a of M.species)for(const b of M.species){if(a.id===b.id)continue;
 const paths=I.paths(a.id,b.id),loops=I.loops(a.id,b.id);assert.ok(paths.length);assert.ok(loops.length);
 for(const p of paths){assert.equal(new Set(p.nodes).size,p.nodes.length);assert.equal(p.nodes[0],a.id);assert.equal(p.nodes.at(-1),b.id);}
 for(const p of loops)assert.equal(new Set(p.nodes.slice(0,-1)).size,p.nodes.length-1);
 }
 assert.deepEqual(I.paths('mouse','mouse'),[]);assert.deepEqual(I.paths('unknown','frog'),[]);
 assert.throws(()=>I.trace(['mouse','rabbit'],1));
});
