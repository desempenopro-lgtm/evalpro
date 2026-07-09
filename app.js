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
  admin:     { dashboard:1, evaluaciones:1, empleados:1, formulario:1, reportes:1, usuarios:1, canCreate:1, canDelete:1 },
  rrhh:      { dashboard:1, evaluaciones:1, empleados:1, formulario:1, reportes:1, usuarios:0, canCreate:1, canDelete:0 },
  evaluador: { dashboard:1, evaluaciones:0, empleados:0, formulario:1, reportes:0, usuarios:0, canCreate:0, canDelete:0 },
  evaluado:  { dashboard:1, evaluaciones:0, empleados:0, formulario:0, reportes:1, usuarios:0, canCreate:0, canDelete:0 },
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

  const navMap = { "ni-evaluaciones":"evaluaciones", "ni-empleados":"empleados", "ni-formulario":"formulario", "ni-reportes":"reportes", "ni-usuarios":"usuarios" };
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
  await Promise.all([loadDash(), loadEvalTable(), loadEmpTable(), loadSelects()]);
  if ((PERMS[currentUser.role] || {}).usuarios) await loadUsers();
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
      await dbSet("empleados", id, { nombre:emp.nombre, email:emp.email, cargo:emp.cargo, area:emp.area, nivel:emp.nivel, jefeId:"" });
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
    DEMO.users.push({ uid, name, email, role });
    showInviteLink(name, role, email, pass);
    await loadUsers();
    return;
  }

  try {
    const secondaryApp  = firebase.initializeApp(firebase.app().options, "secondary_" + Date.now());
    const secondaryAuth = secondaryApp.auth();
    const cr = await secondaryAuth.createUserWithEmailAndPassword(email, pass);
    await db.collection("users").doc(cr.user.uid).set({ name, email, role, createdAt: new Date().toISOString(), createdBy: currentUser.uid });
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
  if (!users.length) { ul.innerHTML = `<p style="color:var(--text3);font-size:14px">Sin usuarios. Crea el primero.</p>`; return; }
  ul.innerHTML = users.map(u => {
    const ini  = (u.name||u.email||"?").split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();
    const role = u.role || "evaluador";
    const isMe = currentUser.uid === u.uid;
    return `<div class="uc">
      <div class="avatar">${ini}</div>
      <div class="uc-i">
        <div class="uc-n">${u.name||"Sin nombre"}</div>
        <div class="uc-e">${u.email||"—"}</div>
      </div>
      <span class="rp ${ROLE_CLASSES[role]}">${ROLE_LABELS[role]}</span>
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

// ── INIT ────────────────────────────────────────────
(function initDates() {
  const hoy = new Date();
  const fmt  = d => d.toISOString().split("T")[0];
  document.getElementById("ev-start").value = fmt(hoy);
  const cierre = new Date(hoy); cierre.setDate(cierre.getDate() + 30);
  document.getElementById("ev-end").value = fmt(cierre);
})();
