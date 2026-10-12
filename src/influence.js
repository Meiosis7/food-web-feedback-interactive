(function(root){
 'use strict';
 const M=typeof module!=='undefined'&&module.exports?require('./model.js'):root.FoodWebModel;
 const known=id=>M.species.some(s=>s.id===id);
 function effect(from,to){
  if(M.edges.some(e=>e[0]===from&&e[1]===to))return {from,to,sign:1,mechanism:'food'};
  if(M.edges.some(e=>e[1]===from&&e[0]===to))return {from,to,sign:-1,mechanism:'consumption'};
  return null;
 }
 function trace(nodes,initial=1){
  if(!Array.isArray(nodes)||nodes.length<2||!nodes.every(known)||![1,-1].includes(initial))throw new Error('Invalid influence path');
  const effects=nodes.slice(1).map((id,i)=>{const e=effect(nodes[i],id);if(!e)throw new Error('No direct effect');return e;});
  const changes=[initial];effects.forEach(e=>changes.push(changes.at(-1)*e.sign));
  const sign=effects.reduce((p,e)=>p*e.sign,1),closed=nodes[0]===nodes.at(-1);
  return {nodes:[...nodes],effects,changes,sign,kind:closed?(sign<0?'negative':'positive'):'open'};
 }
 function paths(source,target){
  if(!known(source)||!known(target)||source===target)return [];
  const out=[];
  function visit(nodes){if(nodes.at(-1)===target){out.push(trace(nodes));return;}
   for(const s of M.species){if(!nodes.includes(s.id)&&effect(nodes.at(-1),s.id))visit([...nodes,s.id]);}}
  visit([source]);return out.sort((a,b)=>a.nodes.length-b.nodes.length||a.nodes.join().localeCompare(b.nodes.join()));
 }
 function loops(source,via){
  if(!known(source)||!known(via)||source===via)return [];
  const out=[];
  function visit(nodes){const last=nodes.at(-1);
   if(nodes.length>1&&nodes.includes(via)&&effect(last,source))out.push(trace([...nodes,source]));
   if(nodes.length===M.species.length)return;
   for(const s of M.species)if(!nodes.includes(s.id)&&effect(last,s.id))visit([...nodes,s.id]);
  }
  visit([source]);return out.sort((a,b)=>a.sign-b.sign||a.nodes.length-b.nodes.length||a.nodes.join().localeCompare(b.nodes.join()));
 }
 function relationship(a,b){
  const food=id=>M.edges.filter(e=>e[1]===id).map(e=>e[0]),predators=id=>M.edges.filter(e=>e[0]===id).map(e=>e[1]);
  return {direct:effect(a,b),sharedFood:food(a).filter(id=>food(b).includes(id)),sharedPredators:predators(a).filter(id=>predators(b).includes(id)),sameChain:M.chains().some(c=>c.includes(a)&&c.includes(b))};
 }
 function summary(routes){const positive=routes.filter(r=>r.sign>0).length,negative=routes.filter(r=>r.sign<0).length;
  return {positive,negative,net:positive&&negative?'undetermined':positive?'positive-paths':negative?'negative-paths':'none'};
 }
 const api={effect,trace,paths,loops,relationship,summary};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FoodWebInfluence=api;
})(typeof window==='undefined'?globalThis:window);
