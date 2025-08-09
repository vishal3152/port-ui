import type { PortfolioWithMetrics } from "@shared/schema";

// Server API configuration
const SERVER_BASE_URL = "http://localhost:8080/portfolio-mgr";

//"https://sanguine-portfolio-mgr-java-svc.onrender.com/portfolio-mgr";

// Client-facing interfaces for API interactions
export interface ClientPortfolioCreateRequest {
  name: string;
  description?: string;
  baseCurrency: string;
  taxResidency: string;
  financialYearEnd: string;
  performanceCalculationMethod?: string;
  externalIdentifier?: string;
}

export interface ClientTradeRequest {
  portfolioId: string;
  instrumentKey: string;
  symbol: string;
  exchange: string;
  quantity: string;
  price: string;
  currency: string;
  tradeDate: Date;
  fees: string;
  feesCurrency: string;
  splitRatio?: string;
  instrumentType: "STK" | "MF" | "FIXED" | "OTH";
  tradeType: "BUY" | "SELL" | "SPLIT" | "BONUS" | "OPEN_BAL" | "CONSOLIDATE" | "CANCELLATION" | "DEMERGER" | "ROC";
  openingBalanceCostBase?: string;
}

export interface ClientInstrumentSearchResult {
  isin: string;
  instrumentKey: string;
  name: string;
  symbol: string;
  segment: string;
  type: string;
  currency: string;
  country: string;
  exchange: string;
}

// Server response types based on actual API response format
interface ServerPortfolioEntity {
  crdDt: string;
  crtBy: string;
  pid: string;
  ccy: string;
  nm: string;
  desc?: string;
  taxRes: string;
  finYr: string;
}

// Wrapper interface for API responses that include data, status, pagination
interface ServerApiResponse<T> {
  data: T;
  status: string;
  pagination: any;
}

interface ServerHoldingDetailsResponse {
  crdDt: string;
  crtBy: string;
  pid: string;
  hid: string;
  ik: string;
  symbol: string;
  cmpNm: string | null;
  ccy: string;
  exchange: string;
  typ: "STK" | "MF" | "FIXED" | "OTH";
  feeCcy: string;
  fee: number;
  qty: number;
  avgBuyPrice: number;
  costBase: number;
  costBasePortfolioCcy: number;
  currentVal: number;
  rg: number;
  ug: number;
  instrumentMaster: ServerInstrumentMasterEntity | null;
  instrumentTxnl: ServerInstrumentTransactionalEntity | null;
}

interface ServerTradeEntity {
  txId: string;
  pid: string;
  ik: string;
  symbol: string;
  exchange: string;
  qty: number;
  tradePrice: number;
  ccy: string;
  fee: number;
  feeCcy: string;
  typ: "STK" | "MF" | "FIXED" | "OTH";
  trdTyp: string;
  trdDt: string;
  createdDate: string;
  createdBy: string;
  trdTypEnum: "BUY" | "SELL" | "SPLIT" | "BONUS" | "OPEN_BAL" | "CONSOLIDATE" | "CANCELLATION" | "DEMERGER" | "ROC";
}

interface ServerInstrumentMasterEntity {
  isin: string;
  ik: string;
  nm: string;
  symbl: string;
  sgmnt: string;
  typ: string;
  ccy: string;
  ctry: string;
  exchg: string;
}

interface ServerInstrumentTransactionalEntity {
  ik: string;
  cmp: number;
  h52w: number;
  l52w: number;
  delVol: number;
  txC: number;
  trDt: string;
  pdelVol: number;
  lhigh: number;
  llow: number;
  pcls: number;
  tval: number;
}

interface ServerGetInstrumentResponse {
  isin: string;
  nm: string;
  symbl: string;
  sgmnt: string;
  typ: string;
  ccy: string;
  exchg: string;
  cmp: number;
  h52w: number;
  l52w: number;
  delVol: number;
  txC: number;
  trDt: string;
  pdelVol: number;
  lhigh: number;
  llow: number;
  pcls: number;
  tval: number;
}

