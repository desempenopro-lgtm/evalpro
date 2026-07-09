// ═══════════════════════════════════════════════════
//  EvalPro — app.js
//  Requiere: Firebase compat (app, auth, firestore)
//            Chart.js
// ═══════════════════════════════════════════════════

// ── STATE ──────────────────────────────────────────
let db = null, auth = null, demoMode = false, currentUser = null;

// ── TEXTOS DEL SISTEMA ─────────────────────────────
const TEXT_DEFAULTS = {
  appName:         "EvalPro",
  appTagline:      "Sistema de evaluaciones 360° · 180° · 90°",
  logoUrl:         "",          // URL de imagen de logo (opcional)
  accentColor:     "#6c63ff",   // color principal
  loginTitle:      "Iniciar sesión",
  loginSubtitle:   "Acceso restringido — contacta al administrador para obtener credenciales",
  navDashboard:    "Dashboard",
  navEvaluaciones: "Evaluaciones",
  navEmpleados:    "Empleados",
  navFormulario:   "Formulario",
  navReportes:     "Reportes",
  navUsuarios:     "Usuarios",
  compSugg:        "Liderazgo,Comunicación efectiva,Orientación a resultados,Trabajo en equipo,Innovación,Gestión del tiempo,Adaptabilidad,Resolución de problemas,Pensamiento estratégico,Orientación al cliente",
};
let TEXTS = { ...TEXT_DEFAULTS };

async function loadTexts() {
  if (demoMode) return;
  try {
    const doc = await db.collection("config").doc("texts").get();
    if (doc.exists) TEXTS = { ...TEXT_DEFAULTS, ...doc.data() };
  } catch(e) {}
  applyTexts();
}

function applyTexts() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  // App name + tagline
  document.querySelectorAll(".logo-mark").forEach(el => el.textContent = TEXTS.appName);
  document.querySelectorAll(".auth-logo").forEach(el => el.textContent = TEXTS.appName);
  document.querySelectorAll(".auth-tagline").forEach(el => el.textContent = TEXTS.appTagline);
  set("auth-tagline-text", TEXTS.appTagline);
  const logoText = document.getElementById("auth-logo-text");
  if (logoText) logoText.textContent = TEXTS.appName;

  // Logo image (if set)
  const logoImg = document.getElementById("auth-logo-img");
  if (logoImg) {
    if (TEXTS.logoUrl) {
      logoImg.src = TEXTS.logoUrl;
      logoImg.style.display = "block";
      if (logoText) logoText.style.display = "none";
    } else {
      logoImg.style.display = "none";
      if (logoText) logoText.style.display = "block";
    }
  }

  // Accent color
  if (TEXTS.accentColor) {
    document.documentElement.style.setProperty("--accent",  TEXTS.accentColor);
    document.documentElement.style.setProperty("--accent2", TEXTS.accentColor + "cc");
  }

  // Login texts
  set("auth-login-title",    TEXTS.loginTitle);
  set("auth-login-subtitle", TEXTS.loginSubtitle);

  // Nav labels
  set("nav-label-dashboard",    TEXTS.navDashboard);
  set("nav-label-evaluaciones", TEXTS.navEvaluaciones);
  set("nav-label-empleados",    TEXTS.navEmpleados);
  set("nav-label-formulario",   TEXTS.navFormulario);
  set("nav-label-reportes",     TEXTS.navReportes);
  set("nav-label-usuarios",     TEXTS.navUsuarios);
}

async function saveTexts(updated) {
  TEXTS = { ...TEXTS, ...updated };
  if (!demoMode) await db.collection("config").doc("texts").set(TEXTS, { merge: true });
  applyTexts();
  toast("Textos guardados ✓");
}

// ── FIREBASE CONFIG (hardcoded) ────────────────────
const FB_CONFIG = {
  apiKey:            "AIzaSyCcEebYnpqnq2Hm6sg8bP9rCDLB8JmoPTY",
  authDomain:        "evaluaciones-76787.firebaseapp.com",
  projectId:         "evaluaciones-76787",
  storageBucket:     "evaluaciones-76787.firebasestorage.app",
  messagingSenderId: "990605248069",
  appId:             "1:990605248069:web:fed93888e3c5f6a3b8852c"
};

// Unused stubs kept for compat
function saveCfg(cfg) {}
function loadCfg()    { return null; }
function clearCfg()   {}

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
  admin:     { dashboard:1, evaluaciones:1, empleados:1, formulario:1, reportes:1, usuarios:1, empresas:1, canCreate:1, canDelete:1 },
  rrhh:      { dashboard:1, evaluaciones:1, empleados:1, formulario:1, reportes:1, usuarios:0, empresas:1, canCreate:1, canDelete:0 },
  evaluador: { dashboard:1, evaluaciones:0, empleados:0, formulario:1, reportes:0, usuarios:0, empresas:0, canCreate:0, canDelete:0 },
  evaluado:  { dashboard:1, evaluaciones:0, empleados:0, formulario:0, reportes:1, usuarios:0, empresas:0, canCreate:0, canDelete:0 },
};
const COMP_SUGG = ["Liderazgo","Comunicación efectiva","Orientación a resultados","Trabajo en equipo",
  "Innovación","Gestión del tiempo","Adaptabilidad","Resolución de problemas","Pensamiento estratégico","Orientación al cliente"];

// ── FIREBASE INIT ───────────────────────────────────
function gv(id) { return (document.getElementById(id)||{}).value || ""; }

// Auto-initialize Firebase on page load — no config form needed
document.addEventListener("DOMContentLoaded", function() {
  try {
    if (!firebase.apps.length) firebase.initializeApp(FB_CONFIG);
    db   = firebase.firestore();
    auth = firebase.auth();
    auth.onAuthStateChanged(handleAuth);
    // Hide config step, show login directly
    const cfgStep   = document.getElementById("cfg-step");
    const loginStep = document.getElementById("login-step");
    if (cfgStep)   cfgStep.style.display   = "none";
    if (loginStep) loginStep.style.display = "block";
    applyInviteCredentials();
  } catch(e) {
    console.error("Firebase init error:", e);
  }
});

// Kept for compat (no longer called from UI)
function initFirebase() {}

function useDemoMode() {
  demoMode = true;
  currentUser = { uid:"u1", name:"María Rodríguez", email:"admin@empresa.com", role:"admin" };
  enterApp();
}

function openCreateUser() {
  resetCreateUser();
  openMo("mo-create-user");
}

async function handleAuth(fbUser) {
  if (!fbUser) return;
  try {
    const doc  = await db.collection("users").doc(fbUser.uid).get();
    const data = doc.exists ? doc.data() : {};
    currentUser = { uid: fbUser.uid, name: data.name || fbUser.displayName || fbUser.email, email: fbUser.email, role: data.role || "evaluador", empresaId: data.empresaId || "" };
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

async function doGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const cr       = await auth.signInWithPopup(provider);
    const doc      = await db.collection("users").doc(cr.user.uid).get();
    // Google login only works if the user was pre-created by admin
    if (!doc.exists) {
      await auth.signOut();
      showAErr("Tu cuenta no está registrada. Contacta al administrador.");
      return;
    }
  } catch(e) { showAErr(fErr(e)); }
}

function doLogout() {
  if (demoMode) { location.reload(); return; }
  auth.signOut().then(() => location.reload());
}

