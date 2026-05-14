import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = __dirname;

const PAGES = [
  {
    name: 'screenshot-1-trigger',
    width: 1280, height: 800,
    html: () => page_trigger(),
  },
  {
    name: 'screenshot-2-popup',
    width: 1280, height: 800,
    html: () => page_popup(),
  },
  {
    name: 'screenshot-3-result',
    width: 1280, height: 800,
    html: () => page_result(),
  },
  {
    name: 'promo-1280x800',
    width: 1280, height: 800,
    html: () => page_promo(),
  },
  {
    name: 'promo-440x280',
    width: 440, height: 280,
    html: () => page_promo_small(),
  },
  {
    name: 'store-icon-128',
    width: 128, height: 128,
    html: () => page_icon(),
  },
];

/* ── shared CSS ── */
const CSS = `
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e4e4e8; overflow:hidden; }
.frame { width:100vw; height:100vh; background:linear-gradient(145deg,#0f0f14,#16161d); display:flex; flex-direction:column; }
.bar { height:44px; background:#18181b; border-bottom:1px solid rgba(255,255,255,.06); display:flex; align-items:center; padding:0 16px; gap:8px; flex-shrink:0; }
.dot { width:12px; height:12px; border-radius:50%; }
.d-r { background:#f87171; } .d-y { background:#fbbf24; } .d-g { background:#34d399; }
.url { flex:1; margin-left:12px; background:rgba(255,255,255,.06); border-radius:6px; padding:6px 14px; font-size:12px; color:#71717a; }
.page { flex:1; padding:60px 100px; display:flex; flex-direction:column; justify-content:center; position:relative; }
.ta { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:20px 24px; font-size:16px; line-height:1.7; color:#d4d4d8; position:relative; }
.ta .lbl { font-size:13px; color:#71717a; margin-bottom:10px; }
.sel { background:rgba(108,92,231,.25); border-radius:3px; padding:1px 2px; }

.trig { width:30px; height:30px; background:linear-gradient(135deg,#7c6cf0,#5a4bd1); border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 12px rgba(108,92,231,.4); position:absolute; }

.pop { background:rgba(20,20,24,.85); backdrop-filter:blur(20px) saturate(1.4); border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:12px; width:270px; box-shadow:0 12px 40px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.04) inset; position:absolute; }
.pop .hdr { font-weight:700; font-size:11px; color:#a78bfa; margin-bottom:10px; letter-spacing:1.2px; text-transform:uppercase; }
.pop .btn { display:block; width:100%; padding:8px 12px; margin-bottom:6px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); border-radius:8px; color:#d4d4d8; font-size:12.5px; text-align:left; }
.pop .btn.act { background:rgba(108,92,231,.12); border-color:rgba(108,92,231,.4); color:#f0f0f4; }
.pop .tr { display:flex; gap:6px; margin-bottom:6px; }
.pop .tr .btn { flex:1; text-align:center; margin-bottom:0; }
.pop .tr select { flex:1; padding:8px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); border-radius:8px; color:#d4d4d8; font-size:12.5px; appearance:none; }
.pop .cr { display:flex; gap:6px; }
.pop .cr input { flex:1; padding:8px 10px; background:rgba(0,0,0,.25); border:1px solid rgba(255,255,255,.08); border-radius:8px; color:#71717a; font-size:12.5px; }
.pop .cr .btn { width:auto; padding:8px 16px; margin-bottom:0; text-align:center; }

.res { background:rgba(20,20,24,.85); backdrop-filter:blur(20px) saturate(1.4); border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:12px; width:380px; box-shadow:0 12px 40px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.04) inset; position:absolute; }
.res .hdr { font-weight:700; font-size:11px; color:#a78bfa; margin-bottom:10px; letter-spacing:1.2px; text-transform:uppercase; }
.res .rt { background:rgba(0,0,0,.3); border:1px solid rgba(255,255,255,.06); border-radius:8px; padding:12px; margin-bottom:10px; font-size:13.5px; line-height:1.6; color:#d4d4d8; }
.res .acts { display:flex; gap:6px; }
.res .acts .btn { flex:1; text-align:center; padding:8px 12px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); border-radius:8px; color:#d4d4d8; font-size:12.5px; }
.res .acts .pri { background:linear-gradient(135deg,#7c6cf0,#5a4bd1); border-color:transparent; color:#fff; font-weight:500; }
.res .acts .cls { background:transparent; border-color:rgba(255,255,255,.06); color:#71717a; }
`;