interface ServerPageTradeEntity {
  totalPages: number;
  totalElements: number;
  size: number;
  content: ServerTradeEntity[];
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Server request types (exact match to swagger)
interface ServerPortfolioCreateRequest {
  ccy: string;
  nm: string;
  desc?: string;
  taxRes: string;
  finYr: string;
}

interface ServerTradeRequest {
  pid: string;
  ik: string;
  symbol: string;
  exchange: string;
  qty: string;
  tradePrice: string;
  ccy: string;
  trdDt: string;
  fee: string;
  feeCcy: string;
  splitRatio?: string;
  instrumentType: "STK" | "MF" | "FIXED" | "OTH";
  trdTyp: "BUY" | "SELL" | "SPLIT" | "BONUS" | "OPEN_BAL" | "CONSOLIDATE" | "CANCELLATION" | "DEMERGER" | "ROC";
  openingBalCostBase?: string;
}

/**
 * Java Server API Service
 * Handles all communication with the Java portfolio management server
 */
export class ServerApiService {
  private baseUrl: string;
  
  constructor(baseUrl: string = SERVER_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate required headers for server API calls
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'api-interaction-id': crypto.randomUUID(),
      'x-session-id': crypto.randomUUID(),
      'Authorization':"Bearer sanguine_token",
      'lang': 'en'
    };
  }

