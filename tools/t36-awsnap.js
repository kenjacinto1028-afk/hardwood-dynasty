// v36: MVP weight tuning on frozen seasons.  dump: sim N seasons from a save, write the league at award time (gz) to a dir.
// grid: score MVP weight sets on those dumps in seconds (each set keeps its own MVP history, like t34-awgrid.js).
//   SNAP=tools/snap/nba-commish-s10.json.gz SEED=21 node tools/t36-awsnap.js dump 10 /tmp/awsnap
//   node tools/t36-awsnap.js grid /tmp/awsnap [sets.json] [show]     (sets.json: {name:{mvp:{gs,ws,ws48,per,bpm},mvpTeam,fat1,fat2,fatOld}}; default = built-in sets)
const fs = require('fs'), zlib = require('zlib'), mode = process.argv[2], SRC = process.env.SRC || 'src', SEED = +process.env.SEED || 21;
if (mode === 'dump') {
  const N = +process.argv[3] || 10, dir = process.argv[4] || '/tmp/awsnap'; fs.mkdirSync(dir, { recursive: true });
  const o = require('./snap.js')(SRC, SEED, process.env.SNAP || 'tools/snap/nba-commish-s10.json.gz');
  o.ctx.__dump = (s, json) => fs.writeFileSync(dir + '/s' + s + '.json.gz', zlib.gzipSync(json));
  o.run(`(function(){const ca=computeAwards;computeAwards=function(L){__dump(L.season,JSON.stringify(L));return ca.apply(this,arguments);};})();`);
  for (let y = 1; y <= N; y++) { o.run(`(function(){const L=SL;let g=0;while(L.phase==='regular'&&g++<400)simDay(L);processPending(L);startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);if(L.phase==='off-resign')startFA(L);g=0;while(L.phase==='off-fa'&&g++<60)faDay(L);processPending(L);startNewSeason(L);})()`); console.log('dumped season ' + y); }
} else {
  const dir = process.argv[3] || '/tmp/awsnap', show = process.argv[5] === 'show';
  const W = (gs, ws, ws48, per, bpm) => ({ gs, ws, ws48, per, bpm });
  const F0 = { fat1: .05, fat2: .10, fatOld: .02 };
  const SETS = process.argv[4] && process.argv[4] !== '-' ? JSON.parse(fs.readFileSync(process.argv[4])) : {
    G: { mvp: W(.30, .40, .10, .05, .15), mvpTeam: .5, ...F0 }, W1: { mvp: W(.30, .35, .10, .05, .20), mvpTeam: .5, ...F0 } };
  const files = fs.readdirSync(dir).filter(f => /^s\d+\.json\.gz$/.test(f)).sort((a, b) => +a.slice(1) - +b.slice(1));
  const SH = {}; for (const k in SETS) SH[k] = {}; const rows = [];
  for (const f of files) {
    const o = require('./snap.js')(SRC, SEED, dir + '/' + f); o.ctx.__sets = JSON.stringify(SETS); o.ctx.__sh = JSON.stringify(SH); o.ctx.__show = show;
    const r = JSON.parse(o.run(`(function(){const L=SL,SETS=JSON.parse(__sets),SH=JSON.parse(__sh),q=awardQual(L),keep=JSON.parse(JSON.stringify(AW_ADV)),row={s:L.season},S=L.season,det={};let CUR=null;
      const ms=mvpStreak,mr=mvpRecent;
      mvpStreak=function(L,pid,S){if(!CUR)return ms(L,pid,S);let k=0;for(let s=S-1;SH[CUR][s]===pid;s--)k++;return k;};
      mvpRecent=function(L,pid,S){if(!CUR)return mr(L,pid,S);return [S-2,S-3].some(s=>SH[CUR][s]===pid);};
      const rank=p=>q.filter(x=>(x.stats.rs.ws||0)>(p.stats.rs.ws||0)).length+1;
      for(const k in SETS){CUR=k;Object.assign(AW_ADV,JSON.parse(JSON.stringify(SETS[k])));const lad=awardLadder(L,'mvp',5),l=lad[0],p=l?L.players[l.pid]:null;row[k]=p?[p.name,rank(p)]:null;SH[k][S]=p?p.id:null;
        if(__show)det[k]=lad.map(x=>{const pp=L.players[x.pid];return pp.name+' ws#'+rank(pp)+' ws'+(pp.stats.rs.ws||0).toFixed(1)});}
      CUR=null;Object.assign(AW_ADV,keep);mvpStreak=ms;mvpRecent=mr;row.det=det;return JSON.stringify({row,SH});})()`));
    Object.assign(SH, r.SH); rows.push(r.row);
    console.log('G ' + JSON.stringify(show ? r.row : (({ det, ...x }) => x)(r.row)));
  }
  for (const k of Object.keys(SETS)) { const w = rows.map(r => r[k]).filter(Boolean), c = {}; w.forEach(x => c[x[0]] = (c[x[0]] || 0) + 1);
    console.log('SUM ' + JSON.stringify({ set: k, n: w.length, wsLeader: w.filter(x => x[1] === 1).length, top3: w.filter(x => x[1] <= 3).length, winners: Object.keys(c).length, most: Math.max(...Object.values(c)), worstRank: Math.max(...w.map(x => x[1])) })); }
}
