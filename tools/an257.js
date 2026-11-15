const fs=require('fs');const sum=(a,f)=>a.reduce((x,y)=>x+f(y),0),avg=(a,f)=>sum(a,f)/a.length;
function agg(file){const r=JSON.parse(fs.readFileSync(file)).res,n=r.length;const tot=sum(r,x=>x.n);
 const mix={};for(const k of ['plyr','dump','pick','mix'])mix[k]=+(100*sum(r,x=>x.mix[k]||0)/tot).toFixed(1);
 return {seasons:n,tradesPerSeason:+(tot/n).toFixed(1),min:Math.min(...r.map(x=>x.n)),max:Math.max(...r.map(x=>x.n)),mixPct:mix,
  dealsWithPicksPct:+(100*sum(r,x=>x.withPicks)/tot).toFixed(1),picksPerPickDeal:+(sum(r,x=>x.picksPerDeal*x.withPicks)/sum(r,x=>x.withPicks)).toFixed(2),
  cashDealsPerSeason:+(sum(r,x=>x.cashDeals)/n).toFixed(2),cashDealsPct:+(100*sum(r,x=>x.cashDeals)/tot).toFixed(1),cashPerSeasonM:+(sum(r,x=>x.cashTotal)/n).toFixed(2),
  protPerSeason:+(sum(r,x=>x.prot)/n).toFixed(2),firstsPerSeason:+(sum(r,x=>x.r1)/n).toFixed(1),secondsPerSeason:+(sum(r,x=>x.r2)/n).toFixed(1),top5PerSeason:+(sum(r,x=>x.top5)/n).toFixed(2),
  draftDayDealsPerSeason:+(sum(r,x=>x.draftDeals)/n).toFixed(2),picks28to33PerSeason:+(sum(r,x=>x.d2833)/n).toFixed(2),
  dumpPtsPerDump:+(sum(r.filter(x=>x.dumpPts),x=>x.dumpPts)/Math.max(1,r.filter(x=>x.dumpPts).length)).toFixed(0),maxTeamCashM:Math.max(...r.map(x=>x.maxCash)),secsPerSeason:+avg(r,x=>x.secs).toFixed(1)};}
console.log(JSON.stringify({base:agg('h_base.json'),new:agg('h_new.json')},null,1));
