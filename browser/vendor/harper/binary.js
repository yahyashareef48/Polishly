import { BinaryModuleImpl } from "./BinaryModule-DmMIV9F-.js";
const binaryUrl = "" + new URL("harper_wasm_bg.wasm", import.meta.url).href;
const binary = /* @__PURE__ */ BinaryModuleImpl.create(binaryUrl);
export {
  binary
};