function forgetConfig() {
  if (!confirm("¿Olvidar la configuración de Firebase? Se pedirá nuevamente al recargar.")) return;
  clearCfg();
  location.reload();
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
  loadTexts(); // load editable texts from Firebase
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

  const navMap = { "ni-evaluaciones":"evaluaciones", "ni-empleados":"empleados", "ni-formulario":"formulario", "ni-reportes":"reportes", "ni-usuarios":"usuarios", "ni-empresas":"empresas" };
  Object.entries(navMap).forEach(([navId, perm]) => {
    const el = document.getElementById(navId);
    if (el) el.classList.toggle("hid", !p[perm]);
  });
  document.getElementById("ni-sec-admin").classList.toggle("hid", !p.usuarios);

  ["btn-new-eval","btn-ev-new","btn-emp-new","btn-emp-import"].forEach(id => {
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
  await Promise.all([loadDash(), loadEvalTable(), loadEmpTable(), loadSelects(), loadEmpresasSelect()]);
  if ((PERMS[currentUser.role] || {}).usuarios)  await loadUsers();
  if ((PERMS[currentUser.role] || {}).empresas)  await loadEmpresasTable();
}

// ── TEXTOS EDITABLES (admin) ────────────────────────
function syncColorPicker(hex) {
  // Keep color picker and hex input in sync
  const picker = document.getElementById("tx-accentColor");
  if (picker && /^#[0-9a-fA-F]{6}$/.test(hex)) picker.value = hex;
}

function openTextos() {
  Object.keys(TEXT_DEFAULTS).forEach(k => {
    const el = document.getElementById("tx-" + k);
    if (el) el.value = TEXTS[k] || TEXT_DEFAULTS[k];
  });
  // Sync color picker
  const picker = document.getElementById("tx-accentColor");
  const hexInp = document.getElementById("tx-accentHex");
  const color  = TEXTS.accentColor || TEXT_DEFAULTS.accentColor;
  if (picker) picker.value = color;
  if (hexInp) hexInp.value = color;
  // Wire color picker -> hex input live
  if (picker) picker.oninput = () => { if (hexInp) hexInp.value = picker.value; };
  openMo("mo-textos");
}

async function saveTextosForm() {
  const updated = {};
  Object.keys(TEXT_DEFAULTS).forEach(k => {
    const el = document.getElementById("tx-" + k);
    if (el) updated[k] = el.value.trim() || TEXT_DEFAULTS[k];
  });
  // Merge color from either picker or hex input
  const picker = document.getElementById("tx-accentColor");
  const hexInp = document.getElementById("tx-accentHex");
  const hexVal = hexInp?.value.trim();
  if (hexVal && /^#[0-9a-fA-F]{6}$/.test(hexVal)) updated.accentColor = hexVal;
  else if (picker) updated.accentColor = picker.value;
  await saveTexts(updated);
  closeMo("mo-textos");
}

function resetTextos() {
  Object.keys(TEXT_DEFAULTS).forEach(k => {
    const el = document.getElementById("tx-" + k);
    if (el) el.value = TEXT_DEFAULTS[k];
  });
  const picker = document.getElementById("tx-accentColor");
  const hexInp = document.getElementById("tx-accentHex");
  if (picker) picker.value = TEXT_DEFAULTS.accentColor;
  if (hexInp) hexInp.value = TEXT_DEFAULTS.accentColor;
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
  const [evs, emps, empresas] = await Promise.all([dbAll("evaluaciones"), dbAll("empleados"), dbAll("empresas")]);
  // Filter by empresa for restricted roles
  const userEmpresaId = currentUser?.empresaId || "";
  const role = currentUser?.role;
  const filtEvs = (role === "evaluado" || role === "evaluador") && userEmpresaId
    ? evs.filter(e => e.empresaId === userEmpresaId) : evs;
  const canDel = PERMS[currentUser.role]?.canDelete;
  const tb = document.getElementById("eval-tbody");
  if (!filtEvs.length) { tb.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text3)">Sin evaluaciones.</td></tr>`; return; }
  tb.innerHTML = filtEvs.map(e => {
    const emp  = emps.find(x => x.id === e.empleadoId) || { nombre:"—", cargo:"—" };
    const done = Object.keys(e.respuestas||{}).length;
    const tot  = (e.evaluadores||[]).length;
    const pct  = tot ? Math.round(done / tot * 100) : 0;
    const empEmpresa = empresas.find(x => x.id === e.empresaId);
    return `<tr>
      <td class="tdn">${e.nombre}</td>
      <td style="font-size:12px;color:var(--text2)">${empEmpresa ? empEmpresa.nombre : "—"}</td>
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
  await dbSet("empleados", genId("empleados"), { nombre:n, email:gv("emp-e"), cargo:gv("emp-c"), area:gv("emp-a"), jefeId:gv("emp-j"), nivel:gv("emp-l"), empresaId:gv("emp-empresa") });
  toast("Empleado guardado"); closeMo("mo-emp");
  await loadEmpTable(); await loadSelects();
  ["emp-n","emp-e","emp-c","emp-a"].forEach(id => document.getElementById(id).value = "");
}

// ── IMPORTACIÓN MASIVA ──────────────────────────────
// Columnas aceptadas (case-insensitive, con variantes en español e inglés)
const COL_MAP = {
  nombre:   ["nombre","name","nombre completo","full name","empleado"],
  email:    ["email","correo","mail","correo electrónico","e-mail"],
  cargo:    ["cargo","puesto","posición","position","job title","título"],
  area:     ["área","area","departamento","department","depto"],
  nivel:    ["nivel","level","jerarquía","hierarchy","rango"],
  jefeNombre:["jefe","jefe directo","manager","supervisor","reporta a","reports to"],
};

let importPreview = []; // rows parsed, pending confirmation

function openImport() { openMo("mo-import"); resetImport(); }

function resetImport() {
  document.getElementById("import-input").value = "";
  document.getElementById("import-preview").style.display = "none";
  document.getElementById("import-dropzone").style.display = "flex";
  document.getElementById("import-error").style.display   = "none";
  document.getElementById("btn-confirm-import").style.display = "none";
  importPreview = [];
}

function handleImportDrop(e) {
  e.preventDefault();
  document.getElementById("import-dropzone").classList.remove("dz-over");
  const file = e.dataTransfer?.files[0] || e.target.files[0];
  if (file) processImportFile(file);
}

function processImportFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (!["csv","xlsx","xls"].includes(ext)) {
    showImportErr("Formato no soportado. Usa .xlsx, .xls o .csv"); return;
  }
  const reader = new FileReader();
  if (ext === "csv") {
    reader.onload = e => parseCSV(e.target.result);
    reader.readAsText(file, "UTF-8");
  } else {
    reader.onload = e => parseXLSX(e.target.result);
    reader.readAsArrayBuffer(file);
  }
}

function parseCSV(text) {
  // Detect delimiter: comma or semicolon
  const delim = (text.split(";").length > text.split(",").length) ? ";" : ",";
  const lines  = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) { showImportErr("El archivo está vacío o solo tiene encabezados"); return; }
  const headers = lines[0].split(delim).map(h => h.trim().replace(/^"|"$/g,"").toLowerCase());
  const rows    = lines.slice(1).map(line => {
    const cols = line.split(delim).map(c => c.trim().replace(/^"|"$/g,""));
    const obj  = {};
    headers.forEach((h, i) => obj[h] = cols[i] || "");
    return obj;
  });
  buildPreview(headers, rows);
}

function parseXLSX(buffer) {
  if (typeof XLSX === "undefined") {
    showImportErr("Librería XLSX no cargada. Usa CSV o recarga la página."); return;
  }
  const wb   = XLSX.read(buffer, { type:"array" });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { defval:"" });
  if (!data.length) { showImportErr("La hoja está vacía"); return; }
  const headers = Object.keys(data[0]).map(h => h.toLowerCase().trim());
  const rows    = data.map(r => {
    const obj = {};
    Object.entries(r).forEach(([k,v]) => obj[k.toLowerCase().trim()] = String(v||"").trim());
    return obj;
  });
  buildPreview(headers, rows);
}

function resolveCol(headers, fieldKey) {
  // Returns the raw header name that matches this field
  const aliases = COL_MAP[fieldKey] || [];
  return headers.find(h => aliases.includes(h.toLowerCase())) || null;
}

function buildPreview(headers, rows) {
  // Map columns
  const colKeys  = Object.keys(COL_MAP);
  const resolved = {};
  colKeys.forEach(k => { resolved[k] = resolveCol(headers, k); });

  if (!resolved.nombre) { showImportErr(`No encontré la columna "Nombre". Encabezados detectados: ${headers.join(", ")}`); return; }

  // Parse rows → empleado objects
  importPreview = rows
    .filter(r => (r[resolved.nombre]||"").trim())
    .map((r, i) => ({
      _row:       i + 2,
      nombre:     (r[resolved.nombre]      ||"").trim(),
      email:      (r[resolved.email]       ||"").trim().toLowerCase(),
      cargo:      (r[resolved.cargo]       ||"").trim(),
      area:       (r[resolved.area]        ||"").trim(),
      nivel:      normalizeNivel((r[resolved.nivel]||"").trim()),
      jefeNombre: (r[resolved.jefeNombre]  ||"").trim(),
    }));

  if (!importPreview.length) { showImportErr("No se encontraron filas con datos válidos"); return; }

  renderImportPreview(resolved);
}

function normalizeNivel(v) {
  const vl = v.toLowerCase();
  if (vl.includes("vp") || vl.includes("c-level") || vl.includes("clevel") || vl.includes("director")) return "director";
  if (vl.includes("gerente") || vl.includes("manager"))  return "gerente";
  if (vl.includes("coord") || vl.includes("supervis"))   return "coordinador";
  if (vl.includes("analista") || vl.includes("profesional") || vl.includes("senior") || vl.includes("junior")) return "analista";
  if (vl.includes("operativo") || vl.includes("auxiliar") || vl.includes("asistente")) return "operativo";
  return v || "analista";
}

function renderImportPreview(resolved) {
  document.getElementById("import-dropzone").style.display = "none";
  document.getElementById("import-error").style.display   = "none";

  const colStatus = Object.entries(COL_MAP).map(([k, aliases]) => {
    const found = resolved[k];
    const icon  = found ? "✓" : (k === "nombre" ? "✗" : "—");
    const color = found ? "var(--green)" : (k === "nombre" ? "var(--red)" : "var(--text3)");
    return `<span style="font-size:12px;padding:2px 8px;border-radius:10px;background:var(--bg3);color:${color}">${icon} ${k}</span>`;
  }).join("");

  const previewRows = importPreview.slice(0, 8).map(e => `
    <tr>
      <td style="padding:8px 10px;font-size:13px;font-weight:500;color:var(--text)">${e.nombre}</td>
      <td style="padding:8px 10px;font-size:12px;color:var(--text3);font-family:var(--mono)">${e.email||"—"}</td>
      <td style="padding:8px 10px;font-size:13px">${e.cargo||"—"}</td>
      <td style="padding:8px 10px;font-size:13px">${e.area||"—"}</td>
      <td style="padding:8px 10px;font-size:12px;color:var(--text3)">${e.nivel||"—"}</td>
      <td style="padding:8px 10px;font-size:12px;color:var(--text3)">${e.jefeNombre||"—"}</td>
    </tr>`).join("");

  const more = importPreview.length > 8
    ? `<tr><td colspan="6" style="padding:8px 10px;font-size:12px;color:var(--text3);text-align:center">... y ${importPreview.length - 8} empleados más</td></tr>`
    : "";

  document.getElementById("import-preview").innerHTML = `
    <div style="margin-bottom:14px">
      <div style="font-size:13px;font-weight:500;margin-bottom:8px">Columnas detectadas:</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${colStatus}</div>
    </div>
    <div style="font-size:13px;font-weight:500;margin-bottom:8px">
      Vista previa — <span style="color:var(--accent)">${importPreview.length} empleados</span> a importar
    </div>
    <div style="overflow-x:auto;border-radius:8px;border:1px solid var(--border)">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:var(--bg3)">
            <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text3);text-align:left">Nombre</th>
            <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text3);text-align:left">Email</th>
            <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text3);text-align:left">Cargo</th>
            <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text3);text-align:left">Área</th>
            <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text3);text-align:left">Nivel</th>
            <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text3);text-align:left">Jefe</th>
          </tr>
        </thead>
        <tbody>${previewRows}${more}</tbody>
      </table>
    </div>`;
  document.getElementById("import-preview").style.display       = "block";
  document.getElementById("btn-confirm-import").style.display   = "inline-flex";
}

async function confirmImport() {
  if (!importPreview.length) return;
  const btn = document.getElementById("btn-confirm-import");
  btn.disabled = true;
  btn.textContent = "Importando...";

  try {
    // First pass: save all without jefeId so we can resolve names → IDs
    const saved = [];
    for (const emp of importPreview) {
      const id = genId("empleados");
      await dbSet("empleados", id, { nombre:emp.nombre, email:emp.email, cargo:emp.cargo, area:emp.area, nivel:emp.nivel, jefeId:"", empresaId:gv("emp-empresa")||"" });
      saved.push({ ...emp, id });
    }
    // Second pass: resolve jefe names → IDs and update
    for (const emp of saved) {
      if (!emp.jefeNombre) continue;
      const jefe = saved.find(x => x.nombre.toLowerCase() === emp.jefeNombre.toLowerCase())
                || (await dbAll("empleados")).find(x => x.nombre.toLowerCase() === emp.jefeNombre.toLowerCase());
      if (jefe) await dbSet("empleados", emp.id, { jefeId: jefe.id || jefe.uid });
    }

    toast(`${importPreview.length} empleados importados ✓`);
    closeMo("mo-import");
    await loadEmpTable();
    await loadSelects();
  } catch(e) {
    showImportErr("Error al guardar: " + e.message);
    btn.disabled = false;
    btn.textContent = "Confirmar importación";
  }
}

function showImportErr(msg) {
  const el = document.getElementById("import-error");
  el.textContent = msg; el.style.display = "block";
}

function downloadTemplate() {
  const csv = "Nombre,Email,Cargo,Área,Nivel,Jefe directo\nAna García,ana@empresa.com,Gerente de Marketing,Mercadeo,gerente,Carlos López\nCarlos López,carlos@empresa.com,Director Comercial,Ventas,director,\nLaura Rincón,laura@empresa.com,Analista de Datos,BI,analista,Ana García\n";
  const blob = new Blob(["\uFEFF" + csv], { type:"text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "plantilla_empleados.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ── SELECTORS ───────────────────────────────────────
async function loadSelects() {
  // Empresas selectors (wizard, create user, bulk import, reportes)
  const empresas    = await dbAll("empresas");
  const empresaOpts = `<option value="">— sin empresa —</option>` + empresas.map(e => `<option value="${e.id}">${e.nombre}</option>`).join("");
  ["ev-empresa","cu-empresa","bu-empresa","rep-empresa"].forEach(id => {
    const el = document.getElementById(id); if (el) el.innerHTML = empresaOpts;
  });

  // Empleados — filtered by selected empresa in wizard, or all
  const empresaId = gv("ev-empresa");
  const allEmps   = await dbAll("empleados");
  const filtEmps  = empresaId ? allEmps.filter(e => e.empresaId === empresaId) : allEmps;
  document.getElementById("ev-emp").innerHTML = `<option value="">Selecciona...</option>` +
    filtEmps.map(e => `<option value="${e.id}">${e.nombre} — ${e.cargo||""}</option>`).join("");

  // Evaluaciones — filtered by current user's empresa if evaluado/evaluador
  const role = currentUser?.role;
  const userEmpresaId = currentUser?.empresaId || "";
  const evs = await dbAll("evaluaciones");
  const filtEvs = (role === "evaluado" || role === "evaluador") && userEmpresaId
    ? evs.filter(e => e.empresaId === userEmpresaId)
    : evs;
  const evalOpts = filtEvs.map(e => `<option value="${e.id}">${e.nombre}</option>`).join("");
  document.getElementById("form-eval").innerHTML = `<option value="">— selecciona —</option>` + evalOpts;
  document.getElementById("rep-eval").innerHTML  = `<option value="">— selecciona —</option>` + evalOpts;
}

function onEvalEmpresaChange() {
  // When empresa changes in wizard, reload empleados dropdown filtered
  loadSelects();
}

// ── WIZARD ──────────────────────────────────────────
let curStep = 1, comps = [];

function openNewEval() {
  curStep = 1; comps = [];
  document.getElementById("ev-nombre").value  = "";
  document.getElementById("ev-tipo").value    = "360";
  document.getElementById("ev-emp").value     = "";
  document.getElementById("ev-empresa").value = "";
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
  const ev = { nombre:gv("ev-nombre"), tipo, empleadoId:empId, empresaId:gv("ev-empresa"), inicio:gv("ev-start"), cierre:gv("ev-end"), estado:"activa", competencias:[...comps], evaluadores:evList, respuestas:{}, creadoEn:new Date().toISOString() };
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
  document.getElementById("rep-body").style.display      = "block";
  document.getElementById("rep-empty").style.display     = "none";
  document.getElementById("rep-export-btns").style.display = "flex";

  const rArr = Object.values(ev.respuestas||{});
  const cs   = ev.competencias;
  const avg  = {};
  cs.forEach(c => {
    const key  = c.replace(/[\s]+/g,"_");
    const vals = rArr.map(r => r.scores?.[key] ?? r.scores?.[c]).filter(v => v != null);
    avg[c] = vals.length ? vals.reduce((a,b) => a+b, 0) / vals.length : 0;
  });

  const globalScore = Object.values(avg).length
    ? (Object.values(avg).reduce((a,b) => a+b, 0) / Object.values(avg).length).toFixed(2)
    : "—";

  // Store for PDF/Excel export
  currentReportData = { ev, emps, avg, globalScore, rArr };

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

function togglePassVis() {
  const inp  = document.getElementById("cu-pass");
  const icon = document.getElementById("eye-icon");
  if (inp.type === "password") {
    inp.type = "text";
    icon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`;
  } else {
    inp.type = "password";
    icon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  }
}