  /**
   * Make a request to the server API
   */
  private async makeRequest<T>(
    endpoint: string, 
    method: string = 'GET', 
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Server API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Convert UTC date string to local timezone Date object
   */
  private convertUtcToLocal(utcDateString: string): Date {
    const utcDate = new Date(utcDateString);
    // The Date constructor already handles UTC conversion to local time
    // when given an ISO string with timezone info
    return utcDate;
  }

  /**
   * Transform server portfolio response to client format
   */
  private transformPortfolio(serverPortfolio: ServerPortfolioEntity): PortfolioWithMetrics {
    return {
      id: serverPortfolio.pid,
      name: serverPortfolio.nm,
      description: serverPortfolio.desc || null,
      externalIdentifier: null,
      taxResidency: serverPortfolio.taxRes || "US",
      financialYearEnd: serverPortfolio.finYr || "31st Mar",
      performanceCalculationMethod: "Simple",
      baseCurrency: serverPortfolio.ccy || "USD",
      createdAt: this.convertUtcToLocal(serverPortfolio.crdDt),
      // Default metrics - would need additional server calls to calculate
      totalValue: 0,
      totalGain: 0,
      totalGainPercent: 0,
      dividendYield: 0,
      holdingsCount: 0,
    };
  }

  /**
   * Get all portfolios from server
   */
  async getPortfolios(): Promise<PortfolioWithMetrics[]> {
    const response = await this.makeRequest<ServerApiResponse<ServerPortfolioEntity[]>>('/api/portfolios');
    return response.data.map(portfolio => this.transformPortfolio(portfolio));
  }

  /**
   * Get all portfolios with calculated metrics from holdings
   */
  async getPortfoliosWithMetrics(): Promise<PortfolioWithMetrics[]> {
    const portfolios = await this.getPortfolios();
    
    // Calculate metrics for each portfolio based on holdings
    const portfoliosWithMetrics = await Promise.all(
      portfolios.map(async (portfolio) => {
        try {
          const holdings = await this.getHoldings(portfolio.id);
          
          let totalValue = 0;
          let totalCost = 0;
          let dividendYield = 0;
          
          for (const holding of holdings) {
            totalValue += holding.currentVal;
            totalCost += holding.costBase;
          }
          
          const totalGain = totalValue - totalCost;
          const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
          
          return {
            ...portfolio,
            totalValue,
            totalGain,
            totalGainPercent,
            dividendYield, // Would need dividend data from trades
            holdingsCount: holdings.length,
          };
        } catch (error) {
          console.warn(`Failed to calculate metrics for portfolio ${portfolio.id}:`, error);
          return portfolio; // Return with default metrics
        }
      })
    );
    
    return portfoliosWithMetrics;
  }

  /**
   * Transform client portfolio create request to server format
   */
  private transformPortfolioCreateRequest(clientData: ClientPortfolioCreateRequest): ServerPortfolioCreateRequest {
    return {
      nm: clientData.name,
      desc: clientData.description,
      ccy: clientData.baseCurrency,
      taxRes: clientData.taxResidency,
      finYr: clientData.financialYearEnd
    };
  }

  /**
   * Create a new portfolio with client-friendly interface
   */
  async createPortfolio(portfolioData: ClientPortfolioCreateRequest): Promise<void> {
    const serverData = this.transformPortfolioCreateRequest(portfolioData);
    await this.makeRequest('/api/portfolios', 'POST', serverData);
  }

  /**
   * Update an existing portfolio
   */
  async updatePortfolio(portfolioId: string, portfolioData: Partial<ClientPortfolioCreateRequest>): Promise<void> {
    const serverData: Partial<ServerPortfolioCreateRequest> = {};
    
    if (portfolioData.name) serverData.nm = portfolioData.name;
    if (portfolioData.description) serverData.desc = portfolioData.description;
    if (portfolioData.baseCurrency) serverData.ccy = portfolioData.baseCurrency;
    if (portfolioData.taxResidency) serverData.taxRes = portfolioData.taxResidency;
    if (portfolioData.financialYearEnd) serverData.finYr = portfolioData.financialYearEnd;
    
    await this.makeRequest(`/api/portfolios/${portfolioId}`, 'PUT', serverData);
  }

  /**
   * Delete a portfolio
   */
  async deletePortfolio(portfolioId: string): Promise<void> {
    await this.makeRequest(`/api/portfolios/${portfolioId}`, 'DELETE');
  }

  /**
   * Get holdings for a portfolio
   */
  async getHoldings(portfolioId: string): Promise<ServerHoldingDetailsResponse[]> {
    const response = await this.makeRequest<ServerApiResponse<ServerHoldingDetailsResponse[]>>(`/api/holdings?portfolioId=${portfolioId}`);
    return response.data;
  }

  /**
   * Get holdings with client-compatible format and metrics
   */
  async getHoldingsWithMetrics(portfolioId: string): Promise<any[]> {
    const serverHoldings = await this.getHoldings(portfolioId);
    
    return serverHoldings.map(holding => ({
      // Base Holding fields (matching client schema)
      id: holding.hid,
      portfolioId: holding.pid,
      symbol: holding.symbol,
      companyName: holding.cmpNm || holding.symbol, // Fallback to symbol if company name is null
      exchange: holding.exchange,
      currency: holding.ccy,
      quantity: holding.qty.toString(),
      averageCost: holding.avgBuyPrice.toString(),
      currentPrice: holding.qty > 0 ? (holding.currentVal / holding.qty).toString() : "0",
      lastUpdated: this.convertUtcToLocal(holding.crdDt),
      
      // HoldingWithMetrics fields
      currentValue: holding.currentVal,
      totalGain: holding.ug, // Unrealized gain
      totalGainPercent: holding.costBase > 0 ? (holding.ug / holding.costBase) * 100 : 0,
      
      // Additional server-specific fields
      costBasePortfolioCurrency: holding.costBasePortfolioCcy,
      realizedGain: holding.rg, // Realized gain
      fees: holding.fee,
      feesCurrency: holding.feeCcy,
      
      // Market data (optional)
      marketData: holding.instrumentTxnl ? {
        symbol: holding.symbol,
        price: holding.qty > 0 ? holding.currentVal / holding.qty : 0,
        change: null,
        changePercent: null,
        volume: null,
        marketCap: null,
      } : null,
    }));
  }

  /**
   * Get trades for a portfolio
   */
  async getTrades(portfolioId: string, instrumentKey: string): Promise<ServerPageTradeEntity> {
    return this.makeRequest<ServerPageTradeEntity>(`/api/trades?portfolioId=${portfolioId}&ik=${instrumentKey}`);
  }

  /**
   * Get recent transactions in client-compatible format
   * Note: Server requires specific IK (instrument key) for trades, 
   * so this is a simplified version that would need holdings data
   */
  async getRecentTransactions(portfolioId: string, limit: number = 3): Promise<any[]> {
    try {
      // First get holdings to get instrument keys
      const holdings = await this.getHoldings(portfolioId);
      
      if (holdings.length === 0) {
        return [];
      }
      
      // Get trades for each holding and combine them
      const allTrades: any[] = [];
      
      for (const holding of holdings.slice(0, 5)) { // Limit to first 5 holdings to avoid too many API calls
        try {
          const tradesResponse = await this.getTrades(portfolioId, holding.ik);
          const trades = tradesResponse.content.map(trade => ({
            id: trade.txId,
            portfolioId: trade.pid,
            symbol: trade.symbol,
            type: trade.trdTypEnum.toLowerCase(),
            quantity: trade.qty.toString(),
            price: trade.tradePrice.toString(),
            totalAmount: (trade.qty * trade.tradePrice).toString(),
            fees: trade.fee.toString(),
            currency: trade.ccy,
            exchange: trade.exchange,
            date: new Date(trade.trdDt),
            createdAt: new Date(trade.createdDate),
          }));
          allTrades.push(...trades);
        } catch (error) {
          console.warn(`Failed to fetch trades for ${holding.symbol}:`, error);
        }
      }
      
      // Sort by date and limit
      return allTrades
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, limit);
        
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      return [];
    }
  }

