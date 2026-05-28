// 2-year monthly price history — used for the price chart
const { yfetch } = require('./_yf');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Missing symbol' });

  try {
    const data = await yfetch(
      `v8/finance/chart/${encodeURIComponent(symbol)}?range=2y&interval=1mo&includePrePost=false`
    );
    const result = data?.chart?.result?.[0];
    return res.json({
      timestamps: result?.timestamp || [],
      prices:     result?.indicators?.quote?.[0]?.close || [],
      currency:   result?.meta?.currency || '',
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
