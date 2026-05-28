// Yahoo Finance search — returns equities only
const { yfetch } = require('./_yf');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);

  try {
    const data = await yfetch(
      `v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0&enableFuzzyQuery=false&enableCb=false`
    );
    const results = (data?.quotes || [])
      .filter(x => x.quoteType === 'EQUITY')
      .slice(0, 7);
    return res.json(results);
  } catch (e) {
    return res.status(500).json([]);
  }
};
