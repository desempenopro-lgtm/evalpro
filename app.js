// ═══════════════════════════════════════════════════
//  EvalPro — app.js
//  Requiere: Firebase compat (app, auth, firestore)
//            Chart.js
// ═══════════════════════════════════════════════════

// ── STATE ──────────────────────────────────────────
let db = null, auth = null, demoMode = false, currentUser = null;

const DEMO = {
  users: [
    { uid: "u1", name: "María Rodríguez", email: "admin@empresa.com", role: "admin" },
    { uid: "u2", name: "Carlos Pérez",    email: "rrhh@empresa.com",  role: "rrhh" },
    { uid: "u3", name: "Laura Mendoza",   email: "laura@empresa.com", role: "evaluado" },
    { uid: "u4", name: "Andrés Vargas",   email: "andres@empresa.com",role: "evaluador" },
  ],
  empleados: [
    { id:"e1", nombre:"Laura Mendoza",  cargo:"Gerente de Producto",  area:"Tecnología", email:"laura@empresa.com",  nivel:"gerente",     jefeId:"e3" },
    { id:"e2", nombre:"Carlos Rincón",  cargo:"Analista de Datos",    area:"BI",          email:"carlos@empresa.com", nivel:"analista",    jefeId:"e1" },
    { id:"e3", nombre:"Sofía Torres",   cargo:"Directora Comercial",  area:"Ventas",      email:"sofia@empresa.com",  nivel:"director",    jefeId:"" },
    { id:"e4", nombre:"Andrés Vargas",  cargo:"Desarrollador Senior", area:"Tecnología",  email:"andres@empresa.com", nivel:"analista",    jefeId:"e1" },
  ],
  evaluaciones: [
    { id:"ev1", nombre:"Evaluación Q1 2025 – Producto", tipo:"360", empleadoId:"e1",
      inicio:"2025-01-15", cierre:"2025-02-15", estado:"activa",
      competencias:["Liderazgo","Comunicación","Orientación a resultados","Trabajo en equipo","Innovación"],
      evaluadores:[{id:"e3",relacion:"jefe"},{id:"e2",relacion:"subordinado"},{id:"e4",relacion:"par"},{id:"e1",relacion:"autoevaluacion"}],
      respuestas:{
        r1:{ relacion:"jefe",          scores:{Liderazgo:4.5,Comunicación:4,"Orientación a resultados":5,"Trabajo en equipo":4,Innovación:4.5} },
        r2:{ relacion:"autoevaluacion",scores:{Liderazgo:4,  Comunicación:3.5,"Orientación a resultados":4.5,"Trabajo en equipo":4,Innovación:4} },
      }
    },
  ],
  nextEmpId: 5, nextEvalId: 2,
};

const ROLE_LABELS  = { admin:"Admin", rrhh:"RRHH", evaluador:"Evaluador", evaluado:"Evaluado" };
const ROLE_CLASSES = { admin:"rp-admin", rrhh:"rp-rrhh", evaluador:"rp-evaluador", evaluado:"rp-evaluado" };
const PERMS = {
  admin:     { dashboard:1, evaluaciones:1, empleados:1, formulario:1, reportes:1, usuarios:1, canCreate:1, canDelete:1 },
  rrhh:      { dashboard:1, evaluaciones:1, empleados:1, formulario:1, reportes:1, usuarios:0, canCreate:1, canDelete:0 },
  evaluador: { dashboard:1, evaluaciones:0, empleados:0, formulario:1, reportes:0, usuarios:0, canCreate:0, canDelete:0 },
  evaluado:  { dashboard:1, evaluaciones:0, empleados:0, formulario:0, reportes:1, usuarios:0, canCreate:0, canDelete:0 },
};
const COMP_SUGG = ["Liderazgo","Comunicación efectiva","Orientación a resultados","Trabajo en equipo",
  "Innovación","Gestión del tiempo","Adaptabilidad","Resolución de problemas","Pensamiento estratégico","Orientación al cliente"];

// ── FIREBASE INIT ───────────────────────────────────
function gv(id) { return (document.getElementById(id)||{}).value || ""; }

function initFirebase() {
  const cfg = {
    apiKey:            gv("fb-apiKey"),
    authDomain:        gv("fb-authDomain"),
    projectId:         gv("fb-projectId"),
    storageBucket:     gv("fb-storageBucket"),
    messagingSenderId: gv("fb-msgSenderId"),
    appId:             gv("fb-appId"),
  };
  if (!cfg.apiKey || !cfg.projectId) { showCfgErr("Completa API Key y Project ID"); return; }
  try {
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    db   = firebase.firestore();
    auth = firebase.auth();
    auth.onAuthStateChanged(handleAuth);
    document.getElementById("cfg-step").style.display   = "none";
    document.getElementById("login-step").style.display = "block";
    document.getElementById("auth-proj").textContent    = "Proyecto: " + cfg.projectId;
  } catch(e) { showCfgErr("Error: " + e.message); }
}

