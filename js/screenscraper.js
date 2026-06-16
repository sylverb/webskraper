// screenscraper.js — ScreenScraper API client
import { API, REGION_PREF } from "./config.js";

export class FatalError extends Error {}

export class ScreenScraperClient {
  constructor({ creds, limiter }) {
    this.creds = creds;            // {devid, devpassword, softname, ssid?, sspassword?}
    this.limiter = limiter;
    this.requestsMade = 0;
  }

  params(extra = {}) {
    return new URLSearchParams({ output: "json", ...this.creds, ...extra });
  }

  // Single choke point: throttled + counted. Throws FatalError on stop codes.
  async get(url) {
    await this.limiter.acquire();
    this.requestsMade += 1;
    const r = await fetch(url);
    if ([423, 426, 430, 431].includes(r.status)) {
      throw new FatalError(`Code ${r.status} (quota/accès)`);
    }
    return r;
  }

  async jeuInfos(extra) {
    return this.get(API + "jeuInfos.php?" + this.params(extra));
  }

  // Read the account's per-minute / per-day limits, or null on failure.
  async userQuota() {
    try {
      const r = await this.get(API + "ssuserInfos.php?" + this.params());
      if (!r.ok) return null;
      const u = (await r.json()).response.ssuser;
      const gi = (...keys) => {
        for (const k of keys) {
          const v = parseInt(u[k], 10);
          if (!isNaN(v)) return v;
        }
        return null;
      };
      return {
        perMin: gi("maxrequestspermin", "maxrequestsperdmin"),
        perDay: gi("maxrequestsperday"),
        today: gi("requeststoday"),
      };
    } catch (e) {
      return null;
    }
  }

  // Pick the best media of a given ScreenScraper type (by region preference).
  pickMedia(jeu, ssType, regions = REGION_PREF) {
    const cands = (jeu.medias || []).filter((m) => m.type === ssType && m.url);
    cands.sort((a, b) => {
      const ra = regions.indexOf(a.region);
      const rb = regions.indexOf(b.region);
      return (ra < 0 ? 99 : ra) - (rb < 0 ? 99 : rb);
    });
    return cands[0] || null;
  }
}

// Pick a readable name from a system's `noms` block, with fallbacks (the exact
// key names vary across ScreenScraper versions, so stay defensive).
function systemName(sys) {
  const n = sys.noms || {};
  const pick =
    n.nom_eu || n.nom_us || n.nom_jp || n.noms_commun || n.nom_recalbox ||
    Object.values(n).find((v) => typeof v === "string" && v.trim());
  return String(pick || sys.nom || `System ${sys.id}`).trim();
}

// Fetch the full list of systems from ScreenScraper -> [{id, name}] sorted by
// name. `creds` = {devid, devpassword, softname, ssid?, sspassword?}.
export async function fetchSystems(creds) {
  const params = new URLSearchParams({ output: "json", ...creds });
  const r = await fetch(API + "systemesListe.php?" + params);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  let list = data && data.response && data.response.systemes;
  if (!Array.isArray(list)) list = list ? Object.values(list) : [];
  return list
    .map((s) => ({ id: parseInt(s.id, 10), name: systemName(s) }))
    .filter((s) => s.id && s.name)
    .sort((a, b) => a.name.localeCompare(b.name));
}