const fs=require('fs');const D=['hb1.json','hb2.json'].map(f=>JSON.parse(fs.readFileSync(f)));
const T=D.flatMap(d=>d.T),tw=D.flatMap(d=>d.tw),core=D.flatMap(d=>d.core),tg=D.flatMap(d=>d.tg);const seasons=20;
const withP=T.filter(t=>t.picks.length);
console.log('seasons',seasons,'trades',T.length,'with picks',withP.length);
const types={};T.forEach(t=>types[t.type]=(types[t.type]||0)+1);console.log('types',JSON.stringify(types));
// per type x pick category
for(const ty of ['pick','mix','dump','plyr']){const ts=T.filter(t=>t.type===ty&&t.picks.length);const c={top5:0,lottery:0,late1st:0,'2nd':0};ts.forEach(t=>t.picks.forEach(p=>c[p.cat]++));
 console.log(ty,'deals',ts.length,'picks',JSON.stringify(c),'prot',ts.reduce((a,t)=>a+t.picks.filter(p=>p.prot).length,0));}
// top5 detail
const top=T.filter(t=>t.picks.some(p=>p.cat==='top5'));
console.log('\nTOP-5 deals',top.length,'(per season',(top.length/seasons).toFixed(2)+')');
const byT={};top.forEach(t=>byT[t.type]=(byT[t.type]||0)+1);console.log(JSON.stringify(byT),'draft-day',top.filter(t=>t.draft).length,'known slot',top.filter(t=>t.picks.some(p=>p.cat==='top5'&&p.known)).length);
top.slice(0,14).forEach(t=>console.log(t.S,t.ph,t.type,'|',t.a,'<->',t.b,'|',t.picks.map(p=>p.cat+(p.known?'#'+p.slot:'~'+p.slot)+(p.rd===2?'(2nd)':'')+' '+p.pts+'p'+(p.prot?' prot'+p.prot:'')).join(', '),'|',t.pl.map(p=>p.n.split(' ').pop()+' '+p.ovr+'/'+p.age).join(', ')||'-','|',t.cash?'cash '+t.cash:'','|',t.why));
// samples by cat for pick & mix
for(const ty of ['pick','mix']){for(const c of ['lottery','late1st','2nd']){const ts=T.filter(t=>t.type===ty&&t.picks.some(p=>p.cat===c));console.log('\n',ty,c,'deals',ts.length);ts.slice(0,3).forEach(t=>console.log('  ',t.ph,'|',t.a,'<->',t.b,'|',t.picks.map(p=>p.cat+(p.known?'#'+p.slot:'~'+p.slot)+' '+p.pts+'p').join(', '),'|',t.pl.map(p=>p.n.split(' ').pop()+' '+p.ovr+'/'+p.age).join(', ')||'-','|',t.why.slice(0,110)));}}
// two-way
const sum=f=>tw.reduce((a,x)=>a+f(x),0);console.log('\nTWO-WAY: 2nd-rounders drafted',sum(x=>x.r2),'two-way',sum(x=>x.two),'standard',sum(x=>x.std)-sum(x=>x.two>0?0:0),'FA',sum(x=>x.fa),'per draft',(sum(x=>x.two)/tw.length).toFixed(2));
console.log('two-way profile age/scout/ovr',tw.flatMap(x=>x.twAges).slice(0,12).join(' '));
// core
const pos={};core.forEach(c=>c.core.forEach(p=>pos[p.pos]=(pos[p.pos]||0)+1));console.log('\nCORE size avg',(core.reduce((a,c)=>a+c.core.length,0)/core.length).toFixed(2),'by pos',JSON.stringify(pos));
const st={};core.forEach(c=>{st[c.st]=st[c.st]||{n:0,age:0,ovr:0,k:0};c.core.forEach(p=>{st[c.st].age+=p.age;st[c.st].ovr+=p.ovr;st[c.st].k++});st[c.st].n++;});
for(const k in st)console.log(' ',k,'teams',st[k].n,'avg core age',(st[k].age/st[k].k).toFixed(1),'avg ovr',(st[k].ovr/st[k].k).toFixed(1));
console.log(' example',JSON.stringify(core.find(c=>c.st==='rebuild')),'\n example',JSON.stringify(core.find(c=>c.st==='contend')));
// targets vs core
console.log('\nTARGETS',tg.length,'takes core/kept spot',tg.filter(x=>x.takes).length);
const same=tg.filter(x=>x.sameCore>0);console.log('targets at a core player\'s position',same.length,'(',(100*same.length/tg.length).toFixed(0),'%) ; of those flagged "backs up"',same.filter(x=>x.backs).length,'; avg gap vs core ovr',(same.reduce((a,x)=>a+(x.coreOvr-x.ovr),0)/same.length).toFixed(1));
console.log(' same-pos but NOT flagged as backup:',same.filter(x=>!x.backs).length,'  min gap',Math.min(...same.map(x=>x.coreOvr-x.ovr)));
same.filter(x=>x.backs).slice(0,5).forEach(x=>console.log('  ',x.t,x.tab,x.pos,x.ovr,'vs core',x.coreOvr,'|',x.why));
same.filter(x=>!x.backs).slice(0,5).forEach(x=>console.log('  nb',x.t,x.tab,x.pos,x.ovr,'vs core',x.coreOvr,'|',x.why));
const bypos={};tg.forEach(x=>bypos[x.pos]=(bypos[x.pos]||0)+1);console.log('target pos mix',JSON.stringify(bypos));
