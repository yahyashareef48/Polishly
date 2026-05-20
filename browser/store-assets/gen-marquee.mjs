import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ICON_SVG = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7c6cf0"/><stop offset="100%" stop-color="#5a4bd1"/></linearGradient><linearGradient id="sh" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fff" stop-opacity=".25"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect x="4" y="4" width="120" height="120" rx="28" fill="url(#bg)"/><rect x="4" y="4" width="120" height="120" rx="28" fill="url(#sh)"/><path d="M64 24 L72 52 L100 60 L72 68 L64 96 L56 68 L28 60 L56 52 Z" fill="#fff"/><path d="M96 20 L99 30 L109 33 L99 36 L96 46 L93 36 L83 33 L93 30 Z" fill="#fff" opacity=".7"/><path d="M34 82 L37 90 L45 93 L37 96 L34 104 L31 96 L23 93 L31 90 Z" fill="#fff" opacity=".5"/></svg>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 560 }, deviceScaleFactor: 1 });
await page.setContent(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}</style></head><body>
<div style="width:100vw;height:100vh;background:linear-gradient(145deg,#0c0c14,#12101f);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;position:relative;">
  <div style="position:absolute;width:500px;height:500px;background:radial-gradient(circle,rgba(108,92,231,.15) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);"></div>
  <div style="width:72px;height:72px;position:relative;z-index:1;margin-bottom:22px">${ICON_SVG}</div>
  <div style="font-size:44px;font-weight:700;color:#f4f4f5;letter-spacing:-1px;position:relative;z-index:1;">Polishly</div>
  <div style="font-size:18px;color:#a1a1aa;max-width:480px;line-height:1.5;margin-top:10px;position:relative;z-index:1;">AI-powered text polishing, right where you type.<br>Fix grammar, change tone, or rewrite with custom instructions.</div>
  <div style="display:flex;gap:10px;margin-top:26px;position:relative;z-index:1;">
    <span style="padding:7px 16px;background:rgba(108,92,231,.15);border:1px solid rgba(108,92,231,.3);border-radius:20px;font-size:13px;color:#c4b5fd;">Fix Grammar</span>
    <span style="padding:7px 16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:20px;font-size:13px;color:#d4d4d8;">Change Tone</span>
    <span style="padding:7px 16px;background:rgba(108,92,231,.15);border:1px solid rgba(108,92,231,.3);border-radius:20px;font-size:13px;color:#c4b5fd;">Custom Instructions</span>
    <span style="padding:7px 16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:20px;font-size:13px;color:#d4d4d8;">Gemini AI</span>
  </div>
</div></body></html>`, { waitUntil: 'load' });
await page.waitForTimeout(300);
const out = path.join(__dirname, 'marquee-1400x560.png');
await page.screenshot({ path: out, type: 'png' });
console.log(`Done: ${out}`);
await browser.close();
