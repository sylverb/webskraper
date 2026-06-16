// scanner.js — turn a picked folder (FileList) into a ROM work list.
import { NON_ROM, IMAGE_EXT, SS_SYSTEM_MAP } from "./config.js";
import { ext, stem } from "./util.js";

// The system shortcode is the ROM's immediate parent folder name.
function systemShortcode(parts) {
  return parts.length >= 2 ? parts[parts.length - 2].toLowerCase() : null;
}

export function buildPlan(files, { skipExisting = true, forceSys = null } = {}) {
  // Index existing cover images by "dir/stem" to skip ROMs already done.
  const haveImage = new Set();
  for (const f of files) {
    if (IMAGE_EXT.has(ext(f.name))) {
      const parts = f.webkitRelativePath.split("/");
      haveImage.add(parts.slice(0, -1).join("/") + "/" + stem(f.name).toLowerCase());
    }
  }

  const roms = [];
  for (const f of files) {
    if (NON_ROM.has(ext(f.name)) || f.name.startsWith(".")) continue;
    const parts = f.webkitRelativePath.split("/");
    const dir = parts.slice(0, -1).join("/");
    if (skipExisting && haveImage.has(dir + "/" + stem(f.name).toLowerCase())) continue;

    const sysShort = systemShortcode(parts);
    const systemeid = forceSys || SS_SYSTEM_MAP[sysShort] || null;
    roms.push({ file: f, parts, sysShort, systemeid });
  }

  return { roms, totalFiles: files.length };
}