const PEN_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;

const ICON_SVG = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7c6cf0"/><stop offset="100%" stop-color="#5a4bd1"/></linearGradient>
  <linearGradient id="sh" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fff" stop-opacity=".25"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
  <rect x="4" y="4" width="120" height="120" rx="28" fill="url(#bg)"/><rect x="4" y="4" width="120" height="120" rx="28" fill="url(#sh)"/>
  <path d="M64 24 L72 52 L100 60 L72 68 L64 96 L56 68 L28 60 L56 52 Z" fill="#fff"/>
  <path d="M96 20 L99 30 L109 33 L99 36 L96 46 L93 36 L83 33 L93 30 Z" fill="#fff" opacity=".7"/>
  <path d="M34 82 L37 90 L45 93 L37 96 L34 104 L31 96 L23 93 L31 90 Z" fill="#fff" opacity=".5"/>
</svg>`;

function wrap(body, extraCss = '') {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${CSS}${extraCss}</style></head><body>${body}</body></html>`;
}

function page_trigger() {
  return wrap(`
  <div class="frame">
    <div class="bar"><div class="dot d-r"></div><div class="dot d-y"></div><div class="dot d-g"></div><div class="url">mail.google.com/compose</div></div>
    <div class="page">
      <div class="ta" style="min-height:220px">
        <div class="lbl">Compose email</div>
        Hi Team,<br><br>
        I wanted to follow up on the <span class="sel">project deliverbles that was due last wendsday, their are a few items that needs to be adressed before we can move forwrd</span>. Let me know your thoughts.<br><br>
        Thanks,<br>Sarah
        <div class="trig" style="top:52px; right:-50px">${PEN_SVG}</div>
      </div>
    </div>
  </div>`);
}

function page_popup() {
  return wrap(`
  <div class="frame">
    <div class="bar"><div class="dot d-r"></div><div class="dot d-y"></div><div class="dot d-g"></div><div class="url">app.slack.com/client</div></div>
    <div class="page">
      <div class="ta" style="min-height:180px">
        <div class="lbl">Message #general</div>
        Hey everyone, <span class="sel">i think we should probly schedule a meeting to talk about the new feature thats been requested by the client</span>
      </div>
      <div class="pop" style="top:50%; right:120px; transform:translateY(-50%)">
        <div class="hdr">Polishly</div>
        <div class="btn act">Fix Spelling &amp; Grammar</div>
        <div class="tr"><div class="btn">Change Tone</div><select><option>Formal</option></select></div>
        <div class="cr"><input value="Make it more professional" /><div class="btn">Go</div></div>
      </div>
    </div>
  </div>`);
}

function page_result() {
  return wrap(`
  <div class="frame">
    <div class="bar"><div class="dot d-r"></div><div class="dot d-y"></div><div class="dot d-g"></div><div class="url">notion.so/meeting-notes</div></div>
    <div class="page">
      <div class="ta" style="min-height:180px; opacity:.35">
        <div class="lbl">Meeting Notes</div>
        The team discussed the upcoming <span class="sel">product lanch timline and agred that we need to prioritize the core fetures before adding any additional functionalty</span>.
      </div>
      <div class="res" style="top:50%;left:50%;transform:translate(-50%,-50%)">
        <div class="hdr">Polishly</div>
        <div class="rt">The team discussed the upcoming product launch timeline and agreed that we need to prioritize the core features before adding any additional functionality.</div>
        <div class="acts">
          <div class="btn">Copy</div>
          <div class="btn pri">Replace</div>
          <div class="btn cls">Close</div>
        </div>
      </div>
    </div>
  </div>`);
}

