(function(root){
  'use strict';
  const species=[
    {id:'grass',name:'草',cell:0,x:11,y:52},
    {id:'rabbit',name:'兔',cell:1,x:36,y:19},
    {id:'mouse',name:'鼠',cell:2,x:38,y:51},
    {id:'hopper',name:'食草昆虫',cell:3,x:34,y:83},
    {id:'frog',name:'蛙',cell:4,x:62,y:83},
    {id:'snake',name:'蛇',cell:5,x:68,y:49},
    {id:'hawk',name:'鹰',cell:6,x:88,y:19}
  ];
  const edges=[['grass','rabbit'],['grass','mouse'],['grass','hopper'],['hopper','frog'],['frog','snake'],['mouse','snake'],['rabbit','hawk'],['mouse','hawk'],['snake','hawk'],['frog','hawk']];
  function chains(){
    const found=[];
    function walk(path){const next=edges.filter(e=>e[0]===path.at(-1)).map(e=>e[1]);
      if(!next.length){found.push(path);return;} next.forEach(id=>walk([...path,id]));}
    walk(['grass']);return found.sort((a,b)=>a.length-b.length);
  }
  function levels(id){return [...new Set(chains().filter(c=>c.includes(id)).map(c=>c.indexOf(id)+1))].sort((a,b)=>a-b);}
  function consumerName(level){return ['','生产者','初级消费者','次级消费者','三级消费者','四级消费者'][level];}
  // Dimensionless, density-dependent predator–prey model. The reference equilibrium is x=y=1.
  // This is an illustrative two-species subsystem, not a forecast for the seven-node food web.
  function simulate(scenario='pulse',strength=40){
    const dt=.04,data=[];let x=1,y=1;
    const magnitude=Math.max(0,Math.min(80,Number(strength)||0))/100;
    function derivative(a,b,t){const harvest=scenario==='removal'&&t>=8?.45*magnitude:0;
      return [.5*a*(.9*(1-a/2)-.45*b),.5*b*(.32*a-.22-.1*b-harvest)];}
    for(let i=0;i<=1600;i++){
      const t=i*dt;
      if(i===200&&scenario==='pulse')x+=magnitude;
      data.push({t,mouse:x*100,hawk:y*100});
      const a=derivative(x,y,t),b=derivative(x+a[0]*dt/2,y+a[1]*dt/2,t),c=derivative(x+b[0]*dt/2,y+b[1]*dt/2,t),d=derivative(x+c[0]*dt,y+c[1]*dt,t);
      x=Math.max(0,x+dt*(a[0]+2*b[0]+2*c[0]+d[0])/6);y=Math.max(0,y+dt*(a[1]+2*b[1]+2*c[1]+d[1])/6);
    }return data;
  }
  function sample(data,t){const time=Math.max(0,Math.min(64,Number(t)||0));if(time<8)return {t:time,mouse:100,hawk:100};const i=Math.floor(time/.04);const a=data[i],b=data[Math.min(i+1,data.length-1)];const f=(time-a.t)/.04;return {t:time,mouse:a.mouse+(b.mouse-a.mouse)*f,hawk:a.hawk+(b.hawk-a.hawk)*f};}
  function phaseAt(t){return t<8?0:t<12?1:t<21?2:t<45?3:4;}
  const api={species,edges,chains,levels,consumerName,simulate,sample,phaseAt};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.FoodWebModel=api;
})(typeof window==='undefined'?globalThis:window);
