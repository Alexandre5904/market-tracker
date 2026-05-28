// Full Yahoo Finance quoteSummary — used by the detail page
const { yfetch } = require('./_yf');

const MODULES = [
  'assetProfile', 'price', 'summaryDetail', 'defaultKeyStatistics',
  'financialData', 'incomeStatementHistoryQuarterly', 'balanceSheetHistoryQuarterly',
  'cashflowStatementHistoryQuarterly', 'incomeStatementHistory',
  'recommendationTrend', 'earningsTrend',
].join(',');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Missing symbol' });

  try {
    const data = await yfetch(
      `v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${MODULES}`
    );
    return res.json(data?.quoteSummary?.result?.[0] || {});
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
