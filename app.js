const COUNTRIES_URL = "https://restcountries.com/v3.1/all?fields=name,cca3,region,languages,flags,population,capital";
const MOCKAPI_URL   = "https://68bdeb02227c48698f85a6c4.mockapi.io/api/v1/favorites";

let COUNTRIES = [];
let FILTERED  = [];
let FAVORITES = [];

let editingFavId = null;

const $cards    = document.getElementById("cards");
const $favTable = document.getElementById("fav-table");
const $spinner  = document.getElementById("spinner");
const $alert    = document.getElementById("alert");

const $fName     = document.getElementById("f-name");
const $fRegion   = document.getElementById("f-region");
const $fLanguage = document.getElementById("f-language");
const $btnClear  = document.getElementById("btn-clear");

const $modalNote   = document.getElementById("modal-note");
const $noteId      = document.getElementById("note-id");
const $noteText    = document.getElementById("note-text");
const $noteSave    = document.getElementById("note-save");
const $noteCancel  = document.getElementById("note-cancel");
const $noteClose   = document.getElementById("note-close");

const $btnOpenFavs = document.getElementById("btn-open-favs");

const show = el => el.classList.remove("is-hidden");
const hide = el => el.classList.add("is-hidden");
function toast(msg, type="info"){
  $alert.textContent = msg;
  $alert.className = `notification is-${type}`;
  show($alert);
  setTimeout(()=> hide($alert), 2000);
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

const isFavorite = (cca3) => FAVORITES.some(f => f.cca3 === cca3);


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
  
      applyFilters();
    }catch(e){
      console.error(e);
      toast("No se pudieron cargar los países.", "danger");
    }finally{
      hide($spinner);
    }
  }

  async function loadFavorites(){
    try{
      const res = await fetch(MOCKAPI_URL);
      FAVORITES = await res.json();
      renderFavorites();
      // sincroniza estado de botones en cards
      renderCountries(FILTERED.length ? FILTERED : COUNTRIES);
    }catch(e){
      console.warn("Error cargando favoritos:", e);
      toast("No se pudieron cargar los favoritos.", "warning");
    }
  }

  function renderFavorites(){
    if(!FAVORITES.length){
      $favTable.innerHTML = `<tr><td colspan="5" class="has-text-centered has-text-grey">Sin favoritos todavía.</td></tr>`;
      return;
    }
    $favTable.innerHTML = FAVORITES.map(f => `
      <tr>
        <td><img src="${f.flag||''}" alt="${f.name||f.cca3}" style="width:40px;height:28px;object-fit:cover;border-radius:4px"></td>
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
    if(!confirm("¿Eliminar este favorito?")) return;
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
  

$fName    .addEventListener("input", applyFilters);
$fRegion  .addEventListener("change", applyFilters);
$fLanguage.addEventListener("change", applyFilters);
$btnClear .addEventListener("click", e=>{
  e.preventDefault();
  $fName.value=""; $fRegion.value=""; $fLanguage.value="";
  applyFilters();
});

const $btnOpenFavs = document.getElementById("btn-open-favs");

$btnOpenFavs && $btnOpenFavs.addEventListener("click", e=>{
    e.preventDefault();
    document.querySelector(".favorites-box").scrollIntoView({behavior:"smooth"});
  });

