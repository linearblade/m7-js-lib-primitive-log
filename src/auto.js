// log/auto.js
//
// Registers this primitive into the m7-lib hierarchy when running in a browser
// with `window.lib` available.
//
// This file is OPTIONAL for standalone usage. It exists only for m7-lib wiring.

import Manager from "./Manager.js";
import Worker from "./Worker.js";
import utils from "./utils.js";
import * as constants from "./constants.js";

const MOD = "[primitive.log]";

// Browser + lib guard
const lib = (typeof window !== "undefined" && window.lib) ? window.lib : null;

if (!lib) {
  throw new Error(`${MOD} requires window.lib (browser environment).`);
}

if (typeof lib?.hash?.set !== "function") {
  throw new Error(`${MOD} requires lib.hash.set (m7-lib not installed or incomplete).`);
}

// Exportable module object (handy for lib consumers)
const log = {
  Manager,
  Worker,
  utils,
  constants
};

// Register into lib hierarchy (idempotent / overwrite-safe)
lib.hash.set(lib, "primitive.log", log);

// Optional conveniences (uncomment if you want shorter paths)
// lib.hash.set(lib, "log", log);

export { log, Manager, Worker, utils, constants };
export default log;