// ── CARGA MASIVA DE USUARIOS ────────────────────────
const VALID_ROLES   = ["admin","rrhh","evaluador","evaluado"];
const ROLE_ALIASES  = {
  "administrador":"admin","administrator":"admin",
  "recursos humanos":"rrhh","hr":"rrhh","human resources":"rrhh",
  "evaluator":"evaluador","respondiente":"evaluador",
  "evaluated":"evaluado","evaluatee":"evaluado",
};

let bulkUsersPreview = [];   // parsed rows ready to confirm
let bulkUsersResults = [];   // created users with links (for Excel download)

function openBulkUsers() {
  resetBulkUsers();
  openMo("mo-bulk-users");
}

function resetBulkUsers() {
  bulkUsersPreview = [];
  bulkUsersResults = [];
  document.getElementById("bu-input").value         = "";
  document.getElementById("bu-dropzone").style.display   = "flex";
  document.getElementById("bu-error").style.display      = "none";
  document.getElementById("bu-preview").style.display    = "none";
  document.getElementById("bu-step-upload").style.display   = "block";
  document.getElementById("bu-step-progress").style.display = "none";
  document.getElementById("bu-step-result").style.display   = "none";
  document.getElementById("btn-bu-confirm").style.display   = "none";
  document.getElementById("bu-modal-title").textContent     = "Carga masiva de usuarios";
}

