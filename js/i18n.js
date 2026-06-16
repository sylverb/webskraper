// i18n.js — minimal internationalization (en / fr)

const STRINGS = {
  en: {
    // --- static UI ---
    title: "Cover Scraper — ScreenScraper",
    lead: "Select your ROM folder (subfolders included). Each game is identified by checksum (computed locally), then we fetch either the <strong>in-game</strong> screenshot or a <strong>mix composition</strong> (4 images) rendered on a canvas. Output is a <code>.zip</code> mirroring your folder tree.",
    langLabel: "Language",
    folderLegend: "1. ROM folder",
    skipExisting: "Ignore ROMs that already have an image next to them",
    useCacheLabel: "Use local cache (skip already-downloaded data)",
    clearCache: "Clear cache",
    cacheCleared: "Local cache cleared.",
    cacheStatsLine: "Cache: {games} games, {media} images (~{size})",
    outputLegend: "2. Output type",
    sourceLabel: "Source",
    sourceSs: "In-game image (screenshot)",
    sourceBox: "Box art (cover)",
    sourceMix3: "Mix — 3 images",
    sourceMix4: "Mix — 4 images",
    sourceMix5: "Mix — 5 images",
    sourceMixCustom: "Mix — custom file",
    convertLabel: "Output format",
    convertNone: "Original (no conversion)",
    convertGW: "Game & Watch Retro-Go SD (.img, JPEG < 10 KB)",
    gwTooBig: "{name}: {size} — still over 10 KB at minimum quality",
    mixLabel: "Composition XML file (e.g. “4 Images Mix [LD][4-3].xml”)",
    credsLegend: "3. screenscraper.fr credentials",
    credsNote: "Optional, but a screenscraper.fr account gives you a larger request quota than anonymous access.",
    ssidLabel: "User name",
    sspasswordLabel: "User password",
    forceSysLabel: "System (auto-detected from folders by default)",
    forceSysAuto: "Automatic (from subfolder names)",
    runBtn: "Get covers",
    stopBtn: "Stop",
    previewLegend: "Last cover",
    notesLegend: "Notes",
    notes: "<strong>No ROM is ever uploaded.</strong> All processing — checksums, image composition and zipping — happens locally in your browser. Only the ROM checksums, file names and sizes are sent to screenscraper.fr to identify each game.",
    // --- dynamic ---
    alertFolder: "Please choose your ROM folder first.",
    alertMix: "Select the composition XML file (mix).",
    mixInvalid: "Invalid mix XML — run aborted. Check the composition file.",
    accountFull: "Account: {perMin} req/min, {perDay}/day (used: {today}) → throttling to {max}/min.",
    accountBasic: "Account: {perMin} req/min → throttling to {max}/min.",
    quotaUnreadable: "Quota unreadable — defaulting to 20/min.",
    plan: "{total} files, {count} ROM(s) to process (source: {source}).",
    sysUnknown: "  [?] Unknown system for {name} (folder '{folder}') — skipped.",
    noResult: "  [-] No result: {name}",
    httpErr: "  [!] HTTP {status}: {name}",
    noMedia: "  [-] No '{type}' media for {name}",
    imgFailed: "  [!] Image failed ({status}): {name}",
    mixEmpty: "  [!] No image resolved (empty composition): {name} — check available media and the XML.",
    mixOk: "  [+] Mix: {name} ({n} image(s) composed)",
    ssOk: "  [+] OK: {name}",
    previewEmpty: "  [!] Preview unavailable (empty image): {name}",
    previewError: "  [!] Preview failed to display: {name}",
    previewErr2: "  [!] Preview error: {msg}",
    errGeneric: "  [!] Error {name}: {msg}",
    fatalStop: "\n[!] ScreenScraper STOP: {msg}",
    errRun: "\n[!] Error: {msg}",
    stopped: "\n[!] Stopped.",
    done: "\nDone. OK: {ok} | No result: {miss} | Failed: {fail} | Requests: {req}",
    zipGen: "Generating .zip…",
    zipDone: "Download started.",
    noImages: "No image produced — no .zip.",
    status: "{done}/{total} — req: {req}",
    statusRem: " — remaining ~{rem}",
  },
  fr: {
    // --- static UI ---
    title: "Cover Scraper — ScreenScraper",
    lead: "Sélectionne ton dossier de ROMs (sous-dossiers inclus). Chaque jeu est identifié par empreinte (calcul local), puis on récupère soit l'image <strong>in-game</strong>, soit une <strong>composition mix</strong> (4 images) rendue sur canvas. Résultat en <code>.zip</code> reprenant l'arborescence.",
    langLabel: "Langue",
    folderLegend: "1. Dossier de ROMs",
    skipExisting: "Ignorer les ROMs qui ont déjà une image à côté",
    useCacheLabel: "Utiliser le cache local (éviter de retélécharger)",
    clearCache: "Vider le cache",
    cacheCleared: "Cache local vidé.",
    cacheStatsLine: "Cache : {games} jeux, {media} images (~{size})",
    outputLegend: "2. Type de sortie",
    sourceLabel: "Source",
    sourceSs: "Image in-game (screenshot)",
    sourceBox: "Jaquette (box art)",
    sourceMix3: "Mix — 3 images",
    sourceMix4: "Mix — 4 images",
    sourceMix5: "Mix — 5 images",
    sourceMixCustom: "Mix — fichier perso",
    convertLabel: "Format de sortie",
    convertNone: "Original (sans conversion)",
    convertGW: "Game & Watch Retro-Go SD (.img, JPEG < 10 Ko)",
    gwTooBig: "{name} : {size} — dépasse encore 10 Ko à qualité minimale",
    mixLabel: "Fichier XML de composition (ex : « 4 Images Mix [LD][4-3].xml »)",
    credsLegend: "3. Identifiants screenscraper.fr",
    credsNote: "Optionnel, mais disposer d'un compte screenscraper.fr donne un quota de requêtes plus élevé qu'un accès anonyme.",
    ssidLabel: "Pseudo utilisateur",
    sspasswordLabel: "Mot de passe utilisateur",
    forceSysLabel: "Système (détecté automatiquement par défaut)",
    forceSysAuto: "Automatique (d'après les sous-dossiers)",
    runBtn: "Récupérer les covers",
    stopBtn: "Arrêter",
    previewLegend: "Dernière cover",
    notesLegend: "Notes",
    notes: "<strong>Aucune ROM n'est envoyée à un serveur.</strong> Tous les traitements — calcul des empreintes, composition des images, création du zip — se font localement dans ton navigateur. Seules les empreintes des ROMs, leurs noms de fichier et leurs tailles sont transmis à screenscraper.fr pour identifier chaque jeu.",
    // --- dynamic ---
    alertFolder: "Choisis d'abord ton dossier de ROMs.",
    alertMix: "Sélectionne le fichier XML de composition (mix).",
    mixInvalid: "XML de mix invalide — traitement annulé. Vérifie le fichier de composition.",
    accountFull: "Compte : {perMin} req/min, {perDay}/jour (utilisées : {today}) → bridage à {max}/min.",
    accountBasic: "Compte : {perMin} req/min → bridage à {max}/min.",
    quotaUnreadable: "Quota illisible — bridage par défaut à 20/min.",
    plan: "{total} fichiers, {count} ROM(s) à traiter (source : {source}).",
    sysUnknown: "  [?] Système inconnu pour {name} (dossier « {folder} ») — ignoré.",
    noResult: "  [-] Aucun résultat : {name}",
    httpErr: "  [!] HTTP {status} : {name}",
    noMedia: "  [-] Pas de média « {type} » pour {name}",
    imgFailed: "  [!] Image échouée ({status}) : {name}",
    mixEmpty: "  [!] Aucune image résolue (composition vide) : {name} — vérifie les médias disponibles et le XML.",
    mixOk: "  [+] Mix : {name} ({n} image(s) composées)",
    ssOk: "  [+] OK : {name}",
    previewEmpty: "  [!] Aperçu impossible (image vide) : {name}",
    previewError: "  [!] L'aperçu n'a pas pu s'afficher : {name}",
    previewErr2: "  [!] Erreur aperçu : {msg}",
    errGeneric: "  [!] Erreur {name} : {msg}",
    fatalStop: "\n[!] ScreenScraper STOP : {msg}",
    errRun: "\n[!] Erreur : {msg}",
    stopped: "\n[!] Arrêté.",
    done: "\nTerminé. OK : {ok} | Sans résultat : {miss} | Échecs : {fail} | Requêtes : {req}",
    zipGen: "Génération du .zip…",
    zipDone: "Téléchargement lancé.",
    noImages: "Aucune image produite — pas de .zip.",
    status: "{done}/{total} — req : {req}",
    statusRem: " — restant ~{rem}",
  },
};

const SUPPORTED = ["en", "fr"];
const STORE_KEY = "coverscraper.lang";
let current = "en";

function detectLang() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch (e) { /* localStorage may be unavailable */ }
  const l = (navigator.language || "en").toLowerCase();
  return l.startsWith("fr") ? "fr" : "en";
}

export function setLang(lang) {
  current = SUPPORTED.includes(lang) ? lang : "en";
  try { localStorage.setItem(STORE_KEY, current); } catch (e) { /* ignore */ }
  applyTranslations();
}

export function t(key, params = {}) {
  const table = STRINGS[current] || STRINGS.en;
  let s = table[key] != null ? table[key] : STRINGS.en[key] != null ? STRINGS.en[key] : key;
  for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

export function applyTranslations() {
  document.documentElement.lang = current;
  document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.setAttribute("placeholder", t(el.dataset.i18nPh));
  });
}

export function initI18n() {
  current = detectLang();
  const sel = document.getElementById("lang");
  if (sel) {
    sel.value = current;
    sel.addEventListener("change", () => setLang(sel.value));
  }
  applyTranslations();
}