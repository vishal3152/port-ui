import {
  type Portfolio,
  type InsertPortfolio,
  type Holding,
  type InsertHolding,
  type Transaction,
  type InsertTransaction,
  type Currency,
  type InsertCurrency,
  type MarketData,
  type InsertMarketData,
  type PortfolioWithMetrics,
  type HoldingWithMetrics
} from "@shared/schema";
import { randomUUID } from "crypto";

// User type for authentication
export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  accessToken?: string;
  createdAt: Date;
}

export interface InsertUser {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

export interface IStorage {
  // Portfolios
  getPortfolios(): Promise<Portfolio[]>;
  getPortfolio(id: string): Promise<Portfolio | undefined>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolio(id: string, portfolio: Partial<InsertPortfolio>): Promise<Portfolio | undefined>;
  deletePortfolio(id: string): Promise<boolean>;
  getPortfolioWithMetrics(id: string): Promise<PortfolioWithMetrics | undefined>;

  // Holdings
  getHoldings(portfolioId: string): Promise<Holding[]>;
  getHolding(id: string): Promise<Holding | undefined>;
  createHolding(holding: InsertHolding): Promise<Holding>;
  updateHolding(id: string, holding: Partial<InsertHolding>): Promise<Holding | undefined>;
  deleteHolding(id: string): Promise<boolean>;
  getHoldingsWithMetrics(portfolioId: string): Promise<HoldingWithMetrics[]>;

  // Transactions
  getTransactions(portfolioId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getRecentTransactions(portfolioId: string, limit?: number): Promise<Transaction[]>;

  // Currencies
  getCurrencyRate(fromCurrency: string, toCurrency: string): Promise<Currency | undefined>;
  updateCurrencyRate(rate: InsertCurrency): Promise<Currency>;
  getAllCurrencyRates(): Promise<Currency[]>;

  // Market Data
  getMarketData(symbol: string): Promise<MarketData | undefined>;
  updateMarketData(data: InsertMarketData): Promise<MarketData>;
  getMarketDataBatch(symbols: string[]): Promise<MarketData[]>;

  // Users
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserToken(userId: string, accessToken: string): Promise<User>;
}

export class MemStorage implements IStorage {
  private portfolios: Map<string, Portfolio>;
  private holdings: Map<string, Holding>;
  private transactions: Map<string, Transaction>;
  private currencies: Map<string, Currency>;
  private marketData: Map<string, MarketData>;
  private users: Map<string, User>;
  private googleIdToUserId: Map<string, string>;

  constructor() {
    this.portfolios = new Map();
    this.holdings = new Map();
    this.transactions = new Map();
    this.currencies = new Map();
    this.marketData = new Map();
    this.users = new Map();
    this.googleIdToUserId = new Map();

    // Initialize with sample data
    this.initializeSampleData();
  }

  // User management methods
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const userId = this.googleIdToUserId.get(googleId);
    if (!userId) return undefined;
    return this.users.get(userId);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: randomUUID(),
      accessToken: undefined,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    this.googleIdToUserId.set(user.googleId, user.id);
    return user;
  }

  async updateUserToken(userId: string, accessToken: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, accessToken };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  private initializeSampleData() {
    // Create sample portfolios
    const usPortfolio: Portfolio = {
      id: randomUUID(),
      name: "US Growth Portfolio",
      description: "Technology and growth stocks in US markets",
      externalIdentifier: null,
      taxResidency: "US",
      financialYearEnd: "31st Dec",
      performanceCalculationMethod: "Simple",
      baseCurrency: "USD",
      createdAt: new Date(),
    };
    this.portfolios.set(usPortfolio.id, usPortfolio);

    const intlPortfolio: Portfolio = {
      id: randomUUID(),
      name: "International Diversified",
      description: "Global diversification across developed markets",
      externalIdentifier: null,
      taxResidency: "US",
      financialYearEnd: "31st Mar",
      performanceCalculationMethod: "TWRR",
      baseCurrency: "USD",
      createdAt: new Date(),
    };
    this.portfolios.set(intlPortfolio.id, intlPortfolio);

    // Add sample holdings for US portfolio
    const appleHolding: Holding = {
      id: randomUUID(),
      portfolioId: usPortfolio.id,
      symbol: "AAPL",
      companyName: "Apple Inc.",
      exchange: "NASDAQ",
      currency: "USD",
      quantity: "50",
      averageCost: "150.00",
      currentPrice: "175.50",
      lastUpdated: new Date(),
    };
    this.holdings.set(appleHolding.id, appleHolding);

    const msftHolding: Holding = {
      id: randomUUID(),
      portfolioId: usPortfolio.id,
      symbol: "MSFT",
      companyName: "Microsoft Corporation",
      exchange: "NASDAQ",
      currency: "USD",
      quantity: "25",
      averageCost: "280.00",
      currentPrice: "310.25",
      lastUpdated: new Date(),
    };
    this.holdings.set(msftHolding.id, msftHolding);

    // Add sample holdings for international portfolio
    const asmlHolding: Holding = {
      id: randomUUID(),
      portfolioId: intlPortfolio.id,
      symbol: "ASML",
      companyName: "ASML Holding N.V.",
      exchange: "AEX",
      currency: "EUR",
      quantity: "10",
      averageCost: "580.00",
      currentPrice: "620.50",
      lastUpdated: new Date(),
    };
    this.holdings.set(asmlHolding.id, asmlHolding);

    // Add sample transactions
    const appleBuy: Transaction = {
      id: randomUUID(),
      portfolioId: usPortfolio.id,
      symbol: "AAPL",
      type: "buy",
      quantity: "50",
      price: "150.00",
      totalAmount: "7500.00",
      fees: "9.99",
      currency: "USD",
      exchange: "NASDAQ",
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      createdAt: new Date(),
    };
    this.transactions.set(appleBuy.id, appleBuy);

    const msftBuy: Transaction = {
      id: randomUUID(),
      portfolioId: usPortfolio.id,
      symbol: "MSFT",
      type: "buy",
      quantity: "25",
      price: "280.00",
      totalAmount: "7000.00",
      fees: "9.99",
      currency: "USD",
      exchange: "NASDAQ",
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      createdAt: new Date(),
    };
    this.transactions.set(msftBuy.id, msftBuy);

    // Add some sample currency rates
    const usdEurRate: Currency = {
      id: randomUUID(),
      fromCurrency: "USD",
      toCurrency: "EUR",
      rate: "0.8473",
      lastUpdated: new Date(),
    };
    this.currencies.set(`${usdEurRate.fromCurrency}-${usdEurRate.toCurrency}`, usdEurRate);

    const eurUsdRate: Currency = {
      id: randomUUID(),
      fromCurrency: "EUR",
      toCurrency: "USD",
      rate: "1.1801",
      lastUpdated: new Date(),
    };
    this.currencies.set(`${eurUsdRate.fromCurrency}-${eurUsdRate.toCurrency}`, eurUsdRate);
  }