function handleBulkUsersDrop(e) {
  e.preventDefault();
  document.getElementById("bu-dropzone").classList.remove("dz-over");
  const file = e.dataTransfer?.files[0] || e.target.files[0];
  if (file) processBulkUsersFile(file);
}

function processBulkUsersFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (!["csv","xlsx","xls"].includes(ext)) {
    showBuError("Formato no soportado. Usa .xlsx, .xls o .csv"); return;
  }
  const reader = new FileReader();
  if (ext === "csv") {
    reader.onload = e => parseBulkUsersCSV(e.target.result);
    reader.readAsText(file, "UTF-8");
  } else {
    reader.onload = e => parseBulkUsersXLSX(e.target.result);
    reader.readAsArrayBuffer(file);
  }
}

function parseBulkUsersCSV(text) {
  const delim = text.split(";").length > text.split(",").length ? ";" : ",";
  const lines  = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) { showBuError("Archivo vacío o sin datos"); return; }
  const headers = lines[0].split(delim).map(h => h.trim().replace(/^"|"$/g,"").toLowerCase());
  const rows    = lines.slice(1).map(line => {
    const cols = line.split(delim).map(c => c.trim().replace(/^"|"$/g,""));
    const obj  = {};
    headers.forEach((h, i) => obj[h] = cols[i] || "");
    return obj;
  });
  buildBulkUsersPreview(headers, rows);
}

function parseBulkUsersXLSX(buffer) {
  if (typeof XLSX === "undefined") { showBuError("Librería XLSX no disponible. Usa CSV."); return; }
  const wb   = XLSX.read(buffer, { type:"array" });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { defval:"" });
  if (!data.length) { showBuError("La hoja está vacía"); return; }
  const headers = Object.keys(data[0]).map(h => h.toLowerCase().trim());
  const rows    = data.map(r => {
    const obj = {};
    Object.entries(r).forEach(([k,v]) => obj[k.toLowerCase().trim()] = String(v||"").trim());
    return obj;
  });
  buildBulkUsersPreview(headers, rows);
}

function resolveUserCol(headers, aliases) {
  return headers.find(h => aliases.includes(h)) || null;
}

function normalizeRole(raw) {
  const v = (raw||"").toLowerCase().trim();
  if (VALID_ROLES.includes(v)) return v;
  return ROLE_ALIASES[v] || "evaluador"; // default
}

function generatePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$";
  let pass = "";
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

function buildBulkUsersPreview(headers, rows) {
  const colNombre = resolveUserCol(headers, ["nombre","name","nombre completo","full name","empleado"]);
  const colEmail  = resolveUserCol(headers, ["email","correo","mail","correo electrónico","e-mail"]);
  const colRol    = resolveUserCol(headers, ["rol","role","perfil","tipo","tipo usuario"]);

  if (!colEmail) { showBuError(`No encontré columna "Email". Columnas detectadas: ${headers.join(", ")}`); return; }

  bulkUsersPreview = rows
    .filter(r => (r[colEmail]||"").trim())
    .map((r, i) => {
      const email = (r[colEmail]||"").trim().toLowerCase();
      const name  = colNombre ? (r[colNombre]||"").trim() : email.split("@")[0];
      const role  = normalizeRole(colRol ? r[colRol] : "evaluador");
      const pass  = generatePassword();
      return { _row: i+2, name, email, role, pass, _status:"pending" };
    });

  if (!bulkUsersPreview.length) { showBuError("No se encontraron filas con email válido"); return; }

  // Check for duplicate emails in file
  const emails = bulkUsersPreview.map(u => u.email);
  const dupes  = emails.filter((e, i) => emails.indexOf(e) !== i);
  if (dupes.length) {
    showBuError(`Emails duplicados en el archivo: ${[...new Set(dupes)].join(", ")}`); return;
  }

  renderBulkUsersPreview();
}

function renderBulkUsersPreview() {
  document.getElementById("bu-error").style.display = "none";
  const total   = bulkUsersPreview.length;
  const preview = bulkUsersPreview.slice(0, 6);
  const more    = total > 6 ? `<tr><td colspan="3" style="padding:8px 10px;font-size:12px;color:var(--text3);text-align:center">... y ${total-6} usuarios más</td></tr>` : "";

  const roleColors = { admin:"var(--red)", rrhh:"var(--accent)", evaluador:"var(--blue)", evaluado:"var(--green)" };

  document.getElementById("bu-preview").innerHTML = `
    <div style="font-size:13px;font-weight:500;margin-bottom:10px">
      Vista previa — <span style="color:var(--accent)">${total} usuarios</span> a crear
    </div>
    <div style="overflow-x:auto;border-radius:8px;border:1px solid var(--border);margin-bottom:4px">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:var(--bg3)">
          <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text3);text-align:left">Nombre</th>
          <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text3);text-align:left">Email</th>
          <th style="padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--text3);text-align:left">Rol</th>
        </tr></thead>
        <tbody>
          ${preview.map(u => `<tr>
            <td style="padding:8px 12px;font-size:13px;font-weight:500;color:var(--text)">${u.name}</td>
            <td style="padding:8px 12px;font-size:12px;font-family:var(--mono);color:var(--text2)">${u.email}</td>
            <td style="padding:8px 12px"><span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${roleColors[u.role]}18;color:${roleColors[u.role]};font-weight:500">${ROLE_LABELS[u.role]||u.role}</span></td>
          </tr>`).join("")}
          ${more}
        </tbody>
      </table>
    </div>
    <div style="font-size:12px;color:var(--text3);margin-top:6px">&#128274; Las contraseñas se generarán automáticamente (10 caracteres aleatorios)</div>`;

  document.getElementById("bu-preview").style.display    = "block";
  document.getElementById("btn-bu-confirm").style.display = "inline-flex";
}