function useDemoMode() {
  demoMode = true;
  currentUser = { uid:"u1", name:"María Rodríguez", email:"admin@empresa.com", role:"admin" };
  enterApp();
}

async function handleAuth(fbUser) {
  if (!fbUser) return;
  try {
    const doc  = await db.collection("users").doc(fbUser.uid).get();
    const data = doc.exists ? doc.data() : {};
    currentUser = { uid: fbUser.uid, name: data.name || fbUser.displayName || fbUser.email, email: fbUser.email, role: data.role || "evaluador" };
    enterApp();
  } catch(e) {
    currentUser = { uid: fbUser.uid, name: fbUser.displayName || fbUser.email, email: fbUser.email, role: "evaluador" };
    enterApp();
  }
}

// ── AUTH ACTIONS ────────────────────────────────────
async function doLogin() {
  const email = gv("l-email"), pass = gv("l-pass");
  if (!email || !pass) { showAErr("Completa email y contraseña"); return; }
  setLd("btn-li", true);
  try { await auth.signInWithEmailAndPassword(email, pass); hideAErr(); }
  catch(e) { showAErr(fErr(e)); setLd("btn-li", false); }
}

async function doRegister() {
  const name = gv("r-name"), email = gv("r-email"), pass = gv("r-pass"), role = gv("r-role");
  if (!name || !email || !pass) { showAErr("Completa todos los campos"); return; }
  if (pass.length < 6) { showAErr("La contraseña debe tener mínimo 6 caracteres"); return; }
  setLd("btn-reg", true);
  try {
    const cr = await auth.createUserWithEmailAndPassword(email, pass);
    await db.collection("users").doc(cr.user.uid).set({ name, email, role, createdAt: new Date().toISOString() });
    hideAErr();
  } catch(e) { showAErr(fErr(e)); setLd("btn-reg", false); }
}

async function doGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const cr       = await auth.signInWithPopup(provider);
    const doc      = await db.collection("users").doc(cr.user.uid).get();
    if (!doc.exists) await db.collection("users").doc(cr.user.uid).set({ name: cr.user.displayName, email: cr.user.email, role: "evaluador", createdAt: new Date().toISOString() });
  } catch(e) { showAErr(fErr(e)); }
}

function doLogout() {
  if (demoMode) { location.reload(); return; }
  auth.signOut().then(() => location.reload());
}

function fErr(e) {
  const m = {
    "auth/user-not-found":      "Usuario no encontrado",
    "auth/wrong-password":      "Contraseña incorrecta",
    "auth/email-already-in-use":"Email ya registrado",
    "auth/invalid-email":       "Email no válido",
    "auth/weak-password":       "Contraseña demasiado débil",
    "auth/popup-closed-by-user":"Popup cerrado",
    "auth/invalid-credential":  "Credenciales inválidas",
  };
  return m[e.code] || e.message;
}

// ── ENTER APP ───────────────────────────────────────
function enterApp() {
  document.getElementById("auth-screen").style.display = "none";
  document.getElementById("app-screen").style.display  = "block";
  applyRole();
  bootstrap();
}

function applyRole() {
  const role = currentUser.role;
  const p    = PERMS[role] || PERMS.evaluador;
  const ini  = (currentUser.name || "?").split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();

  document.getElementById("sb-av").textContent   = ini;
  document.getElementById("sb-name").textContent = currentUser.name;
  document.getElementById("sb-role").innerHTML   = `<span class="rp ${ROLE_CLASSES[role]}">${ROLE_LABELS[role]}</span>`;
  document.getElementById("dash-welcome").textContent = "Bienvenido, " + currentUser.name.split(" ")[0];

  const navMap = { "ni-evaluaciones":"evaluaciones", "ni-empleados":"empleados", "ni-formulario":"formulario", "ni-reportes":"reportes", "ni-usuarios":"usuarios" };
  Object.entries(navMap).forEach(([navId, perm]) => {
    const el = document.getElementById(navId);
    if (el) el.classList.toggle("hid", !p[perm]);
  });
  document.getElementById("ni-sec-admin").classList.toggle("hid", !p.usuarios);

  ["btn-new-eval","btn-ev-new","btn-emp-new"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("hid", !p.canCreate);
  });

  const defaults = { admin:"dashboard", rrhh:"dashboard", evaluador:"formulario", evaluado:"reportes" };
  showPage(defaults[role] || "dashboard");
}

