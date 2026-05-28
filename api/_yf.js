// Shared Yahoo Finance fetch utility — handles crumb auth automatically
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

let crumb, cookieStr;

async function ensureCrumb() {
  if (crumb !== undefined) return; // already initialised (warm start)
  crumb = ''; cookieStr = '';
  try {
    const r1 = await fetch('https://fc.yahoo.com/v1/test/cookie', {
      headers: { 'User-Agent': UA },
    });
    // Flatten multiple set-cookie into a single Cookie header value
    const raw = r1.headers.get('set-cookie') || '';
    cookieStr = raw.split(',').map(c => c.trim().split(';')[0]).join('; ');

    const r2 = await fetch('https://query1.finance.yahoo.com/v1/test/crumb', {
      headers: { 'User-Agent': UA, Cookie: cookieStr },
    });
    if (r2.ok) crumb = (await r2.text()).trim();
  } catch (_) { /* try without crumb */ }
}

async function yfetch(path) {
  await ensureCrumb();
  const sep = path.includes('?') ? '&' : '?';
  const url = `https://query1.finance.yahoo.com/${path}${crumb ? sep + 'crumb=' + encodeURIComponent(crumb) : ''}`;
  const headers = { 'User-Agent': UA, Accept: 'application/json,*/*', 'Accept-Language': 'en-US,en;q=0.9' };
  if (cookieStr) headers.Cookie = cookieStr;

  const r = await fetch(url, { headers });

  if (r.status === 401 || r.status === 403) {
    // Force crumb refresh on next invocation
    crumb = cookieStr = undefined;
    throw new Error(`Yahoo Finance auth error ${r.status} — crumb will be refreshed`);
  }
  if (!r.ok) throw new Error(`Yahoo Finance HTTP ${r.status}: ${path.slice(0, 80)}`);
  return r.json();
}

// Warm up crumb on module load (helps warm-start perf)
ensureCrumb().catch(() => {});

module.exports = { yfetch };
