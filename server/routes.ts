import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPortfolioSchema, insertTransactionSchema, insertHoldingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Portfolio routes
  app.get("/api/portfolios", async (req, res) => {
    try {
      const portfolios = await storage.getPortfolios();
      res.json(portfolios);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolios" });
    }
  });

  app.get("/api/portfolios/:id", async (req, res) => {
    try {
      const portfolio = await storage.getPortfolioWithMetrics(req.params.id);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  app.post("/api/portfolios", async (req, res) => {
    try {
      const data = insertPortfolioSchema.parse(req.body);
      const portfolio = await storage.createPortfolio(data);
      res.status(201).json(portfolio);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create portfolio" });
    }
  });

  app.delete("/api/portfolios/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePortfolio(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      res.json({ message: "Portfolio deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete portfolio" });
    }
  });

  // Holdings routes
  app.get("/api/portfolios/:portfolioId/holdings", async (req, res) => {
    try {
      const holdings = await storage.getHoldingsWithMetrics(req.params.portfolioId);
      res.json(holdings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch holdings" });
    }
  });

  app.post("/api/portfolios/:portfolioId/holdings", async (req, res) => {
    try {
      const data = insertHoldingSchema.parse({
        ...req.body,
        portfolioId: req.params.portfolioId,
      });
      const holding = await storage.createHolding(data);
      res.status(201).json(holding);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create holding" });
    }
  });

  // Transaction routes
  app.get("/api/portfolios/:portfolioId/transactions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = limit 
        ? await storage.getRecentTransactions(req.params.portfolioId, limit)
        : await storage.getTransactions(req.params.portfolioId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/portfolios/:portfolioId/transactions", async (req, res) => {
    try {
      const data = insertTransactionSchema.parse({
        ...req.body,
        portfolioId: req.params.portfolioId,
        date: new Date(req.body.date),
      });
      const transaction = await storage.createTransaction(data);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Market data routes
  app.get("/api/market-data/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY || process.env.VITE_ALPHA_VANTAGE_API_KEY || "demo";
      
      // Try to get cached data first
      let marketData = await storage.getMarketData(symbol);
      
      // If no cached data or data is older than 5 minutes, fetch from API
      if (!marketData || (new Date().getTime() - marketData.lastUpdated!.getTime()) > 5 * 60 * 1000) {
        try {
          const response = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
          );
          const data = await response.json();
          
          if (data["Global Quote"]) {
            const quote = data["Global Quote"];
            const newMarketData = {
              symbol: symbol.toUpperCase(),
              price: quote["05. price"],
              change: quote["09. change"],
              changePercent: quote["10. change percent"].replace("%", ""),
              volume: parseInt(quote["06. volume"]) || 0,
              marketCap: null,
            };
            
            marketData = await storage.updateMarketData(newMarketData);
          } else {
            throw new Error("Invalid API response");
          }
        } catch (apiError) {
          console.error("Failed to fetch from Alpha Vantage:", apiError);
          // Return cached data if available, otherwise return error
          if (!marketData) {
            return res.status(404).json({ message: "Market data not found" });
          }
        }
      }
      
      res.json(marketData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  });

  // Currency conversion routes
  app.get("/api/currency/:from/:to", async (req, res) => {
    try {
      const { from, to } = req.params;
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY || process.env.VITE_ALPHA_VANTAGE_API_KEY || "demo";
      
      // Try to get cached rate first
      let currencyRate = await storage.getCurrencyRate(from.toUpperCase(), to.toUpperCase());
      
      // If no cached rate or rate is older than 1 hour, fetch from API
      if (!currencyRate || (new Date().getTime() - currencyRate.lastUpdated!.getTime()) > 60 * 60 * 1000) {
        try {
          const response = await fetch(
            `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${apiKey}`
          );
          const data = await response.json();
          
          if (data["Realtime Currency Exchange Rate"]) {
            const rate = data["Realtime Currency Exchange Rate"]["5. Exchange Rate"];
            currencyRate = await storage.updateCurrencyRate({
              fromCurrency: from.toUpperCase(),
              toCurrency: to.toUpperCase(),
              rate: rate,
            });
          } else {
            throw new Error("Invalid API response");
          }
        } catch (apiError) {
          console.error("Failed to fetch currency rate:", apiError);
          // Return cached rate if available, otherwise return error
          if (!currencyRate) {
            return res.status(404).json({ message: "Currency rate not found" });
          }
        }
      }
      
      res.json(currencyRate);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch currency rate" });
    }
  });

  // Update stock prices for a portfolio
  app.post("/api/portfolios/:portfolioId/update-prices", async (req, res) => {
    try {
      const holdings = await storage.getHoldings(req.params.portfolioId);
      const symbols = Array.from(new Set(holdings.map(h => h.symbol)));
      
      for (const symbol of symbols) {
        try {
          // Trigger price update by fetching market data
          await fetch(`http://localhost:${process.env.PORT || 3000}/api/market-data/${symbol}`);
          
          // Update holding current price
          const marketData = await storage.getMarketData(symbol);
          if (marketData) {
            const holdingsForSymbol = holdings.filter(h => h.symbol === symbol);
            for (const holding of holdingsForSymbol) {
              const { id, currentPrice, lastUpdated, ...holdingUpdate } = holding;
              await storage.updateHolding(holding.id, {
                ...holdingUpdate,
                currentPrice: marketData.price,
              });
            }
          }
        } catch (error) {
          console.error(`Failed to update price for ${symbol}:`, error);
        }
      }
      
      res.json({ message: "Prices updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update prices" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
