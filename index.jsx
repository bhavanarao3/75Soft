import { useState, useEffect, useRef, useCallback } from "react";

const START = new Date("2026-05-04T00:00:00");
const TOTAL = 75;

const toStr = (d) => {
  const y = d.getFullYear(), mo = String(d.getMonth()+1).padStart(2,"0"), dy = String(d.getDate()).padStart(2,"0");
  return `${y}-${mo}-${dy}`;
};
const todayStr = () => toStr(new Date());
const dayOf = (ds) => {
  const d = new Date(ds + "T00:00:00");
  return Math.floor((d - START) / 86400000) + 1;
};
const dateOfDay = (n) => {
  const d = new Date(START.getTime() + (n-1)*86400000);
  return toStr(d);
};

const LEARN = [
  { title:"C++: Smart Pointers & RAII", body:"Write a RAII resource wrapper using unique_ptr and shared_ptr. No raw new/delete allowed — this is table stakes at robotics companies." },
  { title:"ROS2: TF2 & Coordinate Frames", body:"Implement a tf2 broadcaster and listener. Understand static vs dynamic transforms — mishandled frames are a top source of perception bugs." },
  { title:"Perception: Point Cloud Pipeline", body:"Review a full PCL pipeline: voxel downsampling → normal estimation → segmentation. Sketch what each step does to the data." },
  { title:"C++: Concurrency for Robotics", body:"Study std::thread, std::mutex, std::atomic. Write a thread-safe sensor data buffer — essential for multi-sensor fusion architectures." },
  { title:"Control Theory: PID Deep Dive", body:"Implement a PID controller from scratch in C++. Tune it on a simulated 1D system. Understand integral windup and derivative kick." },
  { title:"ROS2: Nav2 Architecture", body:"Study Nav2's planner/controller server split. Understand the costmap2d layers and when you'd write a custom plugin vs configure an existing one." },
  { title:"Perception: Camera Calibration", body:"Revisit pinhole model, distortion parameters, and stereo calibration math. Can you derive the projection matrix from first principles?" },
  { title:"C++: Templates & Type Traits", body:"Write a generic circular buffer using templates and static_assert. Study type_traits — used everywhere in modern robotics middleware." },
  { title:"State Estimation: EKF/UKF", body:"Study the Extended Kalman Filter derivation. Implement a 2D pose EKF on paper first, then in Python. This is core for localization interviews." },
  { title:"ROS2: Lifecycle Nodes", body:"Refactor a simple node to use managed lifecycle. Understand configure → activate → deactivate — critical for production-grade robot software." },
  { title:"Perception: Semantic Segmentation", body:"Review SegNet vs DeepLab vs Mask R-CNN architectually — not just results. What are the tradeoffs for real-time on-robot inference?" },
  { title:"C++: STL & Algorithm Complexity", body:"Solve 3 problems using only STL — priority_queue, unordered_map, lower_bound. Know the complexity of each container operation cold." },
  { title:"Motion Planning: Sampling Methods", body:"Study RRT vs RRT* vs PRM. Implement RRT in 2D from scratch. Understand the completeness and optimality properties of each." },
  { title:"ROS2: Behavior Trees (BT.CPP v4)", body:"Implement a 3-node behavior tree: condition → fallback → action. Understand blackboard communication and when to use a Sequence vs Fallback." },
  { title:"Perception: Depth Estimation", body:"Study structured light vs stereo vs ToF vs monocular depth — what each sensor can and can't do. How would you fuse two of them?" },
  { title:"C++: Move Semantics & Rvalue Refs", body:"Write a class with proper move constructor and move assignment. Profile copy vs move on a large vector. Interviewers love this topic." },
  { title:"Control: Model Predictive Control", body:"Study MPC intuition — rolling horizon, constraint satisfaction. Sketch how you'd replace a PID with MPC on a mobile robot. When is it worth it?" },
  { title:"ROS2: Custom Message & Service Design", body:"Design a clean ROS2 interface for a perception pipeline: what's a topic, what's a service, what's an action? Write the .msg/.srv/.action files." },
  { title:"Perception: Object Detection Review", body:"Compare YOLO, SSD, and DETR architecturally. What are the latency/accuracy tradeoffs for deployment on a robot with a Jetson or similar?" },
  { title:"System Design: Robotics Architecture", body:"Sketch the full software architecture for an autonomous mobile robot — sensing, localization, mapping, planning, control. Be ready to whiteboard this." },
];

