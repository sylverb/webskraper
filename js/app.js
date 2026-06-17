// app.js — UI wiring + run orchestration (the glue tying the modules together).
import { ext, stem, canvasToBlob, downloadBlob, formatBytes } from "./util.js";
import { SOFTNAME, SINGLE_MEDIA, devCreds, SYSTEMS } from "./config.js";
import { RateLimiter } from "./rate-limiter.js";
import { createHashers, hashFile } from "./hashing.js";
import { ScreenScraperClient, FatalError, fetchSystems } from "./screenscraper.js";
import { MixResolver, renderComposition, isValidMix, gameRegionsFor } from "./mix-engine.js";
import { BUILTIN_MIXES } from "./mixes.js";
import { buildPlan } from "./scanner.js";
import { cache, clearCache, cacheStats } from "./cache.js";
import { toGWCover, gwOutputName, MAX_BYTES as GW_MAX_BYTES } from "./gw.js";
import { t, initI18n } from "./i18n.js";

const $ = (id) => document.getElementById(id);
const logEl = $("log");
const bar = $("bar");
const statusEl = $("status");
const previewImg = $("preview");
const previewName = $("previewName");
let lastPreviewUrl = null;
let cancel = false;

const log = (m) => {
  logEl.textContent += m + "\n";
  logEl.scrollTop = logEl.scrollHeight;
};

// Refresh the cache size/counters line.
async function refreshCacheStats() {
  try {
    const s = await cacheStats();
    $("cacheStats").textContent = t("cacheStatsLine", {
      games: s.games,
      media: s.media,
      size: formatBytes(s.bytes),
    });
  } catch (e) {
    $("cacheStats").textContent = "";
  }
}

// Show the most recently produced cover in the preview box.
function showPreview(blob, name) {
  try {
    if (!blob) {
      log(t("previewEmpty", { name }));
      return;
    }
    if (lastPreviewUrl) URL.revokeObjectURL(lastPreviewUrl);
    lastPreviewUrl = URL.createObjectURL(blob);
    previewImg.onerror = () => log(t("previewError", { name }));
    previewImg.src = lastPreviewUrl;
    previewImg.style.display = "block";
    previewName.textContent = name;
  } catch (e) {
    log(t("previewErr2", { msg: e.message }));
  }
}

function readCreds() {
  const c = {
    ...devCreds(), // embedded dev id / password
    softname: SOFTNAME,
  };
  if ($("ssid").value.trim()) {
    c.ssid = $("ssid").value.trim();
    c.sspassword = $("sspassword").value.trim();
  }
  return c;
}

// --- Optional account persistence -------------------------------------------
// Stored in localStorage on this device. NOTE: the password is kept in clear
// text, like any "remember me" box; only enable it on a device you trust.
const ACCOUNT_KEY = "coverscraper.account";
function saveAccount() {
  const ssid = $("ssid").value.trim();
  if (!ssid) return localStorage.removeItem(ACCOUNT_KEY);
  localStorage.setItem(
    ACCOUNT_KEY,
    JSON.stringify({ ssid, sspassword: $("sspassword").value })
  );
}
function forgetAccount() {
  localStorage.removeItem(ACCOUNT_KEY);
}
function loadAccount() {
  try {
    const a = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null");
    if (a && a.ssid) {
      $("ssid").value = a.ssid;
      $("sspassword").value = a.sspassword || "";
      $("remember").checked = true;
    }
  } catch (e) {}
}

// Get a media Blob, from the local cache if present, otherwise from the network
// (and cache it). Returns null on failure or non-image (NOMEDIA) responses.
async function fetchMediaBlob(client, url, useCache) {
  if (useCache) {
    const cached = await cache.getMedia(url).catch(() => null);
    if (cached) return cached;
  }
  const r = await client.get(url);
  if (!r.ok) return null;
  const blob = await r.blob();
  if (blob.type && blob.type.startsWith("text")) return null; // NOMEDIA / error page
  if (useCache) await cache.setMedia(url, blob).catch(() => {});
  return blob;
}

// Fetch a media URL and decode it into an ImageBitmap for the canvas.
// Bytes come through fetch (CORS-clean) so the canvas is never tainted.
function makeImageFetcher(client, useCache) {
  return async (url) => {
    try {
      const blob = await fetchMediaBlob(client, url, useCache);
      return blob ? await createImageBitmap(blob) : null;
    } catch (e) {
      if (e instanceof FatalError) throw e;
      return null;
    }
  };
}

