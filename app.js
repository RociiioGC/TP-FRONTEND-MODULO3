// Configuracion inicial
// =======================
const COUNTRIES_URL = "https://restcountries.com/v3.1/all?fields=name,cca3,region,languages,flags,population,capital";
const MOCKAPI_URL   = "https://68bdeb02227c48698f85a6c4.mockapi.io/api/v1/favorites";

let COUNTRIES = [];
let FILTERED  = [];
let FAVORITES = [];

let editingFavId = null;