  // Portfolios
  async getPortfolios(): Promise<Portfolio[]> {
    return Array.from(this.portfolios.values());
  }

  async getPortfolio(id: string): Promise<Portfolio | undefined> {
    return this.portfolios.get(id);
  }

  async createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    const portfolio: Portfolio = {
      id: randomUUID(),
      name: insertPortfolio.name,
      description: insertPortfolio.description || null,
      externalIdentifier: insertPortfolio.externalIdentifier || null,
      taxResidency: insertPortfolio.taxResidency || "US",
      financialYearEnd: insertPortfolio.financialYearEnd || "31st Mar",
      performanceCalculationMethod: insertPortfolio.performanceCalculationMethod || "Simple",
      baseCurrency: insertPortfolio.baseCurrency || "USD",
      createdAt: new Date(),
    };
    this.portfolios.set(portfolio.id, portfolio);
    return portfolio;
  }

  async updatePortfolio(id: string, update: Partial<InsertPortfolio>): Promise<Portfolio | undefined> {
    const portfolio = this.portfolios.get(id);
    if (!portfolio) return undefined;

    const updated = { ...portfolio, ...update };
    this.portfolios.set(id, updated);
    return updated;
  }

  async deletePortfolio(id: string): Promise<boolean> {
    return this.portfolios.delete(id);
  }

  async getPortfolioWithMetrics(id: string): Promise<PortfolioWithMetrics | undefined> {
    const portfolio = this.portfolios.get(id);
    if (!portfolio) return undefined;

    const holdings = Array.from(this.holdings.values()).filter(h => h.portfolioId === id);
    const transactions = Array.from(this.transactions.values()).filter(t => t.portfolioId === id);

    let totalValue = 0;
    let totalCost = 0;
    let dividendYield = 0;

    for (const holding of holdings) {
      const currentPrice = parseFloat(holding.currentPrice || "0");
      const quantity = parseFloat(holding.quantity);
      const averageCost = parseFloat(holding.averageCost);
      
      totalValue += currentPrice * quantity;
      totalCost += averageCost * quantity;
    }

    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    // Calculate dividend yield from dividend transactions
    const dividendTransactions = transactions.filter(t => t.type === 'dividend');
    const annualDividends = dividendTransactions.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);
    dividendYield = totalValue > 0 ? (annualDividends / totalValue) * 100 : 0;

