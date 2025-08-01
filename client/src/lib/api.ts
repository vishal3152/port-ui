import { apiRequest } from "./queryClient";

// Export apiRequest for use in other components
export { apiRequest };

export async function fetchMarketData(symbol: string) {
  const response = await apiRequest("GET", `/api/market-data/${symbol}`);
  return response.json();
}

export async function fetchCurrencyRate(from: string, to: string) {
  const response = await apiRequest("GET", `/api/currency/${from}/${to}`);
  return response.json();
}

export async function updatePortfolioPrices(portfolioId: string) {
  const response = await apiRequest("POST", `/api/portfolios/${portfolioId}/update-prices`);
  return response.json();
}

export async function convertCurrency(amount: number, from: string, to: string) {
  const rate = await fetchCurrencyRate(from, to);
  return amount * parseFloat(rate.rate);
}