async function confirmBulkUsers() {
  if (!bulkUsersPreview.length) return;
  const total = bulkUsersPreview.length;

  // Switch to progress step
  document.getElementById("bu-step-upload").style.display   = "none";
  document.getElementById("bu-step-progress").style.display = "block";
  document.getElementById("bu-modal-title").textContent     = "Creando usuarios...";

  const progressBar   = document.getElementById("bu-progress-bar");
  const progressCount = document.getElementById("bu-progress-count");
  const progressLabel = document.getElementById("bu-progress-label");

  bulkUsersResults = [];
  const errors = [];
  let done = 0;

  const bulkEmpresaId = gv("bu-empresa");
  // Attach empresaId to each user before loop
  bulkUsersPreview.forEach(u => u.empresaId = bulkEmpresaId);

  for (const user of bulkUsersPreview) {
    progressLabel.textContent = `Creando: ${user.name}`;
    progressCount.textContent = `${done} / ${total}`;
    progressBar.style.width   = `${Math.round(done / total * 100)}%`;

    if (demoMode) {
      const uid = "u" + (DEMO.users.length + 1);
      DEMO.users.push({ uid, name: user.name, email: user.email, role: user.role, empresaId: user.empresaId||"" });
      bulkUsersResults.push({ ...user, link: buildInviteLink(user.email, user.pass) });
    } else {
      try {
        const appName     = "secondary_" + Date.now() + "_" + done;
        const secondaryApp  = firebase.initializeApp(firebase.app().options, appName);
        const secondaryAuth = secondaryApp.auth();
        const cr = await secondaryAuth.createUserWithEmailAndPassword(user.email, user.pass);
        await db.collection("users").doc(cr.user.uid).set({
          name: user.name, email: user.email, role: user.role,
          empresaId: user.empresaId || "",
          createdAt: new Date().toISOString(), createdBy: currentUser.uid, bulkImport: true,
        });
        await secondaryAuth.signOut();
        await secondaryApp.delete();
        bulkUsersResults.push({ ...user, link: buildInviteLink(user.email, user.pass) });
      } catch(e) {
        errors.push({ email: user.email, error: fErr(e) });
      }
    }

    done++;
    // Small delay to avoid Firebase rate limiting
    if (!demoMode) await new Promise(r => setTimeout(r, 300));
  }

  progressBar.style.width   = "100%";
  progressCount.textContent = `${done} / ${total}`;

  // Show result step
  await new Promise(r => setTimeout(r, 400));
  document.getElementById("bu-step-progress").style.display = "none";
  document.getElementById("bu-step-result").style.display   = "block";
  document.getElementById("bu-modal-title").textContent     = "Carga completada";

  const ok = bulkUsersResults.length;
  document.getElementById("bu-result-title").textContent = `${ok} usuario${ok!==1?"s":""} creado${ok!==1?"s":""}`;
  document.getElementById("bu-result-sub").textContent   = errors.length
    ? `${errors.length} usuario${errors.length!==1?"s":""} no pudieron crearse`
    : "Todos los usuarios fueron creados exitosamente";

  if (errors.length) {
    document.getElementById("bu-errors-wrap").style.display = "block";
    document.getElementById("bu-errors-title").textContent  = `${errors.length} error${errors.length!==1?"es":""}:`;
    document.getElementById("bu-errors-list").innerHTML     = errors.map(e =>
      `${e.email} → ${e.error}`).join("<br>");
  }

  await loadUsers();
}

function downloadUserTemplate() {
  const csv = "\uFEFFNombre,Email,Rol\nAna García,ana.garcia@empresa.com,evaluador\nCarlos López,carlos.lopez@empresa.com,evaluado\nMaría Torres,maria.torres@empresa.com,rrhh\n";
  const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "plantilla_usuarios.csv"; a.click();
  URL.revokeObjectURL(url);
}

function downloadInviteLinks() {
  if (!bulkUsersResults.length) return;
  if (typeof XLSX === "undefined") {
    // Fallback to CSV
    const header = "Nombre,Email,Rol,Link de invitación\n";
    const rows   = bulkUsersResults.map(u =>
      `"${u.name}","${u.email}","${ROLE_LABELS[u.role]||u.role}","${u.link}"`).join("\n");
    const blob   = new Blob(["\uFEFF" + header + rows], { type:"text/csv;charset=utf-8;" });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement("a");
    a.href = url; a.download = "links_invitacion.csv"; a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const wsData = [
    ["Nombre","Email","Rol","Contraseña temporal","Link de invitación"],
    ...bulkUsersResults.map(u => [u.name, u.email, ROLE_LABELS[u.role]||u.role, u.pass, u.link]),
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws["!cols"] = [{ wch:25 }, { wch:35 }, { wch:14 }, { wch:16 }, { wch:80 }];

  // Style header row
  const headerStyle = { font:{ bold:true }, fill:{ fgColor:{ rgb:"EEF0FF" } } };
  ["A1","B1","C1","D1","E1"].forEach(cell => {
    if (ws[cell]) ws[cell].s = headerStyle;
  });

  XLSX.utils.book_append_sheet(wb, ws, "Links de invitación");
  XLSX.writeFile(wb, `links_invitacion_${new Date().toISOString().split("T")[0]}.xlsx`);
  toast("Excel descargado ✓");
}

function showBuError(msg) {
  const el = document.getElementById("bu-error");
  el.textContent = msg; el.style.display = "block";
  document.getElementById("bu-preview").style.display    = "none";
  document.getElementById("btn-bu-confirm").style.display = "none";
}

// ── INVITE LINK ─────────────────────────────────────
function buildInviteLink(email, pass) {
  const base   = window.location.href.split("?")[0].split("#")[0];
  const params = new URLSearchParams({ inv: "1", e: email, p: pass });
  return `${base}?${params.toString()}`;
}

function copyInviteLink() {
  const linkEl = document.getElementById("cu-invite-link");
  const text   = linkEl.dataset.url || linkEl.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const icon = document.getElementById("copy-icon");
    icon.innerHTML = `<polyline points="20 6 9 17 4 12"/>`;
    const btn = document.getElementById("btn-copy-link");
    btn.style.color = "var(--green)";
    setTimeout(() => {
      icon.innerHTML = `<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>`;
      btn.style.color = "";
    }, 2000);
    toast("Link copiado al portapapeles ✓");
  }).catch(() => {
    // Fallback for non-HTTPS
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    toast("Link copiado ✓");
  });
}

function showInviteLink(name, role, email, pass) {
  const url = buildInviteLink(email, pass);
  document.getElementById("cu-form-step").style.display = "none";
  document.getElementById("cu-link-step").style.display = "block";
  document.getElementById("cu-success-name").textContent = name + " — cuenta creada";
  document.getElementById("cu-success-role").textContent = "Rol: " + ROLE_LABELS[role];
  const linkEl = document.getElementById("cu-invite-link");
  linkEl.textContent  = url;
  linkEl.dataset.url  = url;
}

function resetCreateUser() {
  ["cu-name","cu-email","cu-pass"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
  const roleEl = document.getElementById("cu-role"); if (roleEl) roleEl.value = "evaluador";
  const errEl  = document.getElementById("cu-err");  if (errEl)  errEl.style.display = "none";
  document.getElementById("cu-form-step").style.display = "block";
  document.getElementById("cu-link-step").style.display = "none";
  setLd("btn-cu", false);
}

// Auto-login from invite link (?inv=1&e=...&p=...)
(function checkInviteParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("inv") !== "1") return;
  const email = params.get("e"), pass = params.get("p");
  if (!email || !pass) return;
  // Clean URL so credentials don't stay in history
  const cleanUrl = window.location.href.split("?")[0];
  window.history.replaceState({}, document.title, cleanUrl);
  // Pre-fill login form once it's visible
  window.inviteCredentials = { email, pass };
})();

function applyInviteCredentials() {
  if (!window.inviteCredentials) return;
  const { email, pass } = window.inviteCredentials;
  const eEl = document.getElementById("l-email");
  const pEl = document.getElementById("l-pass");
  if (eEl) eEl.value = email;
  if (pEl) pEl.value = pass;
  window.inviteCredentials = null;
  // Show a friendly banner
  const sub = document.getElementById("auth-login-subtitle");
  if (sub) {
    sub.textContent = "¡Bienvenido! Tus credenciales ya están listas. Haz clic en Iniciar sesión.";
    sub.style.color = "var(--green)";
  }
}

