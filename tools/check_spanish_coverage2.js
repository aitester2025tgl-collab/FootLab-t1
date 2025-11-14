// Renamed from check_laliga2.js -> clearer name: check_spanish_coverage2
global.window={};
require('../data/real_rosters_2025_26.js');
const keys=Object.keys(window.REAL_ROSTERS||{});
const expected=['Real Madrid','Barcelona','Atletico de Madrid','Athletic Club','FC Villarreal','Real Sociedad','Real Betis','Valencia CF','Girona FC','Celta de Vigo','Sevilla FC','RCD Espanyol','CA Osasuna','Rayo Vallecano','Levante UD','RCD Mallorca','Elche CF','Deportivo Alavés','Getafe FC','Real Oviedo'];
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').trim();}
const nkeys=keys.map(k=>({k, n: norm(k)}));
console.log('Total teams in file:',keys.length,'\n');
expected.forEach(e=>{
  const ne=norm(e);
  const found = nkeys.find(x=> x.n===ne);
  if(found) { console.log(e,'-> FOUND as "'+found.k+'" at pos', keys.indexOf(found.k)+1); return; }
  // try looser matches
  const token = ne.split(' ')[0];
  const candidates = nkeys.filter(x=> x.n.includes(token) || token.includes(x.n.substring(0,Math.min(4,x.n.length))));
  if(candidates.length){
    console.log(e,'-> MISSING exact. Candidates:', candidates.map(c=>c.k).join(', '));
  } else {
    console.log(e,'-> MISSING (no close candidate found)');
  }
});
