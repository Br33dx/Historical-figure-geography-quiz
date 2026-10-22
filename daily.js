/* Mapzino daily challenge helper. Shared by every game page and daily.html.
   To switch on the shared Top 10 standings, paste your Firebase Realtime Database URL below
   (see the setup steps). Leave it empty and the games still work; only the standings are off. */
(function(){
const LB="https://realtime-database-8f459-default-rtdb.europe-west1.firebasedatabase.app/";   // e.g. "https://mapzino-default-rtdb.europe-west1.firebasedatabase.app"

const GAMES=[["history","Figures","🗺️","Where & When?"],["countries","Countries","🧭","Which Country?"],["cities","Cities","🏙️","Which City?"],["landmarks","Landmarks","🗼","Which Landmark?"],["states","US States","🇺🇸","Which US State?"]];
const DAY=new Date().toISOString().slice(0,10);
const game=((location.pathname.split("/").pop()||"").replace(".html",""))||"index";
const on=new URLSearchParams(location.search).get("daily")==="1"&&GAMES.some(g=>g[0]===game);
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const mul=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const key=(g,p)=>"d|"+DAY+"|"+g+"|"+p;
const BAD=["fuck","shit","cunt","nigg","fagg","bitch","whore","rape","nazi","hitler","porn","dick","penis","vagina","asshole"];

const MZ={LB,DAY,GAMES,on,game,esc};

// Run fn with Math.random replaced by a generator seeded from today's date and the game.
MZ.seeded=fn=>{const o=Math.random;Math.random=mul(hash("mapzino-1|"+DAY+"|"+game));try{return fn()}finally{Math.random=o}};

MZ.load=g=>{try{return JSON.parse(ls.get(key(g||game,"run")))}catch(e){return null}};
MZ.progress=(t,r)=>ls.set(key(game,"run"),JSON.stringify({t,r}));
MZ.started=()=>{if(!MZ.load())ls.set(key(game,"run"),JSON.stringify({t:0,r:[]}))};

MZ.squares=r=>{const a=(r||[]).map(x=>x[1]);while(a.length<5)a.push(0);return a.map(p=>p>=1000?"🟩":p>=400?"🟨":p>0?"🟧":"⬛").join("")};
MZ.shareText=(g,t,r)=>{const m=GAMES.find(x=>x[0]===g);return`Mapzino Daily ${DAY} · ${m[3]}\n${MZ.squares(r)} ${t.toLocaleString("en")} / 10,000\nBeat me: https://mapzino.com/${g}.html?daily=1`};
MZ.share=(g,t,r,btn)=>{const x=MZ.shareText(g,t,r);
 if(navigator.share){navigator.share({text:x}).catch(()=>{})}
 else{(navigator.clipboard?navigator.clipboard.writeText(x):Promise.reject()).then(()=>{if(btn)btn.textContent="Copied!"},()=>{prompt("Copy your score:",x)})}};

const url=g=>LB.replace(/\/$/,"")+"/daily/"+DAY+"/"+g+".json";
MZ.top=async g=>{if(!LB)return null;
 const r=await fetch(url(g)+'?orderBy="s"&limitToLast=10');if(!r.ok)throw 0;
 const o=await r.json();return Object.values(o||{}).filter(x=>x&&typeof x.n==="string"&&typeof x.s==="number").sort((a,b)=>b.s-a.s||a.t-b.t).slice(0,10)};
MZ.post=async(g,n,s)=>{const r=await fetch(url(g),{method:"POST",body:JSON.stringify({n,s,t:Date.now()})});if(!r.ok)throw 0};
MZ.clean=n=>{n=(n||"").replace(/[<>&"'`\\]/g,"").replace(/\s+/g," ").trim().slice(0,16);
 if(n.length<2)return{err:"Use 2 to 16 characters."};
 const l=n.toLowerCase().replace(/[^a-z]/g,"");if(BAD.some(b=>l.includes(b)))return{err:"Please choose a different nickname."};
 return{n}};
MZ.posted=g=>ls.get(key(g||game,"posted"));

MZ.renderBoard=(el,rows,me)=>{
 if(rows===null){el.innerHTML='<p style="opacity:.7;margin:.3em 0">Standings are not switched on yet.</p>';return}
 if(!rows.length){el.innerHTML='<p style="opacity:.7;margin:.3em 0">No scores yet today. Be the first!</p>';return}
 el.innerHTML="<table>"+rows.map((r,i)=>`<tr${me&&r.n===me?' style="font-weight:700"':""}><td style="width:2em">${i+1}</td><td style="text-align:left">${esc(r.n)}</td><td>${r.s.toLocaleString("en")}</td></tr>`).join("")+"</table>"};
MZ.board=async(el,g,me)=>{el.innerHTML='<p style="opacity:.7;margin:.3em 0">Loading…</p>';
 try{MZ.renderBoard(el,await MZ.top(g),me)}catch(e){el.innerHTML='<p style="opacity:.7;margin:.3em 0">Could not load the standings right now.</p>'}};

// Result screen for a finished daily run: share button, nickname form, today's Top 10.
MZ.endUI=(box,t,r)=>{
 const ag=box.querySelector("#again");if(ag)ag.remove();
 const sb=box.querySelector("#shr");if(sb)sb.onclick=()=>MZ.share(game,t,r,sb);
 box.insertAdjacentHTML("afterbegin",`<div class="lg">📅 Daily challenge · ${DAY}</div>`);
 box.insertAdjacentHTML("beforeend",`<div id="dnk" style="margin-top:12px"></div><h3 style="margin:14px 0 4px">Today's Top 10</h3><div id="dlb"></div><p style="margin:12px 0 0"><a href="daily.html" style="color:var(--fg)">← All daily challenges</a> · New puzzles at 00:00 UTC</p>`);
 const nk=box.querySelector("#dnk"),lb=box.querySelector("#dlb");
 const show=()=>MZ.board(lb,game,ls.get("nick"));
 const done=MZ.posted();
 if(!LB){nk.innerHTML='<p style="opacity:.7;margin:0">Standings will appear here soon.</p>'}
 else if(done){nk.innerHTML=`<p style="margin:0">Posted as <b>${esc(done)}</b>. Come back tomorrow for new puzzles.</p>`}
 else if(t<=0){nk.innerHTML=""}
 else{nk.innerHTML=`<div class="row" style="margin:0"><input id="nki" maxlength="16" placeholder="Your nickname" aria-label="Nickname" style="flex:1 1 180px;width:auto"><button id="nks">Add my score</button></div><div id="nke" class="r" style="min-height:1.2em"></div>`;
  const inp=nk.querySelector("#nki");inp.value=ls.get("nick")||"";
  const go=async()=>{const c=MZ.clean(inp.value);const er=nk.querySelector("#nke");if(c.err){er.textContent=c.err;return}
   const b=nk.querySelector("#nks");b.disabled=true;er.textContent="";
   try{await MZ.post(game,c.n,t);ls.set("nick",c.n);ls.set(key(game,"posted"),c.n);nk.innerHTML=`<p style="margin:0">Posted as <b>${esc(c.n)}</b>. Come back tomorrow for new puzzles.</p>`;show()}
   catch(e){b.disabled=false;er.textContent="Could not save your score. Try again."}};
  nk.querySelector("#nks").onclick=go;inp.addEventListener("keydown",e=>{if(e.key==="Enter")go()})}
 show()};

window.MZ=MZ;
})();
