// =======================
// Config
// =======================
const COUNTRIES_URL = "https://restcountries.com/v3.1/all?fields=name,cca3,region,languages,flags,population,capital";
const MOCKAPI_URL   = "https://68bdeb02227c48698f85a6c4.mockapi.io/api/v1/favorites";

// recurso de países propios creado en MockAPI como 'countries'
const CUSTOM_COUNTRIES_URL = "https://68bdeb02227c48698f85a6c4.mockapi.io/api/v1/countries";

// =======================
// Estado
// =======================
let COUNTRIES = [];
let FILTERED  = [];
let FAVORITES = [];

let editingFavId = null;

// =======================
// UI Refs
// =======================
const $cards    = document.getElementById("cards");
const $favTable = document.getElementById("fav-table");
const $spinner  = document.getElementById("spinner");
const $alert    = document.getElementById("alert");

// filtros
const $fName     = document.getElementById("f-name");
const $fRegion   = document.getElementById("f-region");
const $fLanguage = document.getElementById("f-language");
const $btnClear  = document.getElementById("btn-clear");

// modal editar dato curioso
const $modalNote   = document.getElementById("modal-note");
const $noteId      = document.getElementById("note-id");
const $noteText    = document.getElementById("note-text");
const $noteSave    = document.getElementById("note-save");
const $noteCancel  = document.getElementById("note-cancel");
const $noteClose   = document.getElementById("note-close");

// favoritos actions
const $btnOpenFavs = document.getElementById("btn-open-favs");

// refs modal CREAR país
const $btnOpenCreate = document.getElementById("btn-open-create");
const $modalCreate   = document.getElementById("modal-create");
const $createForm    = document.getElementById("create-form");
const $createSave    = document.getElementById("create-save");
const $createCancel  = document.getElementById("create-cancel");
const $createClose   = document.getElementById("create-close");

// =======================
// Helpers UI
// =======================
const show = el => el.classList.remove("is-hidden");
const hide = el => el.classList.add("is-hidden");

//Muestra un aviso. Si hay un modal Bulma abierto, usa un modal de alerta para que el mensaje quede por encima. Si no, usa la banda amarilla (#alert)
function toast(msg, type = "info") {
  const anyModalOpen = document.querySelector(".modal.is-active");
  if (anyModalOpen) {
    showBulmaAlert({
      title: typeTitle(type),
      header: typeHeader(type),
      message: msg,
      color: typeToBulmaMessage(type)
    });
    return;
  }
  // Banda superior (alert original)
  $alert.textContent = msg;
  $alert.className = `notification is-${type}`;
  show($alert);
  setTimeout(() => hide($alert), 2000);
}

// mapear tipo -> estilos / textos para el modal de alerta
function typeToBulmaMessage(type){
  if (type === "success") return "is-success";
  if (type === "warning") return "is-warning";
  if (type === "danger" || type === "error") return "is-danger";
  return "is-info";
}
function typeTitle(type){
  if (type === "success") return "Operación exitosa";
  if (type === "warning") return "Atención";
  if (type === "danger" || type === "error") return "Ocurrió un error";
  return "Información";
}
function typeHeader(type){
  if (type === "success") return "Listo";
  if (type === "warning") return "Aviso";
  if (type === "danger" || type === "error") return "Error";
  return "Mensaje";
}

