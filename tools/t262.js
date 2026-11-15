// v26.2 checks: SRC=src SEED=n node tools/t262.js [seasons]  (6-year picks, Stepien rule, pick swaps)
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||4);
run(`function SEASON(L,next){let g=0;while(L.phase==='regular')simDay(L);processPending(L);startPlayoffs(L);while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);if(next!==false)startNewSeason(L);}`);
console.log(run(`(function(N){const res=[],info=[];const ok=(n,c,x)=>res.push((c?'PASS ':'FAIL ')+n+(x!=null?'  ['+x+']':''));
const t0=Date.now();const L=newLeague({mode:'team',userTeam:0,size:30});for(let i=0;i<30;i++)simDay(L);
ok('picks for this season + 6 drafts',L.picks.length===30*2*7&&Math.max(...L.picks.map(k=>k.s))===L.season+6);
const avgY=[],sdY=[];for(let s=L.season;s<=L.season+6;s++){const a=L.teams.map(t=>pickPtsNow(L,L.picks.find(k=>k.s===s&&k.rd===1&&k.orig===t.id)));const m=a.reduce((x,y)=>x+y,0)/a.length;avgY.push(Math.round(m));sdY.push(Math.round(Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/a.length)));}
ok('further out: average 1st worth less, and teams closer together',avgY.slice(1).every((x,i)=>i===0||x<=avgY[i])&&sdY[6]<sdY[1]*0.5,'avg '+avgY.join(' ')+' | spread '+sdY.join(' '));
const A=L.teams[0],B=L.teams[1],f=s=>L.picks.find(k=>k.s===s&&k.rd===1&&k.orig===A.id).id,S=L.season;
const giveP=ids=>({players:[],picks:ids,cash:0});const none={players:[],picks:[],cash:0};const p2=L.picks.find(k=>k.owner===B.id&&k.rd===2&&k.s===S+1).id;
ok('Stepien: two 1sts in a row blocked',/Stepien/.test(tradeCheck(L,A.id,B.id,giveP([f(S+1),f(S+2)]),giveP([p2]))||''),tradeCheck(L,A.id,B.id,giveP([f(S+1),f(S+2)]),giveP([p2])));
ok('Stepien: every other year allowed',!/Stepien/.test(tradeCheck(L,A.id,B.id,giveP([f(S+1),f(S+3),f(S+5)]),giveP([p2]))||''));
ok('Stepien: getting a 1st back fixes it',!/Stepien/.test(tradeCheck(L,A.id,B.id,giveP([f(S+1),f(S+2)]),giveP([L.picks.find(k=>k.s===S+2&&k.rd===1&&k.orig===B.id).id]))||''));
const P=projRanks(L),ord=L.teams.slice().sort((a,b)=>P.r[a.id][0]-P.r[b.id][0]),W=ord[0],Bst=ord[29];
const swGood={s:S,g:Bst.id,r:W.id},swBad={s:S,g:W.id,r:Bst.id};
ok('swap value: right to swap with a better team is worth little; with a worse team, a lot',swapPts(L,swGood)<swapPts(L,swBad)&&swapPts(L,swBad)>100,Math.round(swapPts(L,swGood))+' vs '+Math.round(swapPts(L,swBad)));
ok('swap check passes when both own their 1st',swapCheck(L,swBad,[])===null);
const tr={a:W.id,b:Bst.id,aGive:{players:[],picks:[],cash:0,swaps:[swBad]},bGive:{players:[],picks:[L.picks.find(k=>k.owner===Bst.id&&k.rd===2&&k.s===S+2).id],cash:0}};
ok('trade with a swap passes the trade check',tradeCheck(L,tr.a,tr.b,tr.aGive,tr.bGive)===null,tradeCheck(L,tr.a,tr.b,tr.aGive,tr.bGive));
ok('describe lists the swap',/swap \\d+ 1sts/.test(describe(L,tr.aGive)),describe(L,tr.aGive));
executeTrade(L,tr);ok('swap recorded, picks locked',L.swaps.length===1&&ownFirst(L,W.id,S).swap&&ownFirst(L,Bst.id,S).swap);
ok('a locked pick cannot be traded',/swap/.test(tradeCheck(L,W.id,A.id===W.id?B.id:A.id,giveP([ownFirst(L,W.id,S).id]),none)||''));
ok('a locked pick cannot be protected',/swap/.test(protCheck(L,W.id,ownFirst(L,W.id,S),protOpts(L)[1])||''));
const wPick=ownFirst(L,W.id,S).id,bPick=ownFirst(L,Bst.id,S).id;
L.user=null;{let g=0;while(L.phase==='regular')simDay(L);processPending(L);startPlayoffs(L);while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);startOffseason(L);runLottery(L);}
const kw=L.picks.find(k=>k.id===wPick),kb=L.picks.find(k=>k.id===bPick),ro=L.draftOrder.filter(x=>x.rd===1).map(x=>x.orig),sw=ro.indexOf(W.id),sb=ro.indexOf(Bst.id);   // checked right after the lottery (draft-day trades can move them later)
ok('swap resolved at the lottery: the better slot went to the holder',!(L.swaps||[]).some(x=>x.s===S)&&(sw<sb?kw.owner===Bst.id&&kb.owner===W.id:kw.owner===W.id&&kb.owner===Bst.id),'slots '+(sw+1)+'/'+(sb+1)+' owners '+kw.owner+'/'+kb.owner);
{let g=0;startDraft(L);while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);}
const C=JSON.parse(JSON.stringify(L));C.picks=C.picks.filter(k=>k.s<=C.season+2);migrateLeague(C);ok('old saves get the 6-year window',C.picks.filter(k=>k.s===C.season+6).length===60);
const M=newLeague({mode:'commish',size:30});const tr2=[],gaps=[],maxP=[],far=[],cnt=[];for(let y=0;y<N;y++){SEASON(M,false);tr2.push(M.trades.filter(x=>x.s===M.season).length);
 gaps.push(M.teams.filter(t=>stepienGaps(M,t.id,null).length).length);const own=M.teams.map(t=>M.picks.filter(k=>k.rd===1&&k.owner===t.id&&k.s>M.season).length);maxP.push(Math.max(...own));
 const pc=M.teams.map(t=>M.picks.filter(k=>k.owner===t.id&&k.s>M.season).length);cnt.push(Math.min(...pc)+'-'+Math.max(...pc));
 far.push(M.trades.filter(x=>x.s===M.season).reduce((a,x)=>a+((x.aIn&&x.aIn.picks)||[]).concat((x.bIn&&x.bIn.picks)||[]).filter(l=>{const m=/^(\\d{4})/.exec(l);return m&&+m[1]-1999>M.season+3;}).length,0));startNewSeason(M);}
info.push('AI: trades '+tr2.join('/')+' | teams with a Stepien gap '+gaps.join('/')+' | most future 1sts owned by one team '+maxP.join('/')+' | picks 4+ years out traded '+far.join('/')+' | picks per team (min-max) '+cnt.join(' '));
ok('AI trades steady (35-60 a season)',tr2.every(x=>x>=35&&x<=60));
ok('no Stepien gaps in AI seasons',gaps.every(x=>x===0));
ok('no team hoards future 1sts (max 12 of 6 years)',maxP.every(x=>x<=12));
info.push('ms '+(Date.now()-t0));
return res.join('\\n')+'\\n--\\n'+info.join('\\n');})(${+process.argv[2]||3})`));
