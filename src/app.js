(function(){
'use strict';
const M=window.FoodWebModel,I=window.FoodWebInfluence,$=id=>document.getElementById(id),all=s=>[...document.querySelectorAll(s)];
const name=id=>M.species.find(s=>s.id===id).name,CN=['','一','二','三','四','五'],chains=M.chains();
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={mode:'feedback',chain:null,selected:null,playing:false,source:'mouse',target:'hawk',change:1,view:'paths',advanced:false,allRoutes:[],route:0,step:0,routes:[],elapsed:0,preset:'predation'};
let last=0,dialogResume=false;
function chainMarkup(c){return c.map(name).join('<i>→</i>');}
function setSelection(title,text){$('selection-line').innerHTML=`<b>${title}</b><span>${text}</span>`;}
const cards={
 arrows:{title:'食物链与箭头：从“吃”读到“流动”',body:`<h3>箭头从食物，指向取食者</h3><p class="callout"><strong>草 → 鼠 → 鹰</strong><br>鼠取食草，鹰捕食鼠；能量沿箭头方向从前一环节传向后一环节。</p><h3>食物链与食物网</h3><p>在本模型的捕食食物链中，从生产者开始，沿箭头到达本图最高捕食者，才是一条完整路径。几条食物链通过共同生物交错，构成食物网。</p><p>这里的示例网共有 <strong>5 条完整食物链</strong>。实际生态系统的食物来源与捕食关系通常更复杂。</p><h3>为什么没有画阳光和分解者？</h3><p>这张图聚焦生产者与消费者之间的捕食关系。阳光是能量来源，不是营养级。分解者能利用多个营养级产生的遗体残骸等有机物，不能简单接在鹰后面当作“最后一个营养级”。</p><p class="source">知识核对：<a href="https://www.noaa.gov/education/resource-collections/marine-life/aquatic-food-webs" target="_blank" rel="noopener">NOAA · 食物网与箭头方向</a>。此处用草原生物构建简化教学示例。</p>`},
 levels:{title:'营养级，取决于它在这条链中的位置',body:`<table><thead><tr><th>本链的位置</th><th>营养级</th><th>成分 / 消费者级别</th></tr></thead><tbody><tr><td>草</td><td>第一</td><td>生产者</td></tr><tr><td>食草昆虫</td><td>第二</td><td>初级消费者</td></tr><tr><td>蛙</td><td>第三</td><td>次级消费者</td></tr><tr><td>蛇</td><td>第四</td><td>三级消费者</td></tr><tr><td>鹰</td><td>第五</td><td>四级消费者</td></tr></tbody></table><h3>换一条食物链，再判断一次</h3><p>在“草 → 鼠 → 鹰”中，鹰是<strong>第三营养级、次级消费者</strong>；在“草 → 鼠 → 蛇 → 鹰”中，鹰是<strong>第四营养级、三级消费者</strong>。</p><p class="callout">同一种生物可以占据多个营养级；同一营养级也可以包含多种生物。消费者级别比营养级的序数少 1。</p><h3>捕食与竞争可以同时存在</h3><p>本图中鹰捕食蛇；鹰和蛇又都捕食鼠、蛙。因此，鹰与蛇之间既有捕食关系，也存在食物资源上的种间竞争。</p><p class="source">参考：<a href="https://openstax.org/books/biology-2e/pages/46-1-ecology-of-ecosystems" target="_blank" rel="noopener">OpenStax Biology 2e · 食物网与营养级</a>。</p>`},

};
function updateChains(){
 $('chain-list').innerHTML=chains.map((c,i)=>`<button data-chain="${i}" aria-pressed="${state.chain===i}"><span class="chain-index">${i+1}</span><span class="chain-path">${chainMarkup(c)}</span></button>`).join('');
 $('chain-title').textContent=state.mode==='levels'?'换一条链，比较位置':'追踪一条食物链';
 $('chain-note').textContent=state.mode==='levels'?'留意鹰的位置：换了食物链，营养级也可能改变。':'从生产者出发，顺着箭头，直到本图最高捕食者。';
}
function renderGraph(){
 const levels=state.mode==='levels';$('world').classList.toggle('level-world',levels);
 const chain=state.chain===null?null:chains[state.chain];
 const nodes=levels?chain.map((id,i)=>({...M.species.find(s=>s.id===id),x:chain.length===3?20+i*30:chain.length===4?14+i*24:10+i*20,y:44})):M.species;
 const selectedEdges=state.selected&&!levels?M.edges.filter(e=>e.includes(state.selected)):chain?chain.slice(1).map((id,i)=>[chain[i],id]):null;
 const relevant=new Set(state.selected&&!levels?[state.selected,...selectedEdges.flat()]:chain||[]);
 const edges=levels?chain.slice(1).map((id,i)=>[chain[i],id]):M.edges;
 $('organisms').innerHTML=nodes.map(s=>`<button class="organism ${relevant.size&&!relevant.has(s.id)?'dim':''} ${relevant.has(s.id)?'active':''}" data-species="${s.id}" style="left:${s.x}%;top:${s.y}%;--col:${s.cell%4};--row:${Math.floor(s.cell/4)}" aria-label="查看${s.name}的${levels?'营养级':'捕食关系'}" aria-pressed="${state.selected===s.id}"><div class="art node-art" aria-hidden="true"></div><span class="name">${s.name}</span></button>`).join('');
 let paths='';
 edges.forEach(([a,b],i)=>{
  const from=nodes.find(s=>s.id===a),to=nodes.find(s=>s.id===b),sx=from.x*10,sy=from.y*5.9,tx=to.x*10,ty=to.y*5.9;
  const dx=tx-sx,dy=ty-sy,len=Math.hypot(dx,dy),nx=dx/len,ny=dy/len;
  let x1=sx+nx*70,y1=sy+ny*67,x2=tx-nx*82,y2=ty-ny*76;
  let d=`M${x1} ${y1} L${x2} ${y2}`;
  if(!levels&&a==='mouse'&&b==='hawk')d=`M${sx+49} ${sy-42} Q585 87 ${tx-90} ${ty+10}`;
  if(!levels&&a==='frog'&&b==='snake')d=`M${sx+45} ${sy-53} Q800 402 ${tx+63} ${ty+53}`;
  if(!levels&&a==='frog'&&b==='hawk')d=`M${sx+74} ${sy+7} C945 503 1000 295 ${tx+30} ${ty+90}`;
  const active=selectedEdges&&selectedEdges.some(e=>e[0]===a&&e[1]===b),dim=selectedEdges&&!active;
  paths+=`<path class="edge-under" d="${d}" style="opacity:${dim?.1:.75}"/><path class="edge ${active?'active':''} ${dim?'dim':''}" d="${d}" marker-end="url(#arrow)"/><circle r="4" class="particle ${dim?'dim':''}" style="offset-path:path('${d}');animation-delay:${-i*.7}s"/>`;
 });
 $('edge-layer').innerHTML=paths;
 $('connections').setAttribute('preserveAspectRatio','none');
 $('level-tags').innerHTML=levels?nodes.map((n,i)=>`<div class="level-tag" style="left:${n.x}%"><strong>第${CN[i+1]}营养级</strong><span>${M.consumerName(i+1)}</span></div>`).join(''):'';
 $('world-note').textContent=levels?'沿当前食物链，从生产者开始依次计数':chain?'金色箭头：当前选中的完整食物链':'点击生物，点亮与它相连的捕食关系';
 $('scene-key').innerHTML='<span class="arrow-sample">⟶</span> 食物 → 取食者';
 if(levels){
  const id=state.selected&&chain.includes(state.selected)?state.selected:'hawk',idx=chain.indexOf(id)+1;
  $('detail-title').textContent=`${name(id)}在这条链中`;
  $('detail-content').innerHTML=`<div class="level-badges"><b>第${CN[idx]}营养级</b><b>${M.consumerName(idx)}</b></div><p>在本图所有食物链中，${name(id)}可处于<strong>第${M.levels(id).map(l=>CN[l]).join('、第')}营养级</strong>。</p><p>营养级取决于<strong>所分析的食物链</strong>，并非给某种生物固定贴一个编号。</p>`;
  setSelection(`这条链有 ${chain.length} 个营养级`,`${name(id)}：第${CN[idx]}营养级 · ${M.consumerName(idx)}`);
 } else if(state.selected){
  const id=state.selected,foods=M.edges.filter(e=>e[1]===id).map(e=>name(e[0])),predators=M.edges.filter(e=>e[0]===id).map(e=>name(e[1]));
  $('detail-title').textContent=`${name(id)}的取食联系`;
  $('detail-content').innerHTML=`<div class="relation-row"><span>${id==='grass'?'获得能量':'它的食物'}</span><b>${id==='grass'?'通过光合作用固定太阳能':foods.join('、')||'本图未列出'}</b></div><div class="relation-row"><span>它被谁吃</span><b>${predators.join('、')||'本图未列出更高捕食者'}</b></div><p>箭头指向它：它取食前一环节。箭头从它出发：它被下一环节取食。</p>${['hawk','snake'].includes(id)?'<p><strong>继续想：</strong>鹰与蛇既有捕食关系，也竞争鼠、蛙等食物。</p>':''}`;
  setSelection(`已选：${name(id)}`,`点亮 ${selectedEdges.length} 条与它直接相连的取食关系。`);
 } else if(chain){
  $('detail-title').textContent=`第 ${state.chain+1} 条食物链`;
  $('detail-content').innerHTML=`<p><strong>${chain.map(name).join(' → ')}</strong></p><p>从草出发，经过 ${chain.length-1} 次取食联系，到达鹰。</p><div class="level-badges"><b>${chain.length} 个营养级</b><b>鹰：${M.consumerName(chain.length)}</b></div>`;
  setSelection('正在追踪',chain.map(name).join(' → '));
 } else{
  $('detail-title').textContent='一张网，彼此相连';
  $('detail-content').innerHTML='<p>几条食物链通过共同的生物相互交错，形成食物网。</p><p>点击<strong>鹰</strong>，看看它有几种食物来源。</p><div class="level-badges"><b>7 种生物</b><b>10 条取食关系</b></div>';
  setSelection('先看箭头方向','草被兔吃，箭头就从草指向兔。');
 }
}
const presets={
 predation:{source:'mouse',target:'hawk',path:['mouse','hawk']},
 competition:{source:'mouse',target:'rabbit',path:['mouse','grass','rabbit']},
 cascade:{source:'frog',target:'grass',path:['frog','hopper','grass']},
 cross:{source:'rabbit',target:'frog',path:['rabbit','hawk','frog']},
 multiple:{source:'hawk',target:'mouse',path:['hawk','mouse']}
};
cards.stability={title:'先看影响，再闭合回路判断负反馈',body:`<h3>两种生物的关系，不等于反馈回路</h3><p>鼠增多使鹰得到更多食物，是从鼠到鹰的影响。还要继续看：鹰的增长又增强对鼠的捕食，<strong>作用回到鼠，抑制鼠最初的增长</strong>，这才构成负反馈。</p><p class="callout">鼠增多 → 鹰增长受促进 → 鼠增长受抑制。<br>负反馈抑制最初的变化；并不保证立刻回到原数量。</p><h3>竞争、隔级和跨链，怎样分析？</h3><p><strong>共享资源：</strong>鼠增多 → 草受取食压力增强 → 兔的食物减少，是经过草传递的竞争作用。<br><strong>间隔营养级：</strong>蛙增多 → 食草昆虫受捕食压力增强 → 草受取食压力减弱，是沿链的间接影响。<br><strong>非同一食物链：</strong>兔与蛙可经共同捕食者鹰相互联系，即使没有一条捕食食物链同时包含兔与蛙。</p><h3>同一对生物，可以有相反路径</h3><p>鹰直接捕食鼠，对鼠有抑制作用；鹰抑制蛇，又可能减轻蛇对鼠的捕食。这两条路径方向相反，不能只看其中一条，或用路径数量“多数表决”。</p><h3>怎样辨认回路性质？</h3><p>本页“闭合反馈”默认只看起始种群与一个直接相邻种群的往返：食物制约或天敌制约。展开更多后，才分析经过所选观察种群的较长回路；这些回路除起点外不重复节点。闭合后反向作用于初始变化，标为负反馈；同向强化初始变化，标为正反馈。<strong>竞争和跨链作用不自动等于负反馈。</strong></p><p>真实生态系统中，多条回路同时作用。整体能否稳定，还取决于作用强度、密度制约、时滞和外界条件，不能仅凭某一负反馈回路作保证。</p>`};
cards.model={title:'分析方法与适用边界',body:`<h3>从食物网建立影响方向</h3><p>灰色箭头始终表示<strong>食物 → 取食者</strong>。彩色箭头表示当前追踪的种群影响：食物对取食者有正向支持（＋），取食者对食物种群有负向作用（−）。影响方向与能量流动方向不同；反向影响不意味着能量逆向流动。</p><h3>符号怎样理解？</h3><p>＋ 表示前者增多时，对后者增长有促进趋势；− 表示前者增多时，对后者增长有抑制趋势。若前者减少，沿该作用的响应方向反转。沿一条路径依次推演，假设其他作用暂不改变。动画步骤是逻辑顺序，不是实测响应时间。</p><p>生物旁的 ↑ / ↓ 表示<strong>该路径带来的变化趋势</strong>，不是整网最终数量。回到起点的“反馈”标记表示对最初变化的反馈作用，不表示已经越过初始基准。</p><h3>怎样处理多路径？</h3><p>路径枚举覆盖 7 种生物的全部 42 组不同种群的有序组合。开放路径不重复节点；闭合回路只在末尾重复起点。默认保留最短影响路径，并补充一条最短的相反方向路径；直接负反馈只经过一个相邻种群。点击“展开更多”再查看完整路径或经由所选种群的回路。最短仅表示最容易讲清楚，不代表真实作用最强。正向和反向影响并存时，整网净变化标为待定，不按路线条数估计强弱。</p><p>只考虑本图所列取食联系。共享资源的竞争、共同天敌的间接作用通过中间生物展开；未另加竞争边，避免重复计算。未建模的行为、食性转换、资源补给与时滞可能改变真实结果。</p><p class="source">知识核对：<a href="https://www.nature.com/articles/ncomms12644" target="_blank" rel="noopener">Frost 等，2016：跨食物网的共同天敌作用与多路径预测</a>；<a href="https://www.biointeractive.org/sites/default/files/Trophic-Cascade-card-activity.pdf" target="_blank" rel="noopener">HHMI BioInteractive：营养级联课堂活动</a>。</p><h3>推论：一定条件下，中间环节的变化可能被缓冲</h3><p class="callout">当捕食者有充足的替代食物，其他取食者也能补偿变化时，某个中间种群的数量波动，对底层生产者和顶端捕食者的影响<strong>可能较小</strong>。</p><p><strong>适用条件：</strong>替代食物不仅要存在，还要能被利用并足以补充；其他种群的补偿也要有效。变化幅度与持续时间同样会影响结果。</p><p><strong>局限性：</strong>这不是普遍规律。在“草 → 鼠 → 蛇”中，鼠的变化既会改变草受到的取食压力，也会改变蛇的食物供应；取食依赖较强时，两端可能受到明显影响。间隔多个营养级，也可能通过<strong>营养级联</strong>产生显著间接作用。</p><p>因此，不能仅凭“处于中间环节”或路径长短判断影响大小。本页分析的是沿路径的影响方向；最终影响幅度还需要作用强度、替代食物与响应时间等信息。</p><p class="source">延伸阅读：<a href="https://www.biointeractive.org/classroom-resources/exploring-trophic-cascades" target="_blank" rel="noopener">HHMI BioInteractive · 营养级联</a>；<a href="https://www.nature.com/articles/s41467-019-12289-0" target="_blank" rel="noopener">Nature Communications（2019）· 级联效应可减弱，也可增强</a>。</p>`};
function currentTrace(){return I.trace(state.routes[state.route].nodes,state.change);}
const trend=v=>v>0?'↑':'↓',verb=v=>v>0?'增多':'减少';
function updatePlay(){
 const feedback=state.mode==='feedback';
 $('play').textContent=feedback?(state.playing?'暂停推演':state.step>=currentTrace().effects.length?'重播路径':'自动推演'):(state.playing?'暂停动效':'播放动效');
 $('board').classList.toggle('paused',!state.playing);
 if(feedback){const total=currentTrace().effects.length;$('back-step').disabled=state.step===0;$('next-step').disabled=state.step===total;$('step-count').textContent=`${state.step} / ${total} 步`;}
}
function syncPair(){
 $('source').value=state.source;$('target').value=state.target;$('change').value=String(state.change);
 [...$('target').options].forEach(o=>o.disabled=o.value===state.source);
 all('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.preset===state.preset));
 const direct=state.view==='loops'&&!state.advanced;
 $('target').disabled=direct;$('swap').disabled=direct;$('target').closest('label').hidden=direct;$('swap').hidden=direct;all('.pair-arrow').forEach(e=>e.hidden=direct);
 $('target-caption').textContent=state.view==='loops'?'经由':'观察';
 $('pair-hint').textContent=direct?'直接反馈只需选择起始种群':'任意两种生物都可选';
 if(direct){
  $('pair-description').innerHTML=`<strong>${name(state.source)} ${trend(state.change)} <span>怎样受到制约？</span></strong><div><span>仅经一个相邻种群，回到起点</span></div>`;
  $('scene-title').textContent=`${name(state.source)}的最直接负反馈`;return;
 }
 const relation=I.relationship(state.source,state.target),labels=[];
 if(relation.direct)labels.push('直接取食联系');
 if(relation.sharedFood.length)labels.push(`竞争：共享${relation.sharedFood.map(name).join('、')}`);
 if(relation.sharedPredators.length)labels.push(`共同天敌：${relation.sharedPredators.map(name).join('、')}`);
 if(!relation.sameChain)labels.push('不在同一条食物链');else if(!relation.direct)labels.push('同链间隔营养级');
 $('pair-description').innerHTML=`<strong>${name(state.source)} ${trend(state.change)} <span>观察</span> ${name(state.target)}</strong><div>${labels.map(t=>`<span>${t}</span>`).join('')}</div>`;
 $('scene-title').textContent=state.view==='paths'?`${name(state.source)}的变化，怎样影响${name(state.target)}？`:`经过${name(state.target)}，作用怎样回到${name(state.source)}？`;
}
function refreshRoutes(preferred){
 state.allRoutes=state.view==='loops'?I.loops(state.source,state.target):I.paths(state.source,state.target);
 state.routes=state.advanced?state.allRoutes:state.view==='loops'?I.directLoops(state.source):I.teachingPaths(state.source,state.target);
 $('more-routes').textContent=state.advanced?'收起更多':'展开更多';
 $('more-routes').setAttribute('aria-expanded',String(state.advanced));
 $('scope-note').textContent=state.advanced?(state.view==='loops'?'拓展：经过所选种群的回路':'拓展：全部简单路径'):(state.view==='loops'?'默认：食物或天敌的直接制约':'默认：最短路径；补充最短反向路径');
 state.route=Math.max(0,preferred?state.routes.findIndex(r=>r.nodes.join()===preferred.join()):0);
 state.step=0;state.playing=false;state.elapsed=0;
 $('route-select').innerHTML=state.routes.map((r,i)=>`<option value="${i}">${i+1}. ${r.nodes.map(name).join(' → ')}${state.view==='loops'?(r.sign<0?' · 负反馈':' · 正反馈'):''}</option>`).join('');
 $('route-label').textContent=state.view==='loops'?(state.advanced?'选择拓展回路':'选择直接制约'):'选择影响路径';
 $('route-select').setAttribute('aria-label',state.view==='loops'?'选择闭合回路':'选择影响路径');
 all('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===state.view));
 syncPair();renderInfluence();
}
function routeGeometry(from,to,bend=0){
 const a=M.species.find(s=>s.id===from),b=M.species.find(s=>s.id===to),sx=a.x*10,sy=a.y*5.9,tx=b.x*10,ty=b.y*5.9;
 const dx=tx-sx,dy=ty-sy,length=Math.hypot(dx,dy),nx=dx/length,ny=dy/length;
 const x1=sx+nx*73,y1=sy+ny*69,x2=tx-nx*83,y2=ty-ny*76;
 let cx=(x1+x2)/2-ny*bend,cy=(y1+y2)/2+nx*bend;
 if([from,to].includes('mouse')&&[from,to].includes('hawk')){cx=585;cy=100+(from==='hawk'?92:0);}
 if([from,to].includes('frog')&&[from,to].includes('hawk')){cx=1050;cy=455+(from==='hawk'?-30:30);}
 if([from,to].includes('frog')&&[from,to].includes('snake')){cx=805+(from==='snake'?-65:0);cy=395;}
 return {d:`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`,x:.25*x1+.5*cx+.25*x2,y:.25*y1+.5*cy+.25*y2};
}
function renderInfluenceGraph(trace){
 $('world').classList.remove('level-world');
 const reached=trace.nodes.slice(0,state.step+1),active=new Set(trace.nodes);
 $('organisms').innerHTML=M.species.map(s=>{
  let index=reached.lastIndexOf(s.id),value=index>=0?trace.changes[index]:null;
  let label=value===null?'':`${trend(value)}`;
  if(s.id===state.source)label=index===trace.nodes.length-1&&trace.kind!=='open'?`反馈${trend(value)}`:`初${trend(state.change)}`;
  
  return `<button class="organism ${active.has(s.id)?'route-member':'dim'} ${s.id===state.source?'source-node':''} ${s.id===(state.view==='loops'&&!state.advanced?trace.nodes[1]:state.target)?'target-node':''} ${index===state.step?'current-node':''}" data-species="${s.id}" style="left:${s.x}%;top:${s.y}%;--col:${s.cell%4};--row:${Math.floor(s.cell/4)}" aria-label="${state.view==='loops'&&!state.advanced?`查看经${s.name}的直接反馈`:`将${s.name}设为观察种群`}" ${s.id===state.source||(state.view==='loops'&&!state.advanced&&!I.effect(state.source,s.id))?'disabled':''}><div class="art" aria-hidden="true"></div><span class="name">${s.name}<span class="change-badge ${value>0?'rising':value<0?'falling':''}" ${label?'':'hidden'}>${label}</span></span></button>`;
 }).join('');
 $('edge-layer').innerHTML=M.edges.map(([a,b])=>`<path d="${routeGeometry(a,b).d}" class="food-edge" marker-end="url(#arrow)"/>`).join('');
 $('influence-layer').innerHTML=trace.effects.slice(0,state.step).map((e,i)=>{
  const g=routeGeometry(e.from,e.to,34),color=e.sign>0?'#38776d':'#a45d34',active=i===state.step-1;
  return `<path d="${g.d}" class="effect-edge ${active?'current-edge':''}" stroke="${color}" marker-end="url(#arrow)"/><g class="effect-symbol"><circle cx="${g.x}" cy="${g.y}" r="13" fill="#fffbed" stroke="${color}" stroke-width="1.5"/><text x="${g.x}" y="${g.y+5}" text-anchor="middle" fill="${color}">${e.sign>0?'＋':'−'}</text></g>`;
 }).join('');
 $('level-tags').innerHTML='';
 $('world-note').textContent='灰箭头：食物 → 取食者；彩箭头：本路径的影响方向';
 $('scene-key').innerHTML='<span class="key-positive">＋ 同向</span><span class="key-negative">− 反向</span><span>↑ ↓ 本路径趋势</span>';
}
function explainStep(trace){
 $('reason-step').textContent=state.step===0?'起点 · 先设定变化':`第 ${state.step} 步 · 沿这一个作用看`;
 if(!state.step){$('reason-title').textContent=`${name(state.source)}先${verb(state.change)}`;$('reason-text').textContent=`按“下一步”，先看这一变化传给谁。每一步只解释当前路径，其他途径暂时不合并。`;return;}
 const e=trace.effects[state.step-1],a=trace.changes[state.step-1],b=trace.changes[state.step],closing=state.step===trace.effects.length&&trace.kind!=='open';
 if(closing)$('reason-step').textContent=`第 ${state.step} 步 · 反馈回到起点`;
 $('reason-title').textContent=`${name(e.from)} ${trend(a)} → ${name(e.to)} ${trend(b)}`;
 const reason=e.mechanism==='food'?`${name(e.from)}是${name(e.to)}的食物。${name(e.from)}${verb(a)}，食物支持${a>0?'增强':'减弱'}，使${name(e.to)}的增长${b>0?'受促进':'受限制'}。`:`${name(e.from)}取食${name(e.to)}。${name(e.from)}${verb(a)}，取食压力${a>0?'增强':'减弱'}，使${name(e.to)}的增长${b>0?'得到释放':'受抑制'}。`;
 $('reason-text').textContent=reason;
}
function renderAssessment(trace){
 const finished=state.step===trace.effects.length;
 if(state.view==='loops'){
  $('result-title').textContent=finished?(trace.sign<0?'回到起点：负反馈':'回到起点：正反馈'):'还没走完：继续追踪到起点';
  $('result-text').textContent=finished?(trace.sign<0?`回传作用与${name(state.source)}最初${verb(state.change)}的方向相反，抑制最初的变化。回调不等于一定恢复原数量。`:`回传作用与${name(state.source)}最初${verb(state.change)}的方向相同，强化最初的变化。这条回路不是负反馈。`):'看到另一种生物变化，还不构成反馈；必须看作用如何传回最初的种群。';
  $('compare-title').textContent=state.advanced?'比较两类回路':'比较直接制约';
  $('analysis-note').textContent=state.advanced?'拓展回路不代表主要调节机制；不能按条数判断强弱。':'最短是讲解顺序，不表示真实作用最强。';
 }else{
  const summary=I.summary(state.allRoutes);
  $('result-title').textContent=finished?`仅沿此路：${name(state.target)}呈${verb(trace.changes.at(-1))}趋势`:'逐段推演，不提前合并结果';
  $('result-text').textContent=summary.net==='undetermined'?'整网净变化待定：存在方向相反的路径。不能按路径条数投票，需要作用强度和响应时间等条件。':'所列路径的方向一致，但这仍是条件性判断，不是最终数量或恢复时间的预测。';
  $('compare-title').textContent='换一路，再比较';
  $('analysis-note').textContent='要判断负反馈，切换到“② 闭合反馈”。';
 }
 const direct=state.view==='loops'&&!state.advanced;
 const candidates=direct?['consumption','food'].map(kind=>({kind,index:state.routes.findIndex(r=>r.effects[0].mechanism===kind)})).filter(c=>c.index>=0):[1,-1].map(sign=>({sign,index:state.routes.findIndex(r=>r.sign===sign)})).filter(c=>c.index>=0);
 $('compare-routes').innerHTML=candidates.map(c=>{
 const r=state.routes[c.index],label=direct?(c.kind==='consumption'?'食物制约':'天敌制约'):state.view==='loops'?(c.sign<0?'负反馈回路':'正反馈回路'):`${name(state.target)} ${trend(c.sign*state.change)} 的路径`;
 return `<button data-compare="${c.index}" aria-pressed="${c.index===state.route}"><b>${label}</b><span>${r.nodes.map(name).join(' → ')}</span></button>`;
 }).join('');
}
function renderInfluence(){
 const trace=currentTrace();$('route-select').value=String(state.route);$('route-count').textContent=`${state.route+1} / ${state.routes.length} 条`;
 renderInfluenceGraph(trace);explainStep(trace);renderAssessment(trace);if(state.view==='loops'&&!state.advanced)$('scene-title').textContent=`${trace.effects[0].mechanism==='consumption'?'食物制约':'天敌制约'}：经${name(trace.nodes[1])}回到${name(state.source)}`;
 $('influence-chain').innerHTML=trace.nodes.map((id,i)=>`${i?`<span class="route-arrow ${i<=state.step?'reached':''}">${trace.effects[i-1].sign>0?'＋':'−'} →</span>`:''}<button data-step="${i}" aria-pressed="${i===state.step}" class="${i<=state.step?'reached':''}">${name(id)}<b>${i<=state.step?trend(trace.changes[i]):'·'}</b>${i===trace.nodes.length-1&&trace.kind!=='open'?'<small>回到起点</small>':''}</button>`).join('');
 setSelection('本路径推演','增减标记表示影响趋势；没有把各路影响相加为实际数量。');updatePlay();
}
function setMode(mode){
 state.mode=mode;state.selected=null;state.playing=false;state.elapsed=0;document.body.dataset.mode=mode;
 all('button[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===mode));
 const feedback=mode==='feedback';
 ['analysis-controls','analysis-panel','influence-chain','back-step','next-step','step-count'].forEach(id=>$(id).hidden=!feedback);
 ['chain-panel','detail-panel','transport-tip'].forEach(id=>$(id).hidden=feedback);
 $('influence-layer').innerHTML='';
 $('scene-tag').textContent=feedback?'整张食物网 · 逐段推演':mode==='web'?'一张草原食物网':'沿食物链逐级观察';
 $('reset').textContent=feedback?'从头看':mode==='levels'?'最长食物链':'查看全网';
 if(feedback)refreshRoutes(presets[state.preset]?.path);else{
  state.chain=mode==='levels'?4:null;state.playing=!reduced;
  $('scene-title').textContent=mode==='web'?'谁是谁的食物？':'同一种生物，营养级可以不同';
  updateChains();renderGraph();updatePlay();
 }
}
function seek(step){state.step=Math.max(0,Math.min(currentTrace().effects.length,step));state.playing=false;state.elapsed=0;renderInfluence();}
function chooseRoute(index,finished=false){state.route=Number(index);state.step=finished?currentTrace().effects.length:0;state.playing=false;state.elapsed=0;renderInfluence();}
function pairChanged(){state.preset='';if(state.target===state.source)state.target=M.species.find(s=>s.id!==state.source).id;refreshRoutes();}
$('source').innerHTML=$('target').innerHTML=M.species.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
all('button[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
all('[data-preset]').forEach(b=>b.addEventListener('click',()=>{const p=presets[b.dataset.preset];Object.assign(state,{source:p.source,target:p.target,preset:b.dataset.preset,view:'paths',advanced:false,change:1});refreshRoutes(p.path);}));
$('source').addEventListener('change',e=>{state.source=e.target.value;pairChanged();});
$('target').addEventListener('change',e=>{state.target=e.target.value;pairChanged();});
$('change').addEventListener('change',e=>{state.change=Number(e.target.value);state.step=0;state.playing=false;syncPair();renderInfluence();});
$('swap').addEventListener('click',()=>{[state.source,state.target]=[state.target,state.source];pairChanged();});
all('[data-view]').forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;state.advanced=false;refreshRoutes(state.view==='paths'?presets[state.preset]?.path:null);}));
$('more-routes').addEventListener('click',()=>{const nodes=currentTrace().nodes;state.advanced=!state.advanced;refreshRoutes(nodes);});
$('route-select').addEventListener('change',e=>chooseRoute(e.target.value));
$('compare-routes').addEventListener('click',e=>{const b=e.target.closest('[data-compare]');if(b)chooseRoute(b.dataset.compare,true);});
$('influence-chain').addEventListener('click',e=>{const b=e.target.closest('[data-step]');if(b)seek(Number(b.dataset.step));});
$('back-step').addEventListener('click',()=>seek(state.step-1));$('next-step').addEventListener('click',()=>seek(state.step+1));
$('chain-list').addEventListener('click',e=>{const b=e.target.closest('[data-chain]');if(!b)return;state.chain=Number(b.dataset.chain);state.selected=null;updateChains();renderGraph();});
$('organisms').addEventListener('click',e=>{const b=e.target.closest('[data-species]');if(!b)return;if(state.mode==='feedback'){if(b.dataset.species===state.source)return;if(state.view==='loops'&&!state.advanced){const i=state.routes.findIndex(r=>r.nodes[1]===b.dataset.species);if(i>=0)chooseRoute(i);return;}state.target=b.dataset.species;pairChanged();return;}state.selected=state.selected===b.dataset.species?null:b.dataset.species;if(state.mode==='web')state.chain=null;updateChains();renderGraph();});
$('play').addEventListener('click',()=>{if(state.mode==='feedback'&&state.step>=currentTrace().effects.length){state.step=0;renderInfluence();}state.playing=!state.playing;state.elapsed=0;updatePlay();});
$('reset').addEventListener('click',()=>{if(state.mode==='feedback')seek(0);else{state.selected=null;state.chain=state.mode==='levels'?4:null;updateChains();renderGraph();}});
all('[data-card]').forEach(b=>b.addEventListener('click',()=>{const c=cards[b.dataset.card];$('dialog-title').textContent=c.title;$('dialog-body').innerHTML=c.body;dialogResume=state.playing;state.playing=false;updatePlay();$('knowledge-dialog').showModal();}));
$('close-dialog').addEventListener('click',()=>$('knowledge-dialog').close());
$('knowledge-dialog').addEventListener('click',e=>{if(e.target!==$('knowledge-dialog'))return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();});
$('knowledge-dialog').addEventListener('close',()=>{state.playing=dialogResume;updatePlay();});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('lesson').requestFullscreen();}catch{setSelection('未开启全屏','可将浏览器窗口最大化继续演示。');}});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'退出全屏 ↙':'全屏演示 ↗';});
function tick(now){const dt=Math.min(.15,(now-last)/1000);last=now;if(state.playing&&state.mode==='feedback'&&!document.hidden){state.elapsed+=dt;if(state.elapsed>=1.8){state.elapsed=0;state.step=Math.min(state.step+1,currentTrace().effects.length);if(state.step===currentTrace().effects.length)state.playing=false;renderInfluence();}}requestAnimationFrame(tick);}
setMode('feedback');requestAnimationFrame(tick);
})();