async function adminCreateUser() {
  if (currentUser.role !== "admin") { toast("Solo el Admin puede crear usuarios", "err"); return; }
  const name  = gv("cu-name");
  const email = gv("cu-email");
  const pass  = gv("cu-pass");
  const role  = gv("cu-role");
  const cuErr = document.getElementById("cu-err");

  if (!name || !email || !pass) { cuErr.textContent = "Completa todos los campos"; cuErr.style.display = "block"; return; }
  if (pass.length < 6)          { cuErr.textContent = "La contraseña debe tener mínimo 6 caracteres"; cuErr.style.display = "block"; return; }

  setLd("btn-cu", true);
  cuErr.style.display = "none";

  if (demoMode) {
    const uid = "u" + (DEMO.users.length + 1);
    DEMO.users.push({ uid, name, email, role, empresaId: gv("cu-empresa") });
    showInviteLink(name, role, email, pass);
    await loadUsers();
    return;
  }

  try {
    const secondaryApp  = firebase.initializeApp(firebase.app().options, "secondary_" + Date.now());
    const secondaryAuth = secondaryApp.auth();
    const cr = await secondaryAuth.createUserWithEmailAndPassword(email, pass);
    await db.collection("users").doc(cr.user.uid).set({ name, email, role, empresaId: gv("cu-empresa"), createdAt: new Date().toISOString(), createdBy: currentUser.uid });
    await secondaryAuth.signOut();
    await secondaryApp.delete();
    showInviteLink(name, role, email, pass);
    await loadUsers();
  } catch(e) {
    cuErr.textContent = fErr(e);
    cuErr.style.display = "block";
    setLd("btn-cu", false);
  }
}