// ── NAVIGATION ──────────────────────────────────────
function showPage(name) {
  document.querySelectorAll(".page").forEach(x => x.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(x => x.classList.remove("active"));
  const pg = document.getElementById("page-" + name);  if (pg) pg.classList.add("active");
  const ni = document.getElementById("ni-"   + name);  if (ni) ni.classList.add("active");
}
function openMo(id)  { document.getElementById(id).classList.add("open"); }
function closeMo(id) { document.getElementById(id).classList.remove("open"); }

// ── TOAST & UI HELPERS ──────────────────────────────
function toast(msg, t = "ok") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className   = "toast ts-" + t + " show";
  setTimeout(() => el.classList.remove("show"), 3200);
}
function showAErr(m)   { const e = document.getElementById("auth-err"); e.textContent = m; e.style.display = "block"; }
function hideAErr()    { document.getElementById("auth-err").style.display = "none"; }
function showCfgErr(m) { const e = document.getElementById("cfg-err");  e.textContent = m; e.style.display = "block"; }
function swTab(t) {
  document.querySelectorAll(".auth-tab").forEach((x, i) => x.classList.toggle("active", i === (t === "login" ? 0 : 1)));
  document.getElementById("tab-login").style.display = t === "login" ? "block" : "none";
  document.getElementById("tab-reg").style.display   = t === "register" ? "block" : "none";
  hideAErr();
}
function setLd(id, on) { const b = document.getElementById(id); if (b) b.disabled = on; }

// ── DB ABSTRACTION ──────────────────────────────────
async function dbAll(col) {
  if (demoMode) return [...(DEMO[col] || [])];
  const snap = await db.collection(col).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function dbSet(col, id, data) {
  if (demoMode) {
    const arr = DEMO[col] || (DEMO[col] = []);
    const i   = arr.findIndex(x => x.id === id || x.uid === id);
    if (i >= 0) arr[i] = { ...data, id }; else arr.push({ ...data, id });
    return;
  }
  await db.collection(col).doc(id).set(data, { merge: true });
}
async function dbDel(col, id) {
  if (demoMode) { DEMO[col] = (DEMO[col] || []).filter(x => x.id !== id && x.uid !== id); return; }
  await db.collection(col).doc(id).delete();
}
function genId(col) {
  if (demoMode) return col === "empleados" ? "e" + (DEMO.nextEmpId++) : "ev" + (DEMO.nextEvalId++);
  return db.collection(col).doc().id;
}

// ── BOOTSTRAP ───────────────────────────────────────
async function bootstrap() {
  await Promise.all([loadDash(), loadEvalTable(), loadEmpTable(), loadSelects()]);
  if ((PERMS[currentUser.role] || {}).usuarios) await loadUsers();
}

// ── DASHBOARD ───────────────────────────────────────
let ctTipos = null;

async function loadDash() {
  const [evs, emps] = await Promise.all([dbAll("evaluaciones"), dbAll("empleados")]);
  const act = evs.filter(e => e.estado === "activa");
  const tr  = evs.reduce((s,e) => s + Object.keys(e.respuestas||{}).length, 0);
  const te  = evs.reduce((s,e) => s + (e.evaluadores||[]).length, 0);
  const pct = te ? Math.round(tr / te * 100) : 0;
  const p   = PERMS[currentUser.role] || PERMS.evaluador;

  document.getElementById("dash-stats").innerHTML = p.evaluaciones
    ? `<div class="sc"><div class="sc-lbl">Activas</div><div class="sc-val" style="color:var(--accent2)">${act.length}</div><div style="font-size:12px;color:var(--text3);margin-top:3px">${evs.length} total</div></div>
       <div class="sc"><div class="sc-lbl">Empleados</div><div class="sc-val" style="color:var(--green)">${emps.length}</div></div>
       <div class="sc"><div class="sc-lbl">Respuestas</div><div class="sc-val" style="color:var(--blue)">${tr}</div><div style="font-size:12px;color:var(--text3);margin-top:3px">de ${te}</div></div>
       <div class="sc"><div class="sc-lbl">Completitud</div><div class="sc-val" style="color:var(--amber)">${pct}%</div></div>`
    : `<div class="sc"><div class="sc-lbl">Activas</div><div class="sc-val" style="color:var(--accent2)">${act.length}</div></div>
       <div class="sc"><div class="sc-lbl">Completitud</div><div class="sc-val" style="color:var(--amber)">${pct}%</div></div>`;

  const tipos = { 360:0, 180:0, 90:0 };
  evs.forEach(e => { if (tipos[e.tipo] !== undefined) tipos[e.tipo]++; });

  const ctx = document.getElementById("chartTipos").getContext("2d");
  if (ctTipos) ctTipos.destroy();
  ctTipos = new Chart(ctx, {
    type: "doughnut",
    data: { labels:["360°","180°","90°"], datasets:[{ data:[tipos[360],tipos[180],tipos[90]], backgroundColor:["rgba(108,99,255,.8)","rgba(251,191,36,.8)","rgba(96,165,250,.8)"], borderColor:["#6c63ff","#fbbf24","#60a5fa"], borderWidth:1 }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:"#9090b0", font:{ family:"DM Sans" } } } } },
  });

  const rl = document.getElementById("recent-list");
  if (!evs.length) { rl.innerHTML = "<p style=\"color:var(--text3);font-size:14px;padding:20px 0\">Sin evaluaciones aún</p>"; return; }
  rl.innerHTML = evs.slice(-5).reverse().map(e => {
    const emp  = emps.find(x => x.id === e.empleadoId) || { nombre:"—" };
    const done = Object.keys(e.respuestas||{}).length;
    const tot  = (e.evaluadores||[]).length;
    const p2   = tot ? Math.round(done / tot * 100) : 0;
    return `<div style="padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <div style="font-size:13px;font-weight:500">${e.nombre}</div><span class="badge b${e.tipo}">${e.tipo}°</span>
      </div>
      <div style="font-size:12px;color:var(--text3);margin-bottom:5px">${emp.nombre}</div>
      <div class="pb"><div class="pf" style="width:${p2}%"></div></div>
      <div style="font-size:11px;color:var(--text3);margin-top:3px">${done}/${tot} respuestas</div>
    </div>`;
  }).join("");
}