const HABITS = [
  { id:"wake",    label:"Wake up by 7:30 AM",          icon:"🌅", cat:"Morning",      note:"" },
  { id:"noscreen",label:"No screen before bathing",    icon:"🚿", cat:"Morning",      note:"" },
  { id:"lymph",   label:"Lymphatic drainage",           icon:"💆", cat:"Morning",      note:"10–15 min" },
  { id:"vitd",    label:"Vitamin D",                   icon:"☀️", cat:"Supplements",  note:"daily" },
  { id:"b12",     label:"B12 supplement",              icon:"💊", cat:"Supplements",  note:"alternate days", altDay:true },
  { id:"cran",    label:"Cranberry with dinner",        icon:"🍒", cat:"Supplements",  note:"daily" },
  { id:"steps",   label:"5,000+ steps",                icon:"👟", cat:"Body",         note:"" },
  { id:"water",   label:"1.5–2L water",                icon:"💧", cat:"Body",         note:"" },
  { id:"protein", label:"50–60g protein",              icon:"🥩", cat:"Body",         note:"" },
  { id:"nosugar", label:"Avoided sugar",               icon:"🚫", cat:"Body",         note:"" },
  { id:"workout", label:"Workout session",             icon:"🏋️", cat:"Fitness",      note:"4×/week goal" },
  { id:"nophone", label:"No phone after dinner",       icon:"📵", cat:"Evening",      note:"" },
  { id:"kitchen", label:"Kitchen clean",               icon:"🍽️", cat:"Evening",      note:"" },
  { id:"learn",   label:"30 min meaningful learning",  icon:"📚", cat:"Growth",       note:"see today's prompt" },
  { id:"journal", label:"5 min reflection / journal",  icon:"✍️", cat:"Growth",       note:"what went well today?" },
];

function habitListForDay(n) {
  return HABITS.filter(h => h.altDay ? n % 2 === 1 : true);
}

const G = {
  dark:"#0D5C45", mid:"#1D9E75", light:"#E1F5EE",
  amber:"#EF9F27", amberBg:"#FFF8E6", amberDark:"#854F0B",
  border:"#E8E8E3", bg:"#F7F7F3", card:"#FFFFFF",
  text:"#1A1A1A", muted:"#888888", red:"#E24B4A",
};

const CAT_COLOR = { Morning:"#5DCAA5", Supplements:"#EF9F27", Body:"#378ADD", Fitness:"#D85A30", Evening:"#7F77DD", Growth:"#D4537E" };