async function run() {
  cancel = false;
  logEl.textContent = "";
  const files = Array.from($("folder").files);
  if (!files.length) return alert(t("alertFolder"));

  const source = $("source").value; // "ss" | "box" | "mix3" | "mix4" | "mix5" | "mixcustom"
  const isMix = source.startsWith("mix");
  const mixFile = $("mixxml").files[0];
  if (source === "mixcustom" && !mixFile) return alert(t("alertMix"));

  $("run").disabled = true;
  $("stop").disabled = false;

  const useCache = $("useCache").checked;
  const convert = $("convert").value; // "none" | "gw"
  const creds = readCreds();
  const hasAccount = !!(creds.ssid && creds.sspassword);
  const limiter = new RateLimiter(20);
  const client = new ScreenScraperClient({ creds, limiter });
  const fetchImage = makeImageFetcher(client, useCache);

  // Rate limiter from the account quota (this call also validates the login).
  const q = await client.userQuota();
  if (hasAccount && q.status === "bad") {
    $("run").disabled = false;
    $("stop").disabled = true;
    alert(t("badAccount"));
    return;
  }
  if (q && q.perMin) {
    limiter.max = Math.max(1, Math.floor(q.perMin * 0.9));
    log(
      q.perDay
        ? t("accountFull", { perMin: q.perMin, perDay: q.perDay, today: q.today ?? 0, max: limiter.max })
        : t("accountBasic", { perMin: q.perMin, max: limiter.max })
    );
  } else {
    log(t("quotaUnreadable"));
  }

  const { roms, totalFiles } = buildPlan(files, {
    skipExisting: $("skipExisting").checked,
    forceSys: parseInt($("forceSys").value, 10) || null,
  });
  log(t("plan", { total: totalFiles, count: roms.length, source }));

  const mixXml = source === "mixcustom"
    ? await mixFile.text()
    : isMix ? BUILTIN_MIXES[source] : null;

  // Fail fast: a broken mix XML stops the whole run with one clear error.
  if (isMix && !isValidMix(mixXml)) {
    log(t("mixInvalid"));
    $("run").disabled = false;
    $("stop").disabled = true;
    return;
  }

  const hashers = await createHashers();
  const zip = new window.JSZip();

  // Add one cover to the zip, applying the chosen output format.
  async function addCover(rom, blob, defaultName) {
    let out = blob;
    let name = defaultName;
    if (convert === "gw") {
      out = await toGWCover(blob);
      name = gwOutputName(rom.parts, stem(rom.file.name));
      if (out && out.size > GW_MAX_BYTES)
        log(t("gwTooBig", { name: rom.file.name, size: formatBytes(out.size) }));
    }
    zip.file(name, out);
    showPreview(blob, rom.file.name); // always preview the full-size original
  }

  let ok = 0, miss = 0, fail = 0, done = 0;
  bar.max = roms.length;
  bar.value = 0;

  try {
    for (const rom of roms) {
      if (cancel) {
        log(t("stopped"));
        break;
      }
      done++;
      bar.value = done;
      statusEl.textContent =
        t("status", { done, total: roms.length, req: client.requestsMade }) +
        (q && q.perDay ? t("statusRem", { rem: q.perDay - (q.today || 0) - client.requestsMade }) : "");

      if (!rom.systemeid) {
        log(t("sysUnknown", { name: rom.file.name, folder: rom.sysShort }));
        fail++;
        continue;
      }

      try {
        const h = await hashFile(rom.file, hashers);
        const gameKey = `${rom.systemeid}:${h.md5}`;

        // jeuInfos: reuse the cached result if we already identified this ROM.
        let jeu = useCache ? await cache.getGame(gameKey).catch(() => null) : null;
        if (!jeu) {
          const r = await client.jeuInfos({
            systemeid: rom.systemeid,
            romtype: "rom",
            romnom: rom.file.name,
            romtaille: h.size,
            crc: h.crc,
            md5: h.md5,
            sha1: h.sha1,
          });
          if (r.status === 404) { log(t("noResult", { name: rom.file.name })); miss++; continue; }
          if (!r.ok) { log(t("httpErr", { status: r.status, name: rom.file.name })); fail++; continue; }
          try { jeu = (await r.json()).response.jeu; } catch (e) { jeu = null; }
          if (!jeu) { log(t("noResult", { name: rom.file.name })); miss++; continue; }
          if (useCache) await cache.setGame(gameKey, jeu).catch(() => {});
        }

        const base = rom.parts.slice(1, -1); // path inside the picked folder
        const baseName = stem(rom.file.name);

        if (isMix) {
          const gameRegions = gameRegionsFor(rom.file.name, jeu);
          const resolver = new MixResolver(jeu, fetchImage, undefined, gameRegions);
          const canvas = await renderComposition(mixXml, resolver);
          const got = [...resolver.cache.values()].filter(Boolean).length;
          if (got === 0) log(t("mixEmpty", { name: rom.file.name }));
          const blob = await canvasToBlob(canvas, "image/png");
          await addCover(rom, blob, base.concat(baseName + ".png").join("/"));
          log(t("mixOk", { name: rom.file.name, n: got }));
          ok++;
        } else {
          const mediaType = SINGLE_MEDIA[source] || "ss";
          const media = client.pickMedia(jeu, mediaType);
          if (!media) { log(t("noMedia", { type: mediaType, name: rom.file.name })); miss++; continue; }
          const blob = await fetchMediaBlob(client, media.url, useCache);
          if (!blob) { log(t("imgFailed", { status: "?", name: rom.file.name })); fail++; continue; }
          const fmt = (media.format || "png").toLowerCase();
          await addCover(rom, blob, base.concat(baseName + "." + fmt).join("/"));
          log(t("ssOk", { name: rom.file.name }));
          ok++;
        }
      } catch (e) {
        if (e instanceof FatalError) throw e;
        log(t("errGeneric", { name: rom.file.name, msg: e.message }));
        fail++;
      }
    }
  } catch (e) {
    log(e instanceof FatalError ? t("fatalStop", { msg: e.message }) : t("errRun", { msg: e.message }));
  }

  log(t("done", { ok, miss, fail, req: client.requestsMade }));
  if (ok > 0) {
    log(t("zipGen"));
    downloadBlob(await zip.generateAsync({ type: "blob" }), "covers.zip");
    log(t("zipDone"));
  } else {
    log(t("noImages"));
  }
  $("run").disabled = false;
  $("stop").disabled = true;
  refreshCacheStats();
}

