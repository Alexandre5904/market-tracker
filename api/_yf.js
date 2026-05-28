// Yahoo Finance fetch — crumb auth + multi-host fallback
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const HOSTS = ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com'];

let crumb = undefined;
let cookieStr = '';
let lastCrumbMs = 0;
const CRUMB_TTL = 25 * 60 * 1000; // 25 min

async function ensureCrumb() {
  const now = Date.now();
  if (crumb !== undefined && now - lastCrumbMs < CRUMB_TTL) return;
  crumb = ''; cookieStr = '';
  try {
    // Step 1: get consent / session cookie
    const r1 = await fetch('https://fc.yahoo.com/', {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    const raw = r1.headers.get('set-cookie') || '';
    cookieStr = raw.split(',')
      .map(c => c.trim().split(';')[0])
      .filter(c => c.includes('='))
      .join('; ');

    // Step 2: get crumb (try both hosts)
    for (const host of HOSTS) {
      const r2 = await fetch(`${host}/v1/test/crumb`, {
        headers: {
          'User-Agent': UA,
          'Cookie': cookieStr,
          'Referer': 'https://finance.yahoo.com/',
        },
      });
      if (r2.ok) {
        const txt = (await r2.text()).trim();
        if (txt && txt.length < 20) {
          crumb = txt;
          lastCrumbMs = now;
          return;
        }
      }
    }
  } catch (_) {}
}

async function yfetch(path) {
  await ensureCrumb();
  const sep = path.includes('?') ? '&' : '?';
  const crumbSuffix = crumb ? `${sep}crumb=${encodeURIComponent(crumb)}` : '';

  const headers = {
    'User-Agent': UA,
    'Accept': 'application/json,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com/',
  };
  if (cookieStr) headers.Cookie = cookieStr;

  let lastErr;
  for (const host of HOSTS) {
    const url = `${host}/${path}${crumbSuffix}`;
    try {
      const r = await fetch(url, { headers });
      if (r.status === 401 || r.status === 403) {
        // Invalidate crumb — will refresh on next call
        crumb = undefined; lastCrumbMs = 0;
        throw new Error(`Auth ${r.status}`);
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Yahoo Finance unreachable');
}

ensureCrumb().catch(() => {});
module.exports = { yfetch };
