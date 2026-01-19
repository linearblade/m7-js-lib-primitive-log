// index.js
import Manager from "./Manager.js";
import Worker from "./Worker.js";
import utils from "./utils.js";
import * as constants from "./constants.js";

// Handy named constant export (common import pattern)
export const { CONSOLE_LEVEL } = constants;

// Named exports
export { Manager, Worker, utils, constants };

// Default / namespace-style export
const log = { Manager, Worker, utils, constants, CONSOLE_LEVEL };
export { log };
export default log;
