// Batch quote endpoint — used by the homepage grid
const { yfetch } = require('./_yf');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'Missing symbols' });

  try {
    const data = await yfetch(
      `v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=symbol,shortName,longName,regularMarketPrice,regularMarketChangePercent,marketCap,currency,exchange,fullExchangeName`
    );
    return res.json(data?.quoteResponse?.result || []);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