// ── EVALUACIONES ────────────────────────────────────
async function loadEvalTable() {
  const [evs, emps] = await Promise.all([dbAll("evaluaciones"), dbAll("empleados")]);
  const canDel = PERMS[currentUser.role]?.canDelete;
  const tb = document.getElementById("eval-tbody");
  if (!evs.length) { tb.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text3)">Sin evaluaciones.</td></tr>`; return; }
  tb.innerHTML = evs.map(e => {
    const emp  = emps.find(x => x.id === e.empleadoId) || { nombre:"—", cargo:"—" };
    const done = Object.keys(e.respuestas||{}).length;
    const tot  = (e.evaluadores||[]).length;
    const pct  = tot ? Math.round(done / tot * 100) : 0;
    return `<tr>
      <td class="tdn">${e.nombre}</td>
      <td><span class="badge b${e.tipo}">${e.tipo}°</span></td>
      <td><div style="font-size:13px">${emp.nombre}</div><div style="font-size:11px;color:var(--text3)">${emp.cargo}</div></td>
      <td style="min-width:120px"><div class="pb" style="margin-bottom:4px"><div class="pf" style="width:${pct}%"></div></div><div style="font-size:11px;color:var(--text3)">${done}/${tot}</div></td>
      <td><span class="badge b${e.estado}">${e.estado}</span></td>
      <td><div style="display:flex;gap:6px">
        <button class="btn btn-g btn-sm" onclick="showPage(\'reportes\');loadReportById(\'${e.id}\')">Reporte</button>
        ${canDel ? `<button class="btn btn-del btn-sm" onclick="delEval(\'${e.id}\')">Eliminar</button>` : ""}
      </div></td>
    </tr>`;
  }).join("");
}

async function delEval(id) {
  if (!confirm("¿Eliminar esta evaluación?")) return;
  await dbDel("evaluaciones", id);
  toast("Evaluación eliminada");
  await loadEvalTable(); await loadDash();
}

// ── EMPLEADOS ────────────────────────────────────────
let allEmps = [];

async function loadEmpTable() { allEmps = await dbAll("empleados"); renderEmps(allEmps); }