    return {
      ...portfolio,
      totalValue,
      totalGain,
      totalGainPercent,
      dividendYield,
      holdingsCount: holdings.length,
    };
  }

  // Holdings
  async getHoldings(portfolioId: string): Promise<Holding[]> {
    return Array.from(this.holdings.values()).filter(h => h.portfolioId === portfolioId);
  }

  async getHolding(id: string): Promise<Holding | undefined> {
    return this.holdings.get(id);
  }

  async createHolding(insertHolding: InsertHolding): Promise<Holding> {
    const holding: Holding = {
      ...insertHolding,
      id: randomUUID(),
      currentPrice: null,
      lastUpdated: new Date(),
    };
    this.holdings.set(holding.id, holding);
    return holding;
  }

  async updateHolding(id: string, update: Partial<InsertHolding>): Promise<Holding | undefined> {
    const holding = this.holdings.get(id);
    if (!holding) return undefined;

    const updated = { ...holding, ...update, lastUpdated: new Date() };
    this.holdings.set(id, updated);
    return updated;
  }

  async deleteHolding(id: string): Promise<boolean> {
    return this.holdings.delete(id);
  }

  async getHoldingsWithMetrics(portfolioId: string): Promise<HoldingWithMetrics[]> {
    const holdings = await this.getHoldings(portfolioId);
    
    return holdings.map(holding => {
      const currentPrice = parseFloat(holding.currentPrice || "0");
      const quantity = parseFloat(holding.quantity);
      const averageCost = parseFloat(holding.averageCost);
      
      const currentValue = currentPrice * quantity;
      const totalCost = averageCost * quantity;
      const totalGain = currentValue - totalCost;
      const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

      const marketData = this.marketData.get(holding.symbol);

      return {
        ...holding,
        currentValue,
        totalGain,
        totalGainPercent,
        marketData,
      };
    });
  }

  // Transactions
  async getTransactions(portfolioId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.portfolioId === portfolioId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = {
      ...insertTransaction,
      id: randomUUID(),
      fees: insertTransaction.fees || "0",
      createdAt: new Date(),
    };
    this.transactions.set(transaction.id, transaction);

    // Update holding based on transaction
    await this.updateHoldingFromTransaction(transaction);

    return transaction;
  }

  async getRecentTransactions(portfolioId: string, limit: number = 5): Promise<Transaction[]> {
    const transactions = await this.getTransactions(portfolioId);
    return transactions.slice(0, limit);
  }

  private async updateHoldingFromTransaction(transaction: Transaction) {
    const holdings = Array.from(this.holdings.values()).filter(
      h => h.portfolioId === transaction.portfolioId && h.symbol === transaction.symbol
    );

    let holding = holdings[0];

    if (transaction.type === 'buy') {
      if (holding) {
        // Update existing holding
        const existingQuantity = parseFloat(holding.quantity);
        const existingCost = parseFloat(holding.averageCost);
        const transactionQuantity = parseFloat(transaction.quantity);
        const transactionPrice = parseFloat(transaction.price);

        const newQuantity = existingQuantity + transactionQuantity;
        const newAverageCost = ((existingQuantity * existingCost) + (transactionQuantity * transactionPrice)) / newQuantity;

        const { id, currentPrice, lastUpdated, ...holdingUpdate } = holding;
        await this.updateHolding(holding.id, {
          ...holdingUpdate,
          quantity: newQuantity.toString(),
          averageCost: newAverageCost.toString(),
        });
      } else {
        // Create new holding
        await this.createHolding({
          portfolioId: transaction.portfolioId,
          symbol: transaction.symbol,
          companyName: transaction.symbol, // This would be fetched from API in real implementation
          exchange: transaction.exchange,
          currency: transaction.currency,
          quantity: transaction.quantity,
          averageCost: transaction.price,
        });
      }
    } else if (transaction.type === 'sell' && holding) {
      const existingQuantity = parseFloat(holding.quantity);
      const transactionQuantity = parseFloat(transaction.quantity);
      const newQuantity = existingQuantity - transactionQuantity;

      if (newQuantity <= 0) {
        await this.deleteHolding(holding.id);
      } else {
        const { id, currentPrice, lastUpdated, ...holdingUpdate } = holding;
        await this.updateHolding(holding.id, {
          ...holdingUpdate,
          quantity: newQuantity.toString(),
        });
      }
    }
  }

  // Currencies
  async getCurrencyRate(fromCurrency: string, toCurrency: string): Promise<Currency | undefined> {
    return this.currencies.get(`${fromCurrency}-${toCurrency}`);
  }

  async updateCurrencyRate(insertRate: InsertCurrency): Promise<Currency> {
    const rate: Currency = {
      ...insertRate,
      id: randomUUID(),
      lastUpdated: new Date(),
    };
    this.currencies.set(`${rate.fromCurrency}-${rate.toCurrency}`, rate);
    return rate;
  }

  async getAllCurrencyRates(): Promise<Currency[]> {
    return Array.from(this.currencies.values());
  }

  // Market Data
  async getMarketData(symbol: string): Promise<MarketData | undefined> {
    return this.marketData.get(symbol);
  }

  async updateMarketData(insertData: InsertMarketData): Promise<MarketData> {
    const data: MarketData = {
      ...insertData,
      id: randomUUID(),
      change: insertData.change || null,
      changePercent: insertData.changePercent || null,
      volume: insertData.volume || null,
      marketCap: insertData.marketCap || null,
      lastUpdated: new Date(),
    };
    this.marketData.set(data.symbol, data);
    return data;
  }

  async getMarketDataBatch(symbols: string[]): Promise<MarketData[]> {
    return symbols.map(symbol => this.marketData.get(symbol)).filter(Boolean) as MarketData[];
  }
}

export const storage = new MemStorage();