// Modal Bulma de alertas (#modal-alert) 
function showBulmaAlert({
  title = "Aviso",
  header = "Mensaje",
  message = "…",
  color = "is-info" // is-success | is-warning | is-danger | is-info
} = {}) {
  const $m    = document.getElementById("modal-alert");
  if(!$m) { // fallback si el modal no existe por algún motivo
    $alert.textContent = message;
    $alert.className = `notification ${color.replace("is-","is-")}`;
    show($alert);
    setTimeout(()=> hide($alert), 2000);
    return;
  }
  const $t    = document.getElementById("alert-title");
  const $h    = document.getElementById("alert-header");
  const $txt  = document.getElementById("alert-text");
  const $box  = document.getElementById("alert-box");
  const $btnX = document.getElementById("alert-x");
  const $btnClose = document.getElementById("alert-close");
  const $btnOk = document.getElementById("alert-ok");

  $t.textContent = title;
  $h.textContent = header;
  $txt.textContent = message;
  $box.className = `message ${color}`;

  $m.classList.add("is-active");

  const close = () => {
    $m.classList.remove("is-active");
    $btnX.removeEventListener("click", close);
    $btnClose.removeEventListener("click", close);
    $btnOk.removeEventListener("click", close);
  };
  $btnX.addEventListener("click", close);
  $btnClose.addEventListener("click", close);
  $btnOk.addEventListener("click", close);
}

// =======================
// Bulma Confirm (Promise) — usa #modal-confirm del HTML
// =======================
function openBulmaConfirm({
  title = "¿Confirmar?",
  header = "Atención",
  message = "¿Seguro que querés continuar?",
  okText = "Aceptar",
  cancelText = "Cancelar",
  okColor = "is-danger" // is-primary / is-warning / etc
} = {}) {
  return new Promise(resolve => {
    const $m       = document.getElementById("modal-confirm");
    if(!$m){
      // fallback si no existe el modal (no rompe el flujo)
      const ok = window.confirm(message);
      resolve(ok);
      return;
    }

    const $title   = document.getElementById("confirm-title");
    const $header  = document.getElementById("confirm-header");
    const $text    = document.getElementById("confirm-text");
    const $x       = document.getElementById("confirm-x");
    const $cancel  = document.getElementById("confirm-cancel");
    const $ok      = document.getElementById("confirm-ok");

    $title.textContent  = title;
    $header.textContent = header;
    $text.textContent   = message;

    // Botón OK: color + etiqueta
    $ok.className = `button ${okColor}`;
    const okLabelSpan = $ok.querySelector("span:last-child");
    if (okLabelSpan) okLabelSpan.textContent = okText;
    else $ok.textContent = okText;

    $cancel.textContent = cancelText;

    const close = (val) => {
      $m.classList.remove("is-active");
      $x.removeEventListener("click", onCancel);
      $cancel.removeEventListener("click", onCancel);
      $ok.removeEventListener("click", onOk);
      document.removeEventListener("keydown", onEsc);
      resolve(val);
    };
    const onCancel = () => close(false);
    const onOk     = () => close(true);
    const onEsc    = (e) => { if (e.key === "Escape") close(false); };

    $x.addEventListener("click", onCancel);
    $cancel.addEventListener("click", onCancel);
    $ok.addEventListener("click", onOk);
    document.addEventListener("keydown", onEsc);

    $m.classList.add("is-active");
    $ok.focus();
  });
}

function openNoteModal(id, datoCurioso=""){
  editingFavId = id;
  $noteId.value = id;
  $noteText.value = datoCurioso || "";
  $modalNote.classList.add("is-active");
}
function closeNoteModal(){
  editingFavId = null;
  $modalNote.classList.remove("is-active");
}

// Helpers para abrir/cerrar modal de creación
function openCreateModal(){
  if($createForm) $createForm.reset();
  $modalCreate.classList.add("is-active");
}
function closeCreateModal(){
  $modalCreate.classList.remove("is-active");
}

// Helper: ¿ya es favorito este cca3?
const isFavorite = (cca3) => FAVORITES.some(f => f.cca3 === cca3);

