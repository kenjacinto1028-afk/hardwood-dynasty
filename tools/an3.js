const tag=process.argv[2];let R=[];for(const s of [1,2,3])R=R.concat(require("./"+tag+"rows"+s+".json"));
let M=0,A=0,F=0;for(const r of R){M+=r.tpm;A+=r.tpa;F+=r.fga}
const bins=[[0,45],[45,55],[55,65],[65,75],[75,100]];const o={lg3p:(M/A*100).toFixed(1),tpaShare:(A/F*100).toFixed(1)};
o.bin=bins.map(([a,b])=>{const r=R.filter(x=>x.tp>=a&&x.tp<b&&x.min>12000);let m=0,t=0;for(const x of r){m+=x.tpm;t+=x.tpa}return a+":"+(m/t*100).toFixed(1)});
const big=b=>{const r=R.filter(x=>["PF","C"].includes(x.pos)&&x.min>12000&&x.tp>=b[0]&&x.tp<b[1]);let t=0,mn=0;for(const x of r){t+=x.tpa;mn+=x.min}return (t/mn*2160).toFixed(2)};
o.big3pa36={"<45":big([0,45]),"45-55":big([45,55]),"55+":big([55,100])};
const q=R.filter(x=>x.tpa/x.gp>=2&&x.gp>=40);o.q=(q.length/3).toFixed(0);o.q45=(q.filter(x=>x.tpm/x.tpa>=.45).length/3).toFixed(1);o.q40=(q.filter(x=>x.tpm/x.tpa>=.40).length/3).toFixed(1);
o.bigsBad1pg=(R.filter(x=>["PF","C"].includes(x.pos)&&x.tp<50&&x.tpa/x.gp>=1).length/3).toFixed(1);
console.log(tag,JSON.stringify(o));