function renderEmps(list) {
  const canDel = PERMS[currentUser.role]?.canDelete;
  const tb     = document.getElementById("emp-tbody");
  if (!list.length) { tb.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text3)">Sin empleados.</td></tr>`; return; }
  tb.innerHTML = list.map(e => {
    const ini = (e.nombre||"?").split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:10px">
        <div class="avatar">${ini}</div>
        <div><div class="tdn">${e.nombre}</div><div style="font-size:11px;color:var(--text3)">${e.nivel||""}</div></div>
      </div></td>
      <td>${e.cargo||"—"}</td><td>${e.area||"—"}</td>
      <td style="font-family:var(--mono);font-size:12px;color:var(--text3)">${e.email||"—"}</td>
      <td>${canDel ? `<button class="btn btn-del btn-sm" onclick="delEmp(\'${e.id}\')">Eliminar</button>` : ""}</td>
    </tr>`;
  }).join("");
}

function filterEmps() {
  const q = document.getElementById("emp-search").value.toLowerCase();
  renderEmps(allEmps.filter(e => e.nombre.toLowerCase().includes(q) || (e.cargo||"").toLowerCase().includes(q) || (e.area||"").toLowerCase().includes(q)));
}

async function delEmp(id) { if (!confirm("¿Eliminar empleado?")) return; await dbDel("empleados", id); toast("Empleado eliminado"); await loadEmpTable(); }

function openNewEmpleado() { loadJefeSelect(); openMo("mo-emp"); }

async function loadJefeSelect() {
  const emps = await dbAll("empleados");
  document.getElementById("emp-j").innerHTML = `<option value="">Sin jefe</option>` + emps.map(e => `<option value="${e.id}">${e.nombre}</option>`).join("");
}

async function saveEmp() {
  const n = gv("emp-n"); if (!n) { toast("El nombre es obligatorio", "err"); return; }
  await dbSet("empleados", genId("empleados"), { nombre:n, email:gv("emp-e"), cargo:gv("emp-c"), area:gv("emp-a"), jefeId:gv("emp-j"), nivel:gv("emp-l") });
  toast("Empleado guardado"); closeMo("mo-emp");
  await loadEmpTable(); await loadSelects();
  ["emp-n","emp-e","emp-c","emp-a"].forEach(id => document.getElementById(id).value = "");
}

// ── SELECTORS ───────────────────────────────────────
async function loadSelects() {
  const emps = await dbAll("empleados");
  document.getElementById("ev-emp").innerHTML = `<option value="">Selecciona...</option>` + emps.map(e => `<option value="${e.id}">${e.nombre} — ${e.cargo||""}</option>`).join("");
  const evs     = await dbAll("evaluaciones");
  const evalOpts = evs.map(e => `<option value="${e.id}">${e.nombre}</option>`).join("");
  document.getElementById("form-eval").innerHTML = `<option value="">— selecciona —</option>` + evalOpts;
  document.getElementById("rep-eval").innerHTML  = `<option value="">— selecciona —</option>` + evalOpts;
}

// ── WIZARD ──────────────────────────────────────────
let curStep = 1, comps = [];

function openNewEval() {
  curStep = 1; comps = [];
  document.getElementById("ev-nombre").value = "";
  document.getElementById("ev-tipo").value   = "360";
  document.getElementById("ev-emp").value    = "";
  updateWiz(); openMo("mo-eval");
}

function updateWiz() {
  [1,2,3].forEach(n => {
    document.getElementById("ws-" + n).style.display = n === curStep ? "block" : "none";
    const s = document.getElementById("step-" + n);
    s.className = "step" + (n === curStep ? " active" : n < curStep ? " done" : "");
  });
  document.getElementById("btn-prev").style.display = curStep > 1 ? "inline-flex" : "none";
  document.getElementById("btn-next").textContent   = curStep === 3 ? "✓ Crear evaluación" : "Siguiente →";
  if (curStep === 2) renderComps();
  if (curStep === 3) renderEvaluadores();
}

function renderComps() {
  document.getElementById("comp-list").innerHTML = comps.map((c,i) =>
    `<div class="ci"><span>${c}</span><button class="ci-rm" onclick="rmComp(${i})">✕</button></div>`
  ).join("") || `<p style="font-size:13px;color:var(--text3);padding:8px 0">Sin competencias.</p>`;
  document.getElementById("comp-sugg").innerHTML = COMP_SUGG.filter(s => !comps.includes(s))
    .map(s => `<button class="btn btn-g btn-sm" onclick="qComp(\'${s}\')">${s}</button>`).join("");
}

function addComp()  { const inp = document.getElementById("new-comp"); const v = inp.value.trim(); if (!v) return; if (!comps.includes(v)) comps.push(v); inp.value = ""; renderComps(); }
function qComp(c)   { if (!comps.includes(c)) { comps.push(c); renderComps(); } }
function rmComp(i)  { comps.splice(i, 1); renderComps(); }

async function renderEvaluadores() {
  const tipo = gv("ev-tipo"), empId = gv("ev-emp");
  const emps = await dbAll("empleados");
  const evaluado = emps.find(e => e.id === empId);
  let rows = [];
  if (evaluado) rows.push({ emp: evaluado, rel: "autoevaluacion" });
  if (evaluado?.jefeId) { const j = emps.find(e => e.id === evaluado.jefeId); if (j) rows.push({ emp: j, rel: "jefe" }); }
  if (tipo === "360") {
    emps.filter(e => e.jefeId === empId && e.id !== empId).slice(0,3).forEach(e => rows.push({ emp:e, rel:"subordinado" }));
    emps.filter(e => e.jefeId === evaluado?.jefeId && e.id !== empId && e.id !== evaluado?.jefeId).slice(0,3).forEach(e => rows.push({ emp:e, rel:"par" }));
  }
  document.getElementById("ev-list").innerHTML = rows.map(r => {
    const ini = (r.emp.nombre||"?").split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();
    return `<div class="er"><div class="avatar">${ini}</div><div class="er-i"><div class="er-n">${r.emp.nombre}</div><div class="er-r">${r.emp.cargo||""}</div></div><span class="badge b${r.rel==="jefe"?"90":r.rel==="autoevaluacion"?"180":"360"}">${r.rel}</span></div>`;
  }).join("");
  const info = { "90":"<strong>90°</strong> Solo el jefe.", "180":"<strong>180°</strong> Jefe + autoevaluación.", "360":"<strong>360°</strong> Jefe, pares, subordinados y autoevaluación." };
  document.getElementById("tipo-info").innerHTML = info[tipo] || "";
}

async function nextStep() {
  if (curStep === 1) { if (!gv("ev-nombre")) { toast("El nombre es obligatorio", "err"); return; } if (!gv("ev-emp")) { toast("Selecciona un empleado","err"); return; } }
  if (curStep === 2 && !comps.length) { toast("Agrega al menos una competencia","err"); return; }
  if (curStep === 3) { await createEval(); return; }
  curStep++; updateWiz();
}
function prevStep() { curStep--; updateWiz(); }

async function createEval() {
  const tipo = gv("ev-tipo"), empId = gv("ev-emp");
  const emps = await dbAll("empleados");
  const evaluado = emps.find(e => e.id === empId);
  let evList = [{ id:empId, relacion:"autoevaluacion" }];
  if (evaluado?.jefeId) evList.push({ id: evaluado.jefeId, relacion:"jefe" });
  if (tipo === "360") {
    emps.filter(e => e.jefeId === empId && e.id !== empId).slice(0,3).forEach(e => evList.push({ id:e.id, relacion:"subordinado" }));
    emps.filter(e => e.jefeId === evaluado?.jefeId && e.id !== empId && e.id !== evaluado?.jefeId).slice(0,3).forEach(e => evList.push({ id:e.id, relacion:"par" }));
  }
  const ev = { nombre:gv("ev-nombre"), tipo, empleadoId:empId, inicio:gv("ev-start"), cierre:gv("ev-end"), estado:"activa", competencias:[...comps], evaluadores:evList, respuestas:{}, creadoEn:new Date().toISOString() };
  await dbSet("evaluaciones", genId("evaluaciones"), ev);
  toast("Evaluación creada ✓"); closeMo("mo-eval");
  await loadEvalTable(); await loadDash(); await loadSelects();
}

// ── FORMULARIO ──────────────────────────────────────
async function loadForm() {
  const evalId = gv("form-eval"); if (!evalId) return;
  const [evs, emps] = await Promise.all([dbAll("evaluaciones"), dbAll("empleados")]);
  const ev  = evs.find(e => e.id === evalId); if (!ev) return;
  const emp = emps.find(e => e.id === ev.empleadoId) || { nombre:"—", cargo:"—" };
  document.getElementById("form-av").textContent      = (emp.nombre||"?").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
  document.getElementById("form-ev-name").textContent = emp.nombre;
  document.getElementById("form-ev-cargo").textContent= emp.cargo;
  document.getElementById("form-badge").innerHTML     = `<span class="badge b${ev.tipo}">${ev.tipo}°</span>`;
  document.getElementById("form-comps").innerHTML     = ev.competencias.map(c => {
    const ck = c.replace(/\s+/g, "_");
    return `<div class="lkg"><div class="lkq">${c}</div><div class="lko">
      ${[1,2,3,4,5].map(n => `<button class="lk" onclick="selLk(\'${ck}\',${n},this)" data-key="${ck}" data-val="${n}">
        <div style="font-size:18px;margin-bottom:2px">${["😞","😐","🙂","😊","🌟"][n-1]}</div>
        <div>${n}</div><div style="font-size:10px">${["Muy bajo","Bajo","Regular","Bueno","Excelente"][n-1]}</div>
      </button>`).join("")}
    </div></div>`;
  }).join("");
  document.getElementById("form-body").style.display = "block";
}

function selLk(key, val, btn) {
  document.querySelectorAll(`[data-key="${key}"]`).forEach(b => b.classList.remove("sel"));
  btn.classList.add("sel");
}

async function saveResponse() {
  const evalId = gv("form-eval"), rel = gv("form-rel");
  if (!evalId) { toast("Selecciona una evaluación","err"); return; }
  const evs = await dbAll("evaluaciones");
  const ev  = evs.find(e => e.id === evalId); if (!ev) return;
  const scores = {}; let ok = true;
  ev.competencias.forEach(c => {
    const key = c.replace(/\s+/g, "_");
    const sel = document.querySelector(`.lk.sel[data-key="${key}"]`);
    if (sel) scores[key] = parseInt(sel.dataset.val); else ok = false;
  });
  if (!ok) { toast("Responde todas las competencias","err"); return; }
  const resp = { ...(ev.respuestas||{}) };
  resp[rel + "_" + Date.now()] = { relacion:rel, scores, comentario: document.getElementById("form-comments").value, evaluadorId:currentUser.uid, fecha:new Date().toISOString() };
  await dbSet("evaluaciones", evalId, { ...ev, respuestas: resp });
  toast("Respuesta guardada ✓");
  document.getElementById("form-body").style.display = "none";
  document.getElementById("form-eval").value = "";
  await loadEvalTable(); await loadDash();
}

// ── REPORTES ────────────────────────────────────────
let ctRadar = null, ctFuentes = null;

async function loadReport() {
  const evalId = gv("rep-eval");
  if (!evalId) { document.getElementById("rep-body").style.display="none"; document.getElementById("rep-empty").style.display="block"; return; }
  await loadReportById(evalId);
}

async function loadReportById(evalId) {
  document.getElementById("rep-eval").value = evalId;
  const [evs, emps] = await Promise.all([dbAll("evaluaciones"), dbAll("empleados")]);
  const ev = evs.find(e => e.id === evalId); if (!ev) return;
  document.getElementById("rep-body").style.display  = "block";
  document.getElementById("rep-empty").style.display = "none";

  const rArr = Object.values(ev.respuestas||{});
  const cs   = ev.competencias;
  const avg  = {};
  cs.forEach(c => {
    const key  = c.replace(/\s+/g,"_");
    const vals = rArr.map(r => r.scores?.[key]).filter(v => v != null);
    avg[c] = vals.length ? vals.reduce((a,b) => a+b, 0) / vals.length : 0;
  });

  const globalScore = Object.values(avg).length
    ? (Object.values(avg).reduce((a,b) => a+b, 0) / Object.values(avg).length).toFixed(2)
    : "—";

  document.getElementById("rep-score").textContent = globalScore;
  const lbls = ["Insuficiente","Regular","Aceptable","Bueno","Sobresaliente"];
  document.getElementById("rep-label").textContent = globalScore === "—" ? "Sin respuestas" : lbls[Math.min(4, Math.floor(parseFloat(globalScore)-1))];

  const rCtx = document.getElementById("chartRadar").getContext("2d");
  if (ctRadar) ctRadar.destroy();
  ctRadar = new Chart(rCtx, {
    type:"radar",
    data:{ labels:cs, datasets:[{ label:"Promedio", data:cs.map(c=>avg[c]), backgroundColor:"rgba(108,99,255,.15)", borderColor:"#6c63ff", pointBackgroundColor:"#a78bfa", borderWidth:2 }] },
    options:{ responsive:true, maintainAspectRatio:false, scales:{ r:{ min:0, max:5, ticks:{stepSize:1,color:"#606080",font:{size:11}}, grid:{color:"rgba(255,255,255,.07)"}, pointLabels:{color:"#9090b0",font:{size:11,family:"DM Sans"}} } }, plugins:{legend:{display:false}} },
  });

  const fuentes   = ["jefe","autoevaluacion","par","subordinado","cliente"];
  const fLbls     = ["Jefe","Auto","Pares","Subordinados","Clientes"];
  const fColors   = ["#60a5fa","#a78bfa","#34d399","#fbbf24","#f87171"];
  const fData     = fuentes.map(f => {
    const rs  = rArr.filter(r => r.relacion === f);
    if (!rs.length) return null;
    const all = rs.flatMap(r => Object.values(r.scores||{}));
    return all.length ? +(all.reduce((a,b)=>a+b,0)/all.length).toFixed(2) : null;
  });
  const fCtx = document.getElementById("chartFuentes").getContext("2d");
  if (ctFuentes) ctFuentes.destroy();
  ctFuentes = new Chart(fCtx, {
    type:"bar",
    data:{ labels:fLbls.filter((_,i)=>fData[i]!=null), datasets:[{ data:fData.filter(v=>v!=null), backgroundColor:fColors.filter((_,i)=>fData[i]!=null), borderRadius:6, borderSkipped:false }] },
    options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{min:0,max:5,grid:{color:"rgba(255,255,255,.05)"},ticks:{color:"#606080",font:{size:11}}}, x:{grid:{display:false},ticks:{color:"#9090b0",font:{size:12,family:"DM Sans"}}} }, plugins:{legend:{display:false}} },
  });

  document.getElementById("rep-detail").innerHTML = cs.map(c => {
    const a = avg[c], pct = a / 5 * 100;
    const col = a >= 4 ? "var(--green)" : a >= 3 ? "var(--amber)" : "var(--red)";
    return `<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="font-size:13px">${c}</span><span style="font-size:13px;font-weight:500;color:${col}">${a.toFixed(1)}</span></div><div class="pb"><div class="pf" style="width:${pct}%;background:${col}"></div></div></div>`;
  }).join("");

  document.getElementById("rep-respondents").innerHTML = (ev.evaluadores||[]).map(ev2 => {
    const emp  = emps.find(e => e.id === ev2.id) || { nombre:"—" };
    const done = rArr.some(r => r.relacion === ev2.relacion);
    return `<div class="ri"><div class="rd ${done?"done":"pend"}"></div><div style="flex:1"><div style="font-size:13px">${emp.nombre}</div><div style="font-size:11px;color:var(--text3)">${ev2.relacion}</div></div><span style="font-size:11px;color:var(--text3)">${done?"Completado":"Pendiente"}</span></div>`;
  }).join("");
}

// ── USUARIOS ────────────────────────────────────────
async function loadUsers() {
  let users = [];
  if (demoMode) { users = DEMO.users; }
  else { const snap = await db.collection("users").get(); users = snap.docs.map(d => ({ uid:d.id, ...d.data() })); }

  const ul = document.getElementById("users-list");
  if (!users.length) { ul.innerHTML = `<p style="color:var(--text3);font-size:14px">Sin usuarios.</p>`; return; }
  ul.innerHTML = users.map(u => {
    const ini  = (u.name||u.email||"?").split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();
    const role = u.role || "evaluador";
    return `<div class="uc">
      <div class="avatar">${ini}</div>
      <div class="uc-i"><div class="uc-n">${u.name||"Sin nombre"}</div><div class="uc-e">${u.email||"—"}</div></div>
      <span class="rp ${ROLE_CLASSES[role]}">${ROLE_LABELS[role]}</span>
      ${currentUser.uid !== u.uid
        ? `<button class="btn btn-g btn-sm" onclick="openEditRole(\'${u.uid}\',\'${(u.name||"").replace(/'/g,"\\'")}\',\'${role}\')">Cambiar rol</button>`
        : `<span style="font-size:12px;color:var(--text3);padding:6px 8px">Tú</span>`}
    </div>`;
  }).join("");
}

function openEditRole(uid, name, role) {
  document.getElementById("role-uid").value = uid;
  document.getElementById("role-uname").textContent = "Usuario: " + name;
  document.getElementById("role-sel").value = role;
  openMo("mo-role");
}

async function saveRole() {
  const uid  = document.getElementById("role-uid").value;
  const role = gv("role-sel");
  if (demoMode) { const u = DEMO.users.find(x => x.uid === uid); if (u) u.role = role; }
  else { await db.collection("users").doc(uid).set({ role }, { merge: true }); }
  toast("Rol actualizado"); closeMo("mo-role"); await loadUsers();
}

// ── INIT ────────────────────────────────────────────
(function initDates() {
  const hoy = new Date();
  const fmt  = d => d.toISOString().split("T")[0];
  document.getElementById("ev-start").value = fmt(hoy);
  const cierre = new Date(hoy); cierre.setDate(cierre.getDate() + 30);
  document.getElementById("ev-end").value = fmt(cierre);
})();