// =======================
// Countries: load + render
// =======================
function renderCountries(list){
  if(!list.length){
    $cards.innerHTML = `
      <div class="column is-12">
        <article class="message is-warning">
          <div class="message-body">No se encontraron países con estos criterios.</div>
        </article>
      </div>`;
    return;
  }

  $cards.innerHTML = list.map(c => {
    const flag   = c.flags?.png || c.flags?.svg || "";
    const name   = c.name?.common || c.cca3;
    const cap    = (c.capital && c.capital[0]) ? c.capital[0] : "—";
    const langs  = c.languages ? Object.values(c.languages).join(", ") : "—";
    const region = c.region || "—";
    const pop    = c.population?.toLocaleString() || "—";

    const alreadyFav   = isFavorite(c.cca3);
    const disabledAttr = alreadyFav ? 'disabled aria-disabled="true"' : '';
    const titleAttr    = alreadyFav ? 'Ya en favoritos' : 'Agregar a favoritos';

    return `
      <div class="column is-12-mobile is-6-tablet is-4-desktop">
        <div class="card">
          <div class="card-content">
            <div class="media">
              <div class="media-left">
                <img class="flag" src="${flag}" alt="${name}" onerror="this.src='https://via.placeholder.com/64x44?text=%20'"/>
              </div>
              <div class="media-content">
                <p class="title is-5">${name}</p>
                <div class="tags mb-2">
                  <span class="tag is-info is-light is-badge">${region}</span>
                  <span class="tag is-primary is-light is-badge">Pob: ${pop}</span>
                </div>
                <p class="is-size-7"><strong>Capital:</strong> ${cap}</p>
                <p class="is-size-7"><strong>Idiomas:</strong> ${langs}</p>
              </div>
            </div>
            <div class="buttons mt-3">
              <button
                class="button is-link is-light"
                onclick='onAddFavorite("${c.cca3}")'
                ${disabledAttr}
                title="${titleAttr}"
              >
                <span class="icon"><i class="fa-solid fa-star"></i></span>
                <span>${titleAttr}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function applyFilters(){
  const q      = ($fName.value||"").trim().toLowerCase();
  const region = $fRegion.value;
  const lang   = $fLanguage.value;

  FILTERED = COUNTRIES.filter(c => {
    const name     = (c.name?.common || "").toLowerCase();
    const okName   = !q || name.includes(q);
    const okRegion = !region || c.region === region;
    const langs    = c.languages ? Object.values(c.languages) : [];
    const okLang   = !lang || langs.includes(lang);
    return okName && okRegion && okLang;
  });
  renderCountries(FILTERED);
}

async function loadCountries(){
  show($spinner);
  try{
    const res  = await fetch(COUNTRIES_URL);
    const data = await res.json();
    COUNTRIES  = data.sort((a,b)=> (a.name?.common||"").localeCompare(b.name?.common||""));

    const regions   = [...new Set(COUNTRIES.map(c => c.region).filter(Boolean))].sort();
    const languages = [...new Set(COUNTRIES.flatMap(c => c.languages ? Object.values(c.languages) : []).filter(Boolean))].sort();

    document.getElementById("f-region").innerHTML =
      `<option value="">Todas</option>` + regions.map(r=> `<option value="${r}">${r}</option>`).join("");

    document.getElementById("f-language").innerHTML =
      `<option value="">Todos</option>` + languages.map(l=> `<option value="${l}">${l}</option>`).join("");

    // Cargar países propios desde MockAPI 
    await loadCustomCountries();

    applyFilters();
  }catch(e){
    console.error(e);
    toast("No se pudieron cargar los países.", "danger");
  }finally{
    hide($spinner);
  }
}

// cargar países propios desde MockAPI 
async function loadCustomCountries(){
  if(!CUSTOM_COUNTRIES_URL || !CUSTOM_COUNTRIES_URL.includes("http")) return;
  try{
    const res = await fetch(CUSTOM_COUNTRIES_URL);
    if(!res.ok) return;
    const custom = await res.json();

    // mapear al mismo shape de REST Countries
    const mapped = custom.map(item => ({
      cca3: (item.cca3 || "").toUpperCase(),
      name: { common: item.name || item.cca3 || "—" },
      region: item.region || "",
      capital: item.capital ? [item.capital] : [],
      languages: parseLanguagesToObject(item.languages),
      population: Number(item.population) || 0,
      flags: { png: item.flag || "", svg: item.flag || "" }
    }));

    // mezclar y ordenar
    COUNTRIES = [...COUNTRIES, ...mapped]
      .sort((a,b)=> (a.name?.common||"").localeCompare(b.name?.common||""));
  }catch(e){
    console.warn("No se pudieron cargar países propios:", e);
  }
}

// helper para pasar "es, en" -> {es:"es", en:"en"}
function parseLanguagesToObject(input){
  if(!input) return null;
  const arr = String(input).split(",").map(s=> s.trim()).filter(Boolean);
  if(!arr.length) return null;
  const obj = {};
  arr.forEach(lang => { obj[lang] = lang; });
  return obj;
}

// =======================
// Favorites (MockAPI) CRUD
// =======================
function renderFavorites(){
  if(!FAVORITES.length){
    $favTable.innerHTML = `<tr><td colspan="5" class="has-text-centered has-text-grey">Sin favoritos todavía.</td></tr>`;
    return;
  }
  $favTable.innerHTML = FAVORITES.map(f => `
    <tr>
      <td><img src="${f.flag||''}" alt="${f.name||f.cca3}" style="width:40px;height:28px;object-fit:cover;border-radius:4px" onerror="this.src='https://via.placeholder.com/40x28?text=%20'"></td>
      <td>${f.name||f.cca3}</td>
      <td>${f.region||'—'}</td>
      <td>${f.datoCurioso||'—'}</td>
      <td class="has-text-right">
        <button class="button is-warning is-light is-small" onclick='onEditNote("${f.id}","${(f.datoCurioso||'').replace(/"/g,'&quot;')}")'>
          <span class="icon"><i class="fa-solid fa-pen-to-square"></i></span>
        </button>
        <button class="button is-danger is-light is-small" onclick='onDeleteFavorite("${f.id}")'>
          <span class="icon"><i class="fa-solid fa-trash"></i></span>
        </button>
      </td>
    </tr>
  `).join("");
}

async function loadFavorites(){
  try{
    const res = await fetch(MOCKAPI_URL);
    FAVORITES = await res.json();
    renderFavorites();
    renderCountries(FILTERED.length ? FILTERED : COUNTRIES);
  }catch(e){
    console.warn("Error cargando favoritos:", e);
    toast("No se pudieron cargar los favoritos.", "warning");
  }
}

window.onAddFavorite = async function(cca3){
  if (isFavorite(cca3)) {
    toast("Este país ya está en tus favoritos.", "warning");
    return;
  }

  const c = COUNTRIES.find(x=> x.cca3 === cca3);
  if(!c){ toast("País no encontrado","warning"); return; }

  const body = {
    cca3: c.cca3,
    name: c.name?.common || c.cca3,
    region: c.region || "",
    flag: c.flags?.png || c.flags?.svg || "",
    datoCurioso: ""
  };

  try{
    const res = await fetch(MOCKAPI_URL, {
      method:"POST",
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    const created = await res.json();
    FAVORITES.push(created);
    renderFavorites();
    toast("Agregado a favoritos","success");
    renderCountries(FILTERED.length ? FILTERED : COUNTRIES);
  }catch(e){
    toast("No se pudo agregar a favoritos","danger");
  }
};

window.onDeleteFavorite = async function(id){
  const ok = await openBulmaConfirm({
    title: "Eliminar favorito",
    header: "Confirmación",
    message: "¿Querés eliminar este país de tus favoritos?",
    okText: "Eliminar",
    cancelText: "Cancelar",
    okColor: "is-danger"
  });
  if (!ok) return;

  try{
    await fetch(`${MOCKAPI_URL}/${id}`, { method:"DELETE" });
    FAVORITES = FAVORITES.filter(f=> f.id !== id);
    renderFavorites();
    toast("Favorito eliminado","success");
    renderCountries(FILTERED.length ? FILTERED : COUNTRIES);
  }catch(e){
    toast("Error al eliminar","danger");
  }
};

window.onEditNote = function(id, currentDato=""){
  openNoteModal(id, currentDato);
};

// Guardar “Dato curioso”
$noteSave.addEventListener("click", async ()=>{
  const id          = $noteId.value;
  const datoCurioso = $noteText.value.trim();
  try{
    const res = await fetch(`${MOCKAPI_URL}/${id}`, {
      method:"PUT",
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ datoCurioso })
    });
    const updated = await res.json();
    const idx = FAVORITES.findIndex(f=> f.id===id);
    if(idx>-1) FAVORITES[idx] = updated;
    renderFavorites();
    toast("Dato curioso actualizado","success");
    closeNoteModal();
  }catch(e){
    toast("No se pudo actualizar el dato curioso","danger");
  }
});

$noteCancel.addEventListener("click", closeNoteModal);
$noteClose .addEventListener("click", closeNoteModal);

// =======================
// Crear País (POST a MockAPI countries)
// =======================

// abrir/cerrar modal crear
$btnOpenCreate && $btnOpenCreate.addEventListener("click", openCreateModal);
$createCancel && $createCancel.addEventListener("click", closeCreateModal);
$createClose  && $createClose .addEventListener("click", closeCreateModal);

// guardar país
$createSave && $createSave.addEventListener("click", async ()=>{
  if(!$createForm) return;

  // tomar valores
  const fd = new FormData($createForm);
  const name       = (fd.get("name")||"").toString().trim();
  const region     = (fd.get("region")||"").toString().trim();
  const capital    = (fd.get("capital")||"").toString().trim();
  const languages  = (fd.get("languages")||"").toString().trim();
  const population = Number(fd.get("population")||0);
  const flag       = (fd.get("flag")||"").toString().trim(); 

  // validaciones mínimas 
  if(!name || !region){
    toast("Completá los campos obligatorios: nombre y región.", "warning");
    return;
  }

  // objeto para MockAPI countries 
  const payload = {
    name,
    region,
    capital,
    languages,     
    population,
    flag           
  };

  try{
    if(CUSTOM_COUNTRIES_URL && CUSTOM_COUNTRIES_URL.includes("http")){
      const res = await fetch(CUSTOM_COUNTRIES_URL, {
        method:"POST",
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      if(!res.ok) throw new Error("HTTP "+res.status);
      // mapear al shape de las cards y sumar a COUNTRIES
      const mapped = {
        name: { common: name },
        region,
        capital: capital ? [capital] : [],
        languages: parseLanguagesToObject(languages),
        population: population || 0,
        flags: { png: flag || "", svg: flag || "" }
      };
      COUNTRIES.push(mapped);
      // reordenar y refrescar
      COUNTRIES.sort((a,b)=> (a.name?.common||"").localeCompare(b.name?.common||""));
      applyFilters();
      closeCreateModal();
      toast("País creado con éxito.", "success");
    }else{
      // sin URL configurada: agregar localmente igual
      const mapped = {
        name: { common: name },
        region,
        capital: capital ? [capital] : [],
        languages: parseLanguagesToObject(languages),
        population: population || 0,
        flags: { png: flag || "", svg: flag || "" }
      };
      COUNTRIES.push(mapped);
      COUNTRIES.sort((a,b)=> (a.name?.common||"").localeCompare(b.name?.common||""));
      applyFilters();
      closeCreateModal();
      toast("País agregado localmente.", "warning");
    }
  }catch(e){
    console.error(e);
    toast("No se pudo crear el país.", "danger");
  }
});

// =======================
// Eventos filtros (individuales)
// =======================
$fName    .addEventListener("input",  applyFilters);
$fRegion  .addEventListener("change", applyFilters);
$fLanguage.addEventListener("change", applyFilters);

$btnClear .addEventListener("click", e=>{
  e.preventDefault();
  $fName.value=""; $fRegion.value=""; $fLanguage.value="";
  applyFilters();
});

$btnOpenFavs && $btnOpenFavs.addEventListener("click", e=>{
  e.preventDefault();
  document.querySelector(".favorites-box").scrollIntoView({behavior:"smooth"});
});

// =======================
// Init
// =======================
(async function init(){
  await loadCountries();   
  await loadFavorites();
})();