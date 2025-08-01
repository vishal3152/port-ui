import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const portfolios = pgTable("portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  externalIdentifier: text("external_identifier"),
  taxResidency: text("tax_residency").notNull().default("US"),
  financialYearEnd: text("financial_year_end").notNull().default("31st Mar"),
  performanceCalculationMethod: text("performance_calculation_method").notNull().default("Simple"),
  baseCurrency: text("base_currency").notNull().default("USD"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const holdings = pgTable("holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull().references(() => portfolios.id),
  symbol: text("symbol").notNull(),
  companyName: text("company_name").notNull(),
  exchange: text("exchange").notNull(),
  currency: text("currency").notNull(),
  quantity: decimal("quantity", { precision: 20, scale: 8 }).notNull(),
  averageCost: decimal("average_cost", { precision: 20, scale: 8 }).notNull(),
  currentPrice: decimal("current_price", { precision: 20, scale: 8 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull().references(() => portfolios.id),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // 'buy', 'sell', 'dividend'
  quantity: decimal("quantity", { precision: 20, scale: 8 }).notNull(),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 20, scale: 8 }).notNull(),
  fees: decimal("fees", { precision: 20, scale: 8 }).default("0"),
  currency: text("currency").notNull(),
  exchange: text("exchange").notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const currencies = pgTable("currencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  rate: decimal("rate", { precision: 20, scale: 8 }).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const marketData = pgTable("market_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  change: decimal("change", { precision: 20, scale: 8 }),
  changePercent: decimal("change_percent", { precision: 20, scale: 8 }),
  volume: integer("volume"),
  marketCap: decimal("market_cap", { precision: 20, scale: 2 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Insert schemas
export const insertPortfolioSchema = createInsertSchema(portfolios).omit({
  id: true,
  createdAt: true,
});

export const insertHoldingSchema = createInsertSchema(holdings).omit({
  id: true,
  currentPrice: true,
  lastUpdated: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertCurrencySchema = createInsertSchema(currencies).omit({
  id: true,
  lastUpdated: true,
});

export const insertMarketDataSchema = createInsertSchema(marketData).omit({
  id: true,
  lastUpdated: true,
});

// Types
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;

export type Holding = typeof holdings.$inferSelect;
export type InsertHolding = z.infer<typeof insertHoldingSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Currency = typeof currencies.$inferSelect;
export type InsertCurrency = z.infer<typeof insertCurrencySchema>;

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;

// Extended types for API responses
export type PortfolioWithMetrics = Portfolio & {
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
  dividendYield: number;
  holdingsCount: number;
};

export type HoldingWithMetrics = Holding & {
  currentValue: number;
  totalGain: number;
  totalGainPercent: number;
  marketData?: MarketData;
};