  /**
   * Transform client trade request to server format
   */
  private transformTradeRequest(clientData: ClientTradeRequest): ServerTradeRequest {
    return {
      pid: clientData.portfolioId,
      ik: clientData.instrumentKey,
      symbol: clientData.symbol,
      exchange: clientData.exchange,
      qty: clientData.quantity,
      tradePrice: clientData.price,
      ccy: clientData.currency,
      trdDt: clientData.tradeDate.toISOString(),
      fee: clientData.fees,
      feeCcy: clientData.feesCurrency,
      splitRatio: clientData.splitRatio,
      instrumentType: clientData.instrumentType,
      trdTyp: clientData.tradeType,
      openingBalCostBase: clientData.openingBalanceCostBase
    };
  }

  /**
   * Create a new trade with client-friendly interface
   */
  async createTrade(tradeData: ClientTradeRequest): Promise<void> {
    const serverData = this.transformTradeRequest(tradeData);
    await this.makeRequest('/api/trades', 'POST', serverData);
  }

  /**
   * Delete a trade
   */
  async deleteTrade(tradeId: string, portfolioId: string): Promise<void> {
    await this.makeRequest(`/api/trades/${tradeId}?portfolioId=${portfolioId}`, 'DELETE');
  }

  /**
   * Transform server instrument search results to client format
   */
  private transformInstrumentSearchResults(serverResults: ServerInstrumentMasterEntity[]): ClientInstrumentSearchResult[] {
    return serverResults.map(result => ({
      isin: result.isin,
      instrumentKey: result.ik,
      name: result.nm,
      symbol: result.symbl,
      segment: result.sgmnt,
      type: result.typ,
      currency: result.ccy,
      country: result.ctry,
      exchange: result.exchg
    }));
  }

  /**
   * Search for instruments with client-friendly response
   */
  async searchInstruments(searchText: string): Promise<ClientInstrumentSearchResult[]> {
    const serverResults = await this.makeRequest<ServerInstrumentMasterEntity[]>(`/api/instrument/search?text=${encodeURIComponent(searchText)}`);
    return this.transformInstrumentSearchResults(serverResults);
  }

  /**
   * Get instrument information with raw server response
   */
  async getInstrument(instrumentKey: string): Promise<ServerGetInstrumentResponse> {
    return this.makeRequest<ServerGetInstrumentResponse>(`/api/instrument/${instrumentKey}`);
  }

  /**
   * Upload CAS file
   */
  async uploadCasFile(portfolioId: string, filePassword: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = this.getHeaders();
    delete headers['Content-Type']; // Let browser set content-type for FormData

    const response = await fetch(
      `${this.baseUrl}/api/cas-import/upload?portfolioId=${portfolioId}&filePassword=${filePassword}`,
      {
        method: 'POST',
        headers,
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`CAS upload failed: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Get authentication token
   */
  async getAuthToken(code: string, redirectUri: string): Promise<{
    idToken: string;
    refreshToken: string;
    expirySec: number;
  }> {
    return this.makeRequest('/api/auth/token', 'POST', { code, redirectUri });
  }
}

// Export singleton instance
export const serverApi = new ServerApiService();