export default function App() {
  const [raw, setRaw] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("today");
  const [calMonth, setCalMonth] = useState(0);
  const saveRef = useRef(null);
  const today = todayStr();
  const cd = dayOf(today);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("soft75_v1");
        if (r) setRaw(JSON.parse(r.value));
      } catch (_) {}
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback((d) => {
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(async () => {
      try { await window.storage.set("soft75_v1", JSON.stringify(d)); } catch (_) {}
    }, 400);
  }, []);

  const toggle = (ds, id) => {
    setRaw(prev => {
      const next = { ...prev, [ds]: { ...(prev[ds]||{}), [id]: !(prev[ds]?.[id]) } };
      persist(next);
      return next;
    });
  };

  if (!loaded) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:200,color:G.muted,fontSize:14}}>
      Loading your challenge…
    </div>
  );

  const preChallenge = cd < 1;
  const postChallenge = cd > TOTAL;
  const activeCd = preChallenge ? 1 : Math.min(cd, TOTAL);
  const todayHabits = habitListForDay(activeCd);
  const todayData = raw[today] || {};
  const checkedCount = todayHabits.filter(h => todayData[h.id]).length;
  const pct = Math.round(checkedCount / todayHabits.length * 100);

  // streak
  let streak = 0;
  for (let i = cd - 1; i >= 1; i--) {
    const ds = dateOfDay(i), hl = habitListForDay(i), dd = raw[ds]||{};
    if (hl.every(h => dd[h.id])) streak++; else break;
  }

  // week workouts
  const now = new Date(), dow = now.getDay();
  const wkStart = new Date(now); wkStart.setDate(now.getDate() - dow); wkStart.setHours(0,0,0,0);
  let weekW = 0;
  for (let i=0;i<7;i++){const d=new Date(wkStart.getTime()+i*86400000);if((raw[toStr(d)]||{}).workout)weekW++;}

  // perfect days
  let perfect=0, attempted=0;
  for (let i=1;i<=Math.min(cd-1,TOTAL);i++){
    const ds=dateOfDay(i),hl=habitListForDay(i),dd=raw[ds]||{};
    attempted++;if(hl.every(h=>dd[h.id]))perfect++;
  }

  const learnIdx = ((activeCd-1) % LEARN.length);
  const learn = LEARN[learnIdx];
  const cats = [...new Set(todayHabits.map(h=>h.cat))];
  const daysLeft = TOTAL - Math.max(cd-1,0);

  return (
    <div style={{fontFamily:"'Georgia', serif", background:G.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto"}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${G.dark} 0%,#1A7A5E 100%)`,color:"white",padding:"22px 20px 18px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.06)"}}/>
        <div style={{position:"absolute",bottom:-20,right:40,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.04)"}}/>
        <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.14em",opacity:0.7,marginBottom:6,fontFamily:"system-ui, sans-serif"}}>75 Soft Challenge · Started May 4 2026</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:42,fontWeight:400,lineHeight:1,letterSpacing:"-0.02em"}}>
              {preChallenge ? "Day 0" : `Day ${Math.min(cd,75)}`}
              <span style={{fontSize:16,opacity:0.6,marginLeft:4}}>/ 75</span>
            </div>
            <div style={{fontSize:12,opacity:0.65,marginTop:4,fontFamily:"system-ui, sans-serif"}}>
              {preChallenge ? "🌱 Starts tomorrow — you're ready!" : postChallenge ? "🏆 Challenge complete!" : `${daysLeft} days remaining · ends Jul 17`}
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:28,lineHeight:1}}>{streak}<span style={{fontSize:18}}>🔥</span></div>
            <div style={{fontSize:11,opacity:0.65,fontFamily:"system-ui, sans-serif"}}>day streak</div>
          </div>
        </div>
        {/* Overall progress bar */}
        <div style={{marginTop:16,background:"rgba(255,255,255,0.18)",borderRadius:3,height:4}}>
          <div style={{width:`${(Math.max(cd-1,0)/TOTAL)*100}%`,background:"white",height:"100%",borderRadius:3,transition:"width 0.6s ease"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,opacity:0.6,marginTop:5,fontFamily:"system-ui, sans-serif"}}>
          <span>May 4</span>
          <span>{perfect}/{attempted} perfect days</span>
          <span>Jul 17</span>
        </div>
      </div>

      {/* Stat pills */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,padding:"14px 16px 0"}}>
        {[
          {label:"Today",value:`${pct}%`,sub:`${checkedCount}/${todayHabits.length} habits`,good:pct>=80},
          {label:"Workouts",value:`${weekW}/4`,sub:"this week",good:weekW>=4},
          {label:"Completion",value:attempted>0?`${Math.round(perfect/attempted*100)}%`:"—",sub:"perfect days",good:true},
        ].map(s=>(
          <div key={s.label} style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:"10px 10px 8px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:s.good?G.dark:G.red,fontFamily:"system-ui, sans-serif"}}>{s.value}</div>
            <div style={{fontSize:10,color:G.muted,marginTop:1,fontFamily:"system-ui, sans-serif"}}>{s.label}</div>
            <div style={{fontSize:9,color:G.muted,marginTop:1,fontFamily:"system-ui, sans-serif"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,padding:"14px 16px 0",fontFamily:"system-ui, sans-serif"}}>
        {["today","calendar","stats"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:"7px 16px",borderRadius:20,border:`1px solid ${tab===t?G.dark:G.border}`,cursor:"pointer",
            fontSize:12,fontWeight:600,background:tab===t?G.dark:"transparent",
            color:tab===t?"white":G.muted,transition:"all 0.15s",letterSpacing:"0.02em",textTransform:"uppercase",
          }}>{t}</button>
        ))}
      </div>

      <div style={{padding:"14px 16px 40px"}}>
        {tab==="today" && <TodayTab {...{cats,todayHabits,todayData,toggle,today,learn,weekW,preChallenge}}/>}
        {tab==="calendar" && <CalendarTab raw={raw} cd={cd} calMonth={calMonth} setCalMonth={setCalMonth}/>}
        {tab==="stats" && <StatsTab raw={raw} cd={cd} weekW={weekW} perfect={perfect} attempted={attempted} streak={streak}/>}
      </div>
    </div>
  );
}