function page_promo() {
  return wrap(`
  <div style="width:100vw;height:100vh;background:linear-gradient(145deg,#0c0c14,#12101f);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;position:relative;">
    <div style="position:absolute;width:500px;height:500px;background:radial-gradient(circle,rgba(108,92,231,.15) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);"></div>
    <div style="width:88px;height:88px;position:relative;z-index:1;margin-bottom:28px">${ICON_SVG}</div>
    <div style="font-size:52px;font-weight:700;color:#f4f4f5;letter-spacing:-1px;position:relative;z-index:1;">Polishly</div>
    <div style="font-size:20px;color:#a1a1aa;max-width:520px;line-height:1.5;margin-top:12px;position:relative;z-index:1;">AI-powered text polishing, right where you type.<br>Fix grammar, change tone, or rewrite with custom instructions.</div>
    <div style="display:flex;gap:10px;margin-top:32px;position:relative;z-index:1;">
      <span style="padding:8px 18px;background:rgba(108,92,231,.15);border:1px solid rgba(108,92,231,.3);border-radius:20px;font-size:14px;color:#c4b5fd;">Fix Grammar</span>
      <span style="padding:8px 18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:20px;font-size:14px;color:#d4d4d8;">Change Tone</span>
      <span style="padding:8px 18px;background:rgba(108,92,231,.15);border:1px solid rgba(108,92,231,.3);border-radius:20px;font-size:14px;color:#c4b5fd;">Custom Instructions</span>
      <span style="padding:8px 18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:20px;font-size:14px;color:#d4d4d8;">Gemini AI</span>
    </div>
  </div>`);
}

function page_promo_small() {
  return wrap(`
  <div style="width:100vw;height:100vh;background:linear-gradient(145deg,#0c0c14,#12101f);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;position:relative;">
    <div style="position:absolute;width:300px;height:300px;background:radial-gradient(circle,rgba(108,92,231,.18) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);"></div>
    <div style="width:48px;height:48px;position:relative;z-index:1;margin-bottom:14px">${ICON_SVG}</div>
    <div style="font-size:26px;font-weight:700;color:#f4f4f5;letter-spacing:-.5px;position:relative;z-index:1;">Polishly</div>
    <div style="font-size:12px;color:#a1a1aa;max-width:320px;line-height:1.5;margin-top:6px;position:relative;z-index:1;">AI-powered text polishing, right where you type.</div>
    <div style="display:flex;gap:6px;margin-top:16px;position:relative;z-index:1;">
      <span style="padding:4px 10px;background:rgba(108,92,231,.15);border:1px solid rgba(108,92,231,.3);border-radius:12px;font-size:10px;color:#c4b5fd;">Grammar</span>
      <span style="padding:4px 10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;font-size:10px;color:#d4d4d8;">Tone</span>
      <span style="padding:4px 10px;background:rgba(108,92,231,.15);border:1px solid rgba(108,92,231,.3);border-radius:12px;font-size:10px;color:#c4b5fd;">Custom</span>
    </div>
  </div>`);
}

function page_icon() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;}html,body{width:128px;height:128px;overflow:hidden;background:transparent;}</style></head><body>${ICON_SVG}</body></html>`;
}

(async () => {
  const browser = await chromium.launch();

  for (const p of PAGES) {
    console.log(`Generating ${p.name} (${p.width}x${p.height})...`);
    const page = await browser.newPage({ viewport: { width: p.width, height: p.height }, deviceScaleFactor: 1 });
    await page.setContent(p.html(), { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const outPath = path.join(out, `${p.name}.png`);
    const omit = p.name.includes('icon');
    await page.screenshot({ path: outPath, type: 'png', omitBackground: omit });
    console.log(`  -> ${outPath}`);
    await page.close();
  }

  await browser.close();
  console.log('Done!');
})();