// --- wiring ---
$("source").addEventListener("change", () => {
  $("mixRow").style.display = $("source").value === "mixcustom" ? "" : "none";
});
// Submitting the form (instead of a bare click) lets the browser offer to
// save the ScreenScraper user name / password in its password manager.
$("run-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if ($("remember").checked) saveAccount();
  run();
});
$("stop").addEventListener("click", () => {
  cancel = true;
  $("stop").disabled = true;
});
$("clearCache").addEventListener("click", async () => {
  try {
    await clearCache();
    log(t("cacheCleared"));
  } catch (e) {
    log(t("previewErr2", { msg: e.message }));
  }
  refreshCacheStats();
});
// Re-translate the dynamic cache line when the language changes.
$("lang").addEventListener("change", refreshCacheStats);

// Fill the system picker: "Automatic" (value "") + one option per system.
// The auto option carries data-i18n so applyTranslations localizes it.
function buildSystemPicker(list) {
  const sel = $("forceSys");
  const prev = sel.value; // preserve current choice across rebuilds
  sel.innerHTML = "";
  const auto = document.createElement("option");
  auto.value = "";
  auto.dataset.i18n = "forceSysAuto";
  auto.textContent = t("forceSysAuto");
  sel.appendChild(auto);
  for (const s of list) {
    const o = document.createElement("option");
    o.value = String(s.id);
    o.textContent = s.name;
    sel.appendChild(o);
  }
  sel.value = prev;
}

// The full system list comes from ScreenScraper (cached indefinitely in
// localStorage). The built-in SYSTEMS list is the offline / API-down fallback.
const SYS_CACHE_KEY = "coverscraper.systems";

async function initSystemPicker() {
  let list = SYSTEMS;
  try {
    const obj = JSON.parse(localStorage.getItem(SYS_CACHE_KEY) || "null");
    if (obj && Array.isArray(obj.list) && obj.list.length) {
      buildSystemPicker(obj.list);
      return;
    }
  } catch (e) {}
  buildSystemPicker(list);
  try {
    const apiList = await fetchSystems({ ...devCreds(), softname: SOFTNAME });
    if (apiList.length) {
      localStorage.setItem(SYS_CACHE_KEY, JSON.stringify({ list: apiList }));
      buildSystemPicker(apiList);
    }
  } catch (e) {
    /* keep the fallback/cached list silently */
  }
}

// Account persistence: save/forget on toggle, prefill on load.
$("remember").addEventListener("change", () =>
  $("remember").checked ? saveAccount() : forgetAccount()
);
loadAccount();

// --- URL parameters ---------------------------------------------------------
// Force the default output format via ?target=gw
function applyUrlDefaults() {
  try {
    const p = new URLSearchParams(window.location.search || "");
    if ((p.get("target") || "").toLowerCase() === "gw") $("convert").value = "gw";
  } catch (e) {
    /* ignore malformed URLSearchParams / unusual environments */
  }
}

applyUrlDefaults();

initSystemPicker();
initI18n();
refreshCacheStats();
