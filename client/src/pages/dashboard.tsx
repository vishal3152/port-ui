import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { PortfolioChart } from "@/components/portfolio/portfolio-chart";
import { HoldingsTable } from "@/components/portfolio/holdings-table";
import { AssetAllocationChart } from "@/components/portfolio/asset-allocation-chart";
import { AddTransactionModal } from "@/components/portfolio/add-transaction-modal";
import { CurrencyConverter } from "@/components/portfolio/currency-converter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Coins, Globe, Plus, RefreshCw } from "lucide-react";
import { apiRequest, updatePortfolioPrices } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { PortfolioWithMetrics, HoldingWithMetrics, Transaction } from "@shared/schema";

export default function Dashboard() {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("");
  const [timeRange, setTimeRange] = useState("1Y");
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get portfolio ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const portfolioFromUrl = urlParams.get('portfolio');

  // Fetch portfolios
  const { data: portfolios = [] } = useQuery({
    queryKey: ["/api/portfolios"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/portfolios");
      return response.json();
    },
  });

  // Set portfolio from URL or default to first portfolio
  useEffect(() => {
    if (portfolios.length > 0) {
      if (portfolioFromUrl && portfolios.some((p: any) => p.id === portfolioFromUrl)) {
        setSelectedPortfolioId(portfolioFromUrl);
      } else if (!selectedPortfolioId) {
        setSelectedPortfolioId(portfolios[0].id);
      }
    }
  }, [portfolios, portfolioFromUrl, selectedPortfolioId]);

  // Fetch selected portfolio with metrics
  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ["/api/portfolios", selectedPortfolioId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/portfolios/${selectedPortfolioId}`);
      return response.json() as Promise<PortfolioWithMetrics>;
    },
    enabled: !!selectedPortfolioId,
  });

  // Fetch holdings
  const { data: holdings = [], isLoading: holdingsLoading } = useQuery({
    queryKey: ["/api/portfolios", selectedPortfolioId, "holdings"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/portfolios/${selectedPortfolioId}/holdings`);
      return response.json() as Promise<HoldingWithMetrics[]>;
    },
    enabled: !!selectedPortfolioId,
  });

  // Fetch recent transactions
  const { data: recentTransactions = [] } = useQuery({
    queryKey: ["/api/portfolios", selectedPortfolioId, "transactions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/portfolios/${selectedPortfolioId}/transactions?limit=3`);
      return response.json() as Promise<Transaction[]>;
    },
    enabled: !!selectedPortfolioId,
  });

  // Update prices mutation
  const updatePricesMutation = useMutation({
    mutationFn: () => updatePortfolioPrices(selectedPortfolioId),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Prices updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", selectedPortfolioId] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", selectedPortfolioId, "holdings"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update prices",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="text-success text-sm" />;
      case 'sell':
        return <TrendingDown className="text-danger text-sm" />;
      case 'dividend':
        return <Coins className="text-warning text-sm" />;
      default:
        return <DollarSign className="text-neutral text-sm" />;
    }
  };

  // Mock market indices data
  const marketIndices = [
    { name: "S&P 500", value: "4,783.45", change: "+1.2%" },
    { name: "NASDAQ", value: "15,147.28", change: "+0.8%" },
    { name: "FTSE 100", value: "7,612.33", change: "-0.3%" },
    { name: "ASX 200", value: "7,458.12", change: "+0.5%" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar
          onAddTransaction={() => setShowAddTransactionModal(true)}
          onCreatePortfolio={() => {}}
        />
        
        <main className="flex-1 p-6">
          {/* Portfolio Overview Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Investment Dashboard</h1>
                <p className="text-muted-foreground">Track your global investment portfolio performance</p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-0">
                <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Portfolio" />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => updatePricesMutation.mutate()}
                  disabled={updatePricesMutation.isPending}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${updatePricesMutation.isPending ? 'animate-spin' : ''}`} />
                  Update Prices
                </Button>
                <Button onClick={() => setShowAddTransactionModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Investment
                </Button>
              </div>
            </div>

            {/* Key Metrics Cards */}
            {portfolio && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Portfolio Value</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {formatCurrency(portfolio.totalValue, portfolio.baseCurrency)}
                        </p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-full">
                        <TrendingUp className="text-primary text-xl" />
                      </div>
                    </div>
                    <div className="flex items-center mt-4">
                      <span className={`flex items-center text-sm font-medium ${portfolio.totalGainPercent >= 0 ? 'text-success' : 'text-danger'}`}>
                        {portfolio.totalGainPercent >= 0 ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {formatPercent(portfolio.totalGainPercent)}
                      </span>
                      <span className="text-muted-foreground text-sm ml-2">total return</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Gain/Loss</p>
                        <p className={`text-2xl font-bold mt-1 ${portfolio.totalGain >= 0 ? 'text-success' : 'text-danger'}`}>
                          {portfolio.totalGain >= 0 ? '+' : ''}{formatCurrency(portfolio.totalGain, portfolio.baseCurrency)}
                        </p>
                      </div>
                      <div className="p-3 bg-success/10 rounded-full">
                        <TrendingUp className="text-success text-xl" />
                      </div>
                    </div>
                    <div className="flex items-center mt-4">
                      <span className={`flex items-center text-sm font-medium ${portfolio.totalGain >= 0 ? 'text-success' : 'text-danger'}`}>
                        {portfolio.totalGain >= 0 ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {formatPercent(portfolio.totalGainPercent)}
                      </span>
                      <span className="text-muted-foreground text-sm ml-2">vs cost basis</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Annual Dividend Yield</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {portfolio.dividendYield.toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-3 bg-warning/10 rounded-full">
                        <Coins className="text-warning text-xl" />
                      </div>
                    </div>
                    <div className="flex items-center mt-4">
                      <span className="text-muted-foreground text-sm">
                        Estimated annual income
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Holdings</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {portfolio.holdingsCount}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                        <Globe className="text-purple-600 text-xl" />
                      </div>
                    </div>
                    <div className="flex items-center mt-4">
                      <span className="text-muted-foreground text-sm">
                        Multiple exchanges
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Chart Section */}
            <div className="lg:col-span-2 space-y-6">
              <PortfolioChart
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
              />
              
              <HoldingsTable
                holdings={holdings}
                isLoading={holdingsLoading}
              />
            </div>

            {/* Right Sidebar Content */}
            <div className="space-y-6">
              <AssetAllocationChart holdings={holdings} />
              
              <CurrencyConverter />

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Transactions</CardTitle>
                    <Button variant="ghost" size="sm">View All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentTransactions.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-background rounded-full">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {transaction.type.toUpperCase()} {transaction.symbol}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {parseFloat(transaction.quantity).toLocaleString()} shares
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-foreground">
                              {formatCurrency(parseFloat(transaction.totalAmount), transaction.currency)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Market Indices */}
              <Card>
                <CardHeader>
                  <CardTitle>Global Market Indices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketIndices.map((index) => (
                      <div key={index.name} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{index.name}</p>
                          <p className="text-xs text-muted-foreground">{index.value}</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={index.change.startsWith('+') ? 'default' : 'destructive'}
                            className={index.change.startsWith('+') ? 'bg-success text-success-foreground' : ''}
                          >
                            {index.change}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {selectedPortfolioId && (
        <AddTransactionModal
          open={showAddTransactionModal}
          onOpenChange={setShowAddTransactionModal}
          portfolioId={selectedPortfolioId}
        />
      )}
    </div>
  );
}