function TodayTab({cats,todayHabits,todayData,toggle,today,learn,weekW,preChallenge}) {
  return (
    <>
      {preChallenge && (
        <div style={{background:G.light,borderRadius:10,padding:"12px 16px",marginBottom:12,textAlign:"center",color:G.dark,fontFamily:"system-ui, sans-serif",fontSize:13,fontWeight:600}}>
          🌱 Set up complete — check in starting tomorrow!
        </div>
      )}
      {/* Workout week bar */}
      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:"10px 14px",marginBottom:12,fontFamily:"system-ui, sans-serif"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:11,fontWeight:700,color:G.muted,textTransform:"uppercase",letterSpacing:"0.07em"}}>Workouts this week</span>
          <span style={{fontSize:12,fontWeight:700,color:weekW>=4?G.dark:G.amber}}>{weekW}/4</span>
        </div>
        <div style={{display:"flex",gap:6}}>
          {["S","M","T","W","T","F","S"].map((d,i)=>(
            <div key={i} style={{flex:1,textAlign:"center"}}>
              <div style={{height:6,borderRadius:3,background:i<weekW?G.mid:G.border,marginBottom:3}}/>
              <span style={{fontSize:9,color:G.muted}}>{d}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Learning prompt */}
      <div style={{background:G.amberBg,borderLeft:`3px solid ${G.amber}`,borderRadius:"0 10px 10px 0",padding:"10px 14px",marginBottom:14,fontFamily:"system-ui, sans-serif"}}>
        <div style={{fontSize:9,color:G.amberDark,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>Today's 30 min — meaningful growth</div>
        <div style={{fontSize:13,fontWeight:700,color:"#633806",marginTop:3}}>{learn.title}</div>
        <div style={{fontSize:11,color:G.amberDark,marginTop:3,lineHeight:1.5}}>{learn.body}</div>
      </div>
      {/* Habit groups */}
      {cats.map(cat=>(
        <div key={cat} style={{marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:CAT_COLOR[cat]||G.mid}}/>
            <span style={{fontSize:9,fontWeight:700,color:G.muted,textTransform:"uppercase",letterSpacing:"0.09em",fontFamily:"system-ui, sans-serif"}}>{cat}</span>
          </div>
          <div style={{background:G.card,borderRadius:12,border:`1px solid ${G.border}`,overflow:"hidden"}}>
            {todayHabits.filter(h=>h.cat===cat).map((h,i,arr)=>{
              const done=!!(todayData[h.id]);
              return (
                <div key={h.id} onClick={()=>toggle(today,h.id)} style={{
                  display:"flex",alignItems:"center",gap:12,padding:"11px 14px",
                  borderBottom:i<arr.length-1?`1px solid ${G.border}`:"none",
                  cursor:"pointer",background:done?"#F9FDF9":G.card,
                }}>
                  <div style={{
                    width:22,height:22,borderRadius:"50%",flexShrink:0,
                    background:done?G.dark:"transparent",border:`2px solid ${done?G.dark:"#CCC"}`,
                    display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",
                  }}>
                    {done&&<span style={{color:"white",fontSize:11,fontWeight:700,lineHeight:1}}>✓</span>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:done?G.mid:G.text,textDecoration:done?"line-through":"none",fontFamily:"system-ui, sans-serif",fontWeight:done?400:500}}>
                      {h.icon} {h.label}
                    </div>
                    {h.note&&<div style={{fontSize:10,color:G.muted,marginTop:1,fontFamily:"system-ui, sans-serif"}}>{h.note}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

function CalendarTab({raw,cd,calMonth,setCalMonth}) {
  const months = [];
  for(let m=0;m<3;m++){
    const mo=[];
    for(let d=1;d<=25;d++){
      const day=m*25+d;
      if(day>TOTAL)break;
      mo.push(day);
    }
    months.push(mo);
  }
  const allDays=[];
  for(let i=1;i<=TOTAL;i++)allDays.push(i);
  const chunks=[[],[],[]];
  allDays.forEach((d,i)=>chunks[Math.floor(i/25)].push(d));
  const monthLabels=["May 4 – May 28","May 29 – Jun 22","Jun 23 – Jul 17"];

  return (
    <div style={{fontFamily:"system-ui, sans-serif"}}>
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {monthLabels.map((l,i)=>(
          <button key={i} onClick={()=>setCalMonth(i)} style={{
            flex:1,padding:"6px 4px",borderRadius:8,border:`1px solid ${calMonth===i?G.dark:G.border}`,
            background:calMonth===i?G.dark:"transparent",color:calMonth===i?"white":G.muted,
            cursor:"pointer",fontSize:10,fontWeight:600,
          }}>{l.split(" – ")[0]}</button>
        ))}
      </div>
      <div style={{fontSize:10,color:G.muted,marginBottom:8}}>{monthLabels[calMonth]}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
        {chunks[calMonth].map(n=>{
          const ds=dateOfDay(n),hl=habitListForDay(n),dd=raw[ds]||{};
          const isPast=n<cd,isToday=n===cd,isFuture=n>cd;
          const done=hl.filter(h=>dd[h.id]).length,total=hl.length;
          const pct=total>0?done/total:0;
          let bg=G.border, color=G.muted, border=`1px solid ${G.border}`;
          if(isToday){bg=G.dark;color="white";border=`2px solid ${G.dark}`;}
          else if(isPast){
            if(pct===1){bg=G.mid;color="white";}
            else if(pct>=0.5){bg="#9FE1CB";color=G.dark;}
            else if(pct>0){bg="#FFF8E6";color=G.amberDark;border=`1px solid ${G.amber}`;}
            else{bg="#FCEBEB";color:"#A32D2D";border=`1px solid #F09595`;}
          } else {bg=G.bg;color="#CCC";}
          return (
            <div key={n} style={{background:bg,border,borderRadius:8,padding:"8px 4px",textAlign:"center",cursor:isPast||isToday?"pointer":"default"}}>
              <div style={{fontSize:14,fontWeight:600,color}}>{n}</div>
              {!isFuture&&<div style={{fontSize:9,color:isToday?"rgba(255,255,255,0.8)":color,marginTop:2}}>{isPast||isToday?`${done}/${total}`:""}</div>}
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
        {[["white",G.mid,"✓ Perfect"],["#9FE1CB",G.dark,"50%+ done"],["#FFF8E6",G.amberDark,"Partial"],["#FCEBEB","#A32D2D","Missed"],["#EEE","#CCC","Upcoming"]].map(([bg,c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:10,height:10,borderRadius:3,background:bg==="white"?G.mid:bg,border:`1px solid ${c}`}}/>
            <span style={{fontSize:10,color:G.muted}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsTab({raw,cd,weekW,perfect,attempted,streak}) {
  const habitStats = HABITS.map(h=>{
    let done=0,total=0;
    for(let i=1;i<=Math.min(cd-1,TOTAL);i++){
      const hl=habitListForDay(i);
      if(!hl.find(x=>x.id===h.id))continue;
      total++;
      if((raw[dateOfDay(i)]||{})[h.id])done++;
    }
    return {...h,done,total,rate:total>0?Math.round(done/total*100):0};
  }).filter(h=>h.total>0).sort((a,b)=>b.rate-a.rate);

  return (
    <div style={{fontFamily:"system-ui, sans-serif"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {[
          {label:"Best streak",value:`${streak} 🔥`,sub:"consecutive days"},
          {label:"Perfect days",value:`${perfect}`,sub:`of ${attempted} tracked`},
          {label:"This week",value:`${weekW}/4`,sub:"workout sessions"},
          {label:"Progress",value:attempted>0?`${Math.round(perfect/attempted*100)}%`:"—",sub:"days completed fully"},
        ].map(s=>(
          <div key={s.label} style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:"12px 14px"}}>
            <div style={{fontSize:22,fontWeight:700,color:G.dark}}>{s.value}</div>
            <div style={{fontSize:11,color:G.muted,marginTop:2,fontWeight:600}}>{s.label}</div>
            <div style={{fontSize:10,color:G.muted}}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:G.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Habit completion rates</div>
      {attempted===0&&<div style={{color:G.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>Stats appear after your first day!</div>}
      {habitStats.map(h=>(
        <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <span style={{fontSize:14,width:20,textAlign:"center"}}>{h.icon}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:11,color:G.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.label}</span>
              <span style={{fontSize:11,fontWeight:700,color:h.rate>=80?G.dark:h.rate>=50?G.amberDark:G.red,marginLeft:8,flexShrink:0}}>{h.rate}%</span>
            </div>
            <div style={{background:G.border,borderRadius:3,height:5}}>
              <div style={{width:`${h.rate}%`,height:"100%",borderRadius:3,background:h.rate>=80?G.mid:h.rate>=50?G.amber:G.red,transition:"width 0.5s"}}/>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
