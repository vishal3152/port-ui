import { apiRequest } from "./queryClient";

// Export apiRequest for use in other components
export { apiRequest };

export async function fetchMarketData(symbol: string) {
  const response = await apiRequest("GET", `/api/market-data/${symbol}`, undefined);
  return response.json();
}

export async function fetchCurrencyRate(from: string, to: string) {
  const response = await apiRequest("GET", `/api/currency/${from}/${to}`, undefined);
  return response.json();
}

export async function updatePortfolioPrices(portfolioId: string) {
  const response = await apiRequest("POST", `/api/portfolios/${portfolioId}/update-prices`, undefined);
  return response.json();
}

export async function convertCurrency(amount: number, from: string, to: string) {
  const rate = await fetchCurrencyRate(from, to);
  return amount * parseFloat(rate.rate);
}

// Auth API functions
export async function fetchUserProfile() {
  const response = await apiRequest("GET", "/auth/me", undefined);
  return response.json();
}

export async function logout() {
  const response = await apiRequest("POST", "/auth/logout", undefined);
  return response.json();
}