async function loadUsers() {
  let users = [];
  if (demoMode) { users = DEMO.users; }
  else { const snap = await db.collection("users").get(); users = snap.docs.map(d => ({ uid:d.id, ...d.data() })); }

  const ul = document.getElementById("users-list");
  if (!filtUsers.length) { ul.innerHTML = `<p style="color:var(--text3);font-size:14px">Sin usuarios para mostrar.</p>`; return; }
  const empresas = await dbAll("empresas");
  const userEmpresaId = currentUser?.empresaId || "";
  const uRole = currentUser?.role;
  // Admins see all; RRHH sees only their empresa; others see nothing
  const filtUsers = uRole === "admin" ? users
    : uRole === "rrhh" && userEmpresaId ? users.filter(u => u.empresaId === userEmpresaId)
    : [];

  ul.innerHTML = filtUsers.map(u => {
    const ini  = (u.name||u.email||"?").split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();
    const role = u.role || "evaluador";
    const isMe = currentUser.uid === u.uid;
    const emp  = empresas.find(e => e.id === u.empresaId);
    return `<div class="uc">
      <div class="avatar">${ini}</div>
      <div class="uc-i">
        <div class="uc-n">${u.name||"Sin nombre"}</div>
        <div class="uc-e">${u.email||"—"}</div>
      </div>
      <span class="rp ${ROLE_CLASSES[role]}">${ROLE_LABELS[role]}</span>
      ${emp ? `<span style="font-size:11px;color:var(--text3);padding:2px 6px;background:var(--bg3);border-radius:6px">${emp.nombre}</span>` : ""}
      ${isMe
        ? `<span style="font-size:12px;color:var(--text3);padding:6px 8px">Tú</span>`
        : `<div style="display:flex;gap:6px">
             <button class="btn btn-g btn-sm" onclick="openEditRole(\'${u.uid}\',\'${(u.name||"").replace(/'/g,"\\'")}\',\'${role}\')">Cambiar rol</button>
             <button class="btn btn-del btn-sm" onclick="deleteUser(\'${u.uid}\',\'${(u.name||"").replace(/'/g,"\\'")}\')">Eliminar</button>
           </div>`}
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

async function deleteUser(uid, name) {
  if (!confirm(`¿Eliminar al usuario "${name}"? Esta acción no se puede deshacer.`)) return;
  if (demoMode) {
    DEMO.users = DEMO.users.filter(u => u.uid !== uid);
  } else {
    // Remove from Firestore (Auth deletion requires Admin SDK — mark as inactive instead)
    await db.collection("users").doc(uid).delete();
  }
  toast(`Usuario "${name}" eliminado`);
  await loadUsers();
}

// ── EMPRESAS ────────────────────────────────────────
let currentReportData = null; // stored for export

// ── LOGO UPLOAD (base64) ────────────────────────────
let currentLogoBase64 = ""; // holds base64 or empty string

function handleLogoDrop(e) {
  e.preventDefault();
  document.getElementById("logo-dropzone").style.borderColor = "";
  const file = e.dataTransfer?.files[0] || null;
  if (file) handleLogoFile(file);
}

function handleLogoFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showLogoError("El archivo debe ser una imagen (PNG, JPG, SVG, WebP)"); return;
  }
  const MAX = 200 * 1024; // 200 KB
  if (file.size > MAX) {
    showLogoError(`El archivo pesa ${(file.size/1024).toFixed(0)} KB. El máximo es 200 KB. Comprime la imagen antes de subir.`); return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    currentLogoBase64 = e.target.result; // data:image/...;base64,...
    // Clear URL field — base64 takes priority
    document.getElementById("empresa-logo").value = "";
    renderLogoThumb(currentLogoBase64, file.name);
    updateEmpresaPreview();
  };
  reader.readAsDataURL(file);
}

function renderLogoThumb(src, filename) {
  const thumb   = document.getElementById("logo-preview-thumb");
  const label   = document.getElementById("logo-file-name");
  const clearBtn= document.getElementById("btn-clear-logo");
  thumb.innerHTML = `<img src="${src}" style="width:48px;height:48px;object-fit:contain;border-radius:4px"/>`;
  label.textContent = filename || "Logo cargado";
  clearBtn.style.display = "block";
}

function clearLogo() {
  currentLogoBase64 = "";
  document.getElementById("empresa-logo").value = "";
  document.getElementById("logo-preview-thumb").innerHTML =
    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
  document.getElementById("logo-file-name").textContent = "Arrastra el logo o haz clic para seleccionar";
  document.getElementById("btn-clear-logo").style.display = "none";
  document.getElementById("logo-file-input").value = "";
  updateEmpresaPreview();
}

function onLogoUrlInput(val) {
  // If user types a URL, clear any uploaded base64
  if (val.trim()) {
    currentLogoBase64 = "";
    document.getElementById("logo-file-name").textContent = "Arrastra el logo o haz clic para seleccionar";
    document.getElementById("logo-preview-thumb").innerHTML =
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    document.getElementById("btn-clear-logo").style.display = "none";
  }
  updateEmpresaPreview();
}

function showLogoError(msg) {
  const label = document.getElementById("logo-file-name");
  label.textContent = "⚠ " + msg;
  label.style.color = "var(--red)";
  setTimeout(() => {
    label.textContent = "Arrastra el logo o haz clic para seleccionar";
    label.style.color = "";
  }, 4000);
}

function getLogoValue() {
  // Returns base64 if uploaded, else URL field value, else ""
  return currentLogoBase64 || document.getElementById("empresa-logo").value.trim();
}

function resetLogoField() {
  clearLogo();
}

function loadLogoIntoField(logoValue) {
  // When editing an existing empresa — restore the logo state
  if (!logoValue) { clearLogo(); return; }
  if (logoValue.startsWith("data:")) {
    // It's a stored base64
    currentLogoBase64 = logoValue;
    renderLogoThumb(logoValue, "Logo guardado");
    document.getElementById("empresa-logo").value = "";
  } else {
    // It's a URL
    currentLogoBase64 = "";
    document.getElementById("empresa-logo").value = logoValue;
    // Show a small thumb from URL
    const thumb = document.getElementById("logo-preview-thumb");
    thumb.innerHTML = `<img src="${logoValue}" style="width:48px;height:48px;object-fit:contain;border-radius:4px" onerror="this.parentElement.innerHTML='<svg width=22 height=22 viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'var(--text3)\' stroke-width=\'1.5\'><rect x=3 y=3 width=18 height=18 rx=2/></svg>'"/>`;
    document.getElementById("logo-file-name").textContent = "URL externa";
    document.getElementById("btn-clear-logo").style.display = "block";
  }
}

function syncEmpColor(pickerId, hex) {
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) document.getElementById(pickerId).value = hex;
}

function updateEmpresaPreview() {
  const nombre  = document.getElementById("empresa-nombre").value  || "Nombre empresa";
  const eslogan = document.getElementById("empresa-eslogan").value || "";
  const color1  = document.getElementById("empresa-color1-hex").value || "#6c63ff";
  const logo    = getLogoValue();
  const footer  = document.getElementById("empresa-footer").value  || "Pie de página del reporte";

  document.getElementById("empresa-preview-header").style.background = color1;
  document.getElementById("empresa-preview-nombre").textContent      = nombre;
  document.getElementById("empresa-preview-eslogan").textContent     = eslogan;
  document.getElementById("empresa-preview-footer").textContent      = footer;

  const logoEl = document.getElementById("empresa-preview-logo");
  if (logo) { logoEl.src = logo; logoEl.style.display = "block"; }
  else       { logoEl.style.display = "none"; }
}

// Wire preview updates
["empresa-nombre","empresa-eslogan","empresa-color1-hex","empresa-color2-hex","empresa-logo","empresa-footer"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", updateEmpresaPreview);
});
["empresa-color1","empresa-color2"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", () => {
    const hexId = id + "-hex";
    document.getElementById(hexId).value = el.value;
    updateEmpresaPreview();
  });
});

function openNewEmpresa() {
  document.getElementById("emp-modal-title").textContent = "Nueva empresa";
  document.getElementById("empresa-edit-id").value       = "";
  document.getElementById("empresa-err").style.display   = "none";
  ["empresa-nombre","empresa-eslogan","empresa-logo","empresa-footer","empresa-contacto"].forEach(id => {
    document.getElementById(id).value = "";
  });
  resetLogoField();
  document.getElementById("empresa-color1").value     = "#6c63ff";
  document.getElementById("empresa-color1-hex").value = "#6c63ff";
  document.getElementById("empresa-color2").value     = "#1a1a2e";
  document.getElementById("empresa-color2-hex").value = "#1a1a2e";
  updateEmpresaPreview();
  openMo("mo-empresa");
}

function openEditEmpresa(id) {
  dbAll("empresas").then(list => {
    const emp = list.find(e => e.id === id); if (!emp) return;
    document.getElementById("emp-modal-title").textContent = "Editar empresa";
    document.getElementById("empresa-edit-id").value       = id;
    document.getElementById("empresa-err").style.display   = "none";
    document.getElementById("empresa-nombre").value    = emp.nombre    || "";
    document.getElementById("empresa-eslogan").value   = emp.eslogan   || "";
    document.getElementById("empresa-footer").value    = emp.footer    || "";
    document.getElementById("empresa-contacto").value  = emp.contacto  || "";
    loadLogoIntoField(emp.logo || "");
    const c1 = emp.color1 || "#6c63ff", c2 = emp.color2 || "#1a1a2e";
    document.getElementById("empresa-color1").value     = c1;
    document.getElementById("empresa-color1-hex").value = c1;
    document.getElementById("empresa-color2").value     = c2;
    document.getElementById("empresa-color2-hex").value = c2;
    updateEmpresaPreview();
    openMo("mo-empresa");
  });
}

async function saveEmpresa() {
  const nombre = gv("empresa-nombre");
  if (!nombre) {
    const e = document.getElementById("empresa-err");
    e.textContent = "El nombre es obligatorio"; e.style.display = "block"; return;
  }
  const editId = gv("empresa-edit-id");
  const data   = {
    nombre,
    eslogan:  gv("empresa-eslogan"),
    logo:     getLogoValue(),
    color1:   gv("empresa-color1-hex") || "#6c63ff",
    color2:   gv("empresa-color2-hex") || "#1a1a2e",
    footer:   gv("empresa-footer"),
    contacto: gv("empresa-contacto"),
    updatedAt: new Date().toISOString(),
  };
  const id = editId || genId("empresas");
  if (!editId) data.createdAt = new Date().toISOString();
  await dbSet("empresas", id, data);
  toast(editId ? "Empresa actualizada ✓" : "Empresa creada ✓");
  closeMo("mo-empresa");
  await loadEmpresasTable();
  await loadEmpresasSelect();
}

async function loadEmpresasTable() {
  const list = await dbAll("empresas");
  const ul   = document.getElementById("empresas-list");
  if (!list.length) {
    ul.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text3)">
      <p>Sin empresas. Crea la primera para poder personalizar los reportes.</p></div>`;
    return;
  }
  ul.innerHTML = list.map(emp => {
    const c1 = emp.color1 || "#6c63ff";
    return `<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--bg3);border-radius:var(--radius);margin-bottom:10px">
      <div style="width:42px;height:42px;border-radius:8px;background:${c1};display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
        ${emp.logo
          ? `<img src="${emp.logo}" style="width:42px;height:42px;object-fit:contain" onerror="this.style.display='none'"/>`
          : `<span style="font-size:16px;font-weight:700;color:#fff">${(emp.nombre||"?")[0].toUpperCase()}</span>`}
      </div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:500">${emp.nombre}</div>
        <div style="font-size:12px;color:var(--text3)">${emp.eslogan||""}</div>
        ${emp.footer ? `<div style="font-size:11px;color:var(--text3);margin-top:2px;font-style:italic">${emp.footer}</div>` : ""}
      </div>
      <div style="display:flex;gap:6px">
        <div style="display:flex;gap:4px;align-items:center;margin-right:6px">
          <div style="width:16px;height:16px;border-radius:50%;background:${c1};border:2px solid rgba(0,0,0,.1)" title="Color primario"></div>
          <div style="width:16px;height:16px;border-radius:50%;background:${emp.color2||"#1a1a2e"};border:2px solid rgba(0,0,0,.1)" title="Color secundario"></div>
        </div>
        <button class="btn btn-g btn-sm" onclick="openEditEmpresa('${emp.id}')">Editar</button>
        <button class="btn btn-del btn-sm" onclick="deleteEmpresa('${emp.id}')">Eliminar</button>
      </div>
    </div>`;
  }).join("");
}

async function deleteEmpresa(id) {
  if (!confirm("¿Eliminar esta empresa?")) return;
  await dbDel("empresas", id);
  toast("Empresa eliminada");
  await loadEmpresasTable();
  await loadEmpresasSelect();
}

async function loadEmpresasSelect() {
  const list    = await dbAll("empresas");
  const opts    = list.map(e => `<option value="${e.id}">${e.nombre}</option>`).join("");
  const noOpt   = `<option value="">— sin empresa —</option>`;
  const noBrand = `<option value="">— sin branding —</option>`;
  ["ev-empresa","cu-empresa","bu-empresa"].forEach(id => {
    const el = document.getElementById(id); if (el) el.innerHTML = noOpt + opts;
  });
  const repEl = document.getElementById("rep-empresa");
  if (repEl) repEl.innerHTML = noBrand + opts;
}

// ── EXPORT: helpers ─────────────────────────────────
async function getEmpresaForReport() {
  const selEl = document.getElementById("rep-empresa");
  if (!selEl || !selEl.value) return null;
  const list = await dbAll("empresas");
  return list.find(e => e.id === selEl.value) || null;
}

function buildReportHeader(empresa, evalName, empNombre, tipo) {
  if (!empresa) return `<div style="margin-bottom:20px"><h1 style="font-size:20px;margin:0">${evalName}</h1><p style="color:#666;margin:4px 0 0">${empNombre} · Evaluación ${tipo}°</p></div>`;
  const c1 = empresa.color1 || "#6c63ff";
  const c2 = empresa.color2 || "#1a1a2e";
  return `
    <div style="background:${c1};padding:20px 28px;border-radius:10px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:16px">
        ${empresa.logo ? `<img src="${empresa.logo}" style="height:48px;border-radius:6px;background:#fff;padding:4px" onerror="this.style.display='none'"/>` : ""}
        <div>
          <div style="font-size:20px;font-weight:700;color:#fff">${empresa.nombre}</div>
          ${empresa.eslogan ? `<div style="font-size:12px;color:rgba(255,255,255,.8)">${empresa.eslogan}</div>` : ""}
        </div>
      </div>
      <div style="text-align:right;color:rgba(255,255,255,.9)">
        <div style="font-size:14px;font-weight:600">${evalName}</div>
        <div style="font-size:12px;margin-top:2px">${empNombre} · Evaluación ${tipo}°</div>
        <div style="font-size:11px;margin-top:2px">${new Date().toLocaleDateString("es-CO",{year:"numeric",month:"long",day:"numeric"})}</div>
      </div>
    </div>`;
}

function buildReportFooter(empresa) {
  if (!empresa) return "";
  return `<div style="margin-top:32px;padding:10px 18px;border-top:2px solid ${empresa.color1||"#6c63ff"};display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#888">
    <span>${empresa.footer||""}</span>
    <span>${empresa.contacto||""}</span>
  </div>`;
}

// ── EXPORT: PDF ──────────────────────────────────────
async function exportReportPDF() {
  if (!currentReportData) { toast("Carga un reporte primero","err"); return; }
  const { ev, emps, avg, globalScore, rArr } = currentReportData;
  const empresa  = await getEmpresaForReport();
  const emp      = emps.find(e => e.id === ev.empleadoId) || { nombre:"—", cargo:"—" };
  const c1       = empresa?.color1 || "#6c63ff";
  const scoreLabel = ["Insuficiente","Regular","Aceptable","Bueno","Sobresaliente"][Math.min(4,Math.floor(parseFloat(globalScore)-1))] || "—";

  // Build competencias bars
  const compBars = ev.competencias.map(c => {
    const a   = avg[c] || 0;
    const pct = Math.round(a / 5 * 100);
    const col = a >= 4 ? "#059669" : a >= 3 ? "#d97706" : "#dc2626";
    return `<div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:13px">${c}</span>
        <span style="font-size:13px;font-weight:600;color:${col}">${a.toFixed(1)} / 5.0</span>
      </div>
      <div style="background:#e5e7eb;border-radius:4px;height:8px">
        <div style="width:${pct}%;height:100%;background:${col};border-radius:4px"></div>
      </div>
    </div>`;
  }).join("");

  // Respondentes table
  const respRows = (ev.evaluadores||[]).map(ev2 => {
    const eEmp = emps.find(e => e.id === ev2.id) || { nombre:"—" };
    const done = rArr.some(r => r.relacion === ev2.relacion);
    return `<tr>
      <td style="padding:6px 10px;font-size:12px">${eEmp.nombre}</td>
      <td style="padding:6px 10px;font-size:12px;color:#666">${ev2.relacion}</td>
      <td style="padding:6px 10px;font-size:12px;color:${done?"#059669":"#d97706"}">${done?"✓ Completado":"⏳ Pendiente"}</td>
    </tr>`;
  }).join("");

  // Fuentes summary
  const fuentes     = ["jefe","autoevaluacion","par","subordinado","cliente"];
  const fuenteNames = ["Jefe directo","Autoevaluación","Pares","Subordinados","Clientes"];
  const fuenteRows  = fuentes.map((f, i) => {
    const rs  = rArr.filter(r => r.relacion === f);
    if (!rs.length) return "";
    const all = rs.flatMap(r => Object.values(r.scores||{}));
    const avg2 = all.length ? (all.reduce((a,b)=>a+b,0)/all.length).toFixed(2) : "—";
    return `<tr><td style="padding:6px 10px;font-size:12px">${fuenteNames[i]}</td><td style="padding:6px 10px;font-size:12px;font-weight:600">${avg2}</td><td style="padding:6px 10px;font-size:12px;color:#666">${rs.length} respuesta${rs.length!==1?"s":""}</td></tr>`;
  }).filter(Boolean).join("");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1a1a2e;max-width:900px;margin:0 auto">
      ${buildReportHeader(empresa, ev.nombre, emp.nombre + " — " + emp.cargo, ev.tipo)}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <div style="background:#f8f8fc;border-radius:10px;padding:20px;text-align:center">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px">Puntaje Global</div>
          <div style="font-size:52px;font-weight:300;color:${c1}">${globalScore}</div>
          <div style="font-size:13px;color:#666">/ 5.0 — ${scoreLabel}</div>
        </div>
        <div style="background:#f8f8fc;border-radius:10px;padding:20px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:12px">Por fuente evaluadora</div>
          <table style="width:100%;border-collapse:collapse">${fuenteRows}</table>
        </div>
      </div>

      <div style="margin-bottom:24px">
        <div style="font-size:14px;font-weight:600;margin-bottom:14px;padding-bottom:6px;border-bottom:2px solid ${c1}">Detalle por competencia</div>
        ${compBars}
      </div>

      <div>
        <div style="font-size:14px;font-weight:600;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid ${c1}">Estado de respondentes</div>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f0f0f7">
            <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888">Evaluador</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888">Relación</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888">Estado</th>
          </tr></thead>
          <tbody>${respRows}</tbody>
        </table>
      </div>

      ${buildReportFooter(empresa)}
    </div>`;

  const printArea = document.getElementById("pdf-print-area");
  printArea.innerHTML = html;
  printArea.style.display = "block";
  window.print();
  setTimeout(() => { printArea.style.display = "none"; printArea.innerHTML = ""; }, 1000);
}

// ── EXPORT: Excel ────────────────────────────────────
async function exportReportExcel() {
  if (!currentReportData) { toast("Carga un reporte primero","err"); return; }
  if (typeof XLSX === "undefined") { toast("Librería XLSX no disponible","err"); return; }

  const { ev, emps, avg, globalScore, rArr } = currentReportData;
  const empresa = await getEmpresaForReport();
  const emp     = emps.find(e => e.id === ev.empleadoId) || { nombre:"—", cargo:"—" };
  const wb      = XLSX.utils.book_new();
  const dateStr = new Date().toLocaleDateString("es-CO");

  // ── Sheet 1: Resumen ──
  const resumenData = [
    ["REPORTE DE EVALUACIÓN"],
    empresa ? ["Empresa:", empresa.nombre] : [],
    ["Evaluación:", ev.nombre],
    ["Evaluado:", emp.nombre],
    ["Cargo:", emp.cargo],
    ["Tipo:", `${ev.tipo}°`],
    ["Fecha:", dateStr],
    ["Puntaje global:", parseFloat(globalScore) || "Sin datos"],
    [],
    ["PUNTAJE POR COMPETENCIA"],
    ["Competencia", "Promedio", "Calificación"],
    ...ev.competencias.map(c => {
      const a = avg[c] || 0;
      const label = a >= 4 ? "Bueno/Sobresaliente" : a >= 3 ? "Aceptable" : "Por mejorar";
      return [c, parseFloat(a.toFixed(2)), label];
    }),
    [],
    ["PUNTAJE POR FUENTE"],
    ["Fuente", "Promedio", "# Respuestas"],
    ...["jefe","autoevaluacion","par","subordinado","cliente"].map((f,i) => {
      const names = ["Jefe directo","Autoevaluación","Pares","Subordinados","Clientes"];
      const rs    = rArr.filter(r => r.relacion === f);
      if (!rs.length) return null;
      const all   = rs.flatMap(r => Object.values(r.scores||{}));
      const avg2  = all.length ? parseFloat((all.reduce((a,b)=>a+b,0)/all.length).toFixed(2)) : 0;
      return [names[i], avg2, rs.length];
    }).filter(Boolean),
  ].filter(r => r.length);

  const ws1 = XLSX.utils.aoa_to_sheet(resumenData);
  ws1["!cols"] = [{ wch:30 }, { wch:16 }, { wch:22 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Resumen");

  // ── Sheet 2: Respuestas detalladas ──
  const headers2 = ["Relación", "Fecha", ...ev.competencias, "Comentario"];
  const rows2    = rArr.map(r => [
    r.relacion,
    r.fecha ? new Date(r.fecha).toLocaleDateString("es-CO") : "—",
    ...ev.competencias.map(c => r.scores?.[c.replace(/\s+/g,"_")] || r.scores?.[c] || ""),
    r.comentario || "",
  ]);
  const ws2 = XLSX.utils.aoa_to_sheet([headers2, ...rows2]);
  ws2["!cols"] = [{ wch:16 }, { wch:12 }, ...ev.competencias.map(() => ({ wch:12 })), { wch:40 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Respuestas detalladas");

  // ── Sheet 3: Respondentes ──
  const ws3 = XLSX.utils.aoa_to_sheet([
    ["Evaluador", "Relación", "Estado"],
    ...(ev.evaluadores||[]).map(ev2 => {
      const eEmp = emps.find(e => e.id === ev2.id) || { nombre:"—" };
      const done = rArr.some(r => r.relacion === ev2.relacion);
      return [eEmp.nombre, ev2.relacion, done ? "Completado" : "Pendiente"];
    }),
  ]);
  ws3["!cols"] = [{ wch:28 }, { wch:16 }, { wch:14 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Respondentes");

  const filename = `Reporte_${(empresa?.nombre||"EvalPro").replace(/\s/g,"_")}_${emp.nombre.split(" ")[0]}_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
  toast("Excel descargado ✓");
}

// ── INIT ────────────────────────────────────────────
(function initDates() {
  const hoy = new Date();
  const fmt  = d => d.toISOString().split("T")[0];
  document.getElementById("ev-start").value = fmt(hoy);
  const cierre = new Date(hoy); cierre.setDate(cierre.getDate() + 30);
  document.getElementById("ev-end").value = fmt(cierre);
})();
