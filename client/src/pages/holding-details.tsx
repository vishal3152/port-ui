import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  TrendingUp, 
  TrendingDown, 
  Edit2, 
  ArrowLeft,
  Plus,
  DollarSign,
  Percent,
  Calendar,
  Globe,
  RefreshCw
} from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { useToast } from "@/hooks/use-toast";
import { EditHoldingModal } from "@/components/portfolio/edit-holding-modal";
import type { HoldingWithMetrics } from "@shared/schema";

export default function HoldingDetails() {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("summary");
  const [dateRange, setDateRange] = useState("since_first_purchase");
  const [graphType, setGraphType] = useState("price");
  const [includeClosedPositions, setIncludeClosedPositions] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showEditHoldingModal, setShowEditHoldingModal] = useState(false);
  const { toast } = useToast();

  // Get holding data from React Query cache (set by HoldingsTable)
  const { data: holding, isLoading: holdingLoading } = useQuery<HoldingWithMetrics>({
    queryKey: ["/api/holdings", id],
    queryFn: async () => {
      // This should not be called if the data is already cached
      // In a real implementation, you'd have a specific endpoint for individual holdings
      throw new Error("Unable to load holding - data should be cached from dashboard");
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // Consider cached data fresh for 5 minutes
  });

  // Fetch trades for this holding - always fetch when we have holding data
  const { data: trades = [], isLoading: tradesLoading, error: tradesError } = useQuery({
    queryKey: ["/api/trades", holding?.portfolioId, holding?.instrumentKey],
    queryFn: async () => {
      if (!holding?.portfolioId || !holding?.instrumentKey) {
        console.log('Missing holding data:', { portfolioId: holding?.portfolioId, instrumentKey: holding?.instrumentKey });
        return [];
      }
      console.log('Fetching trades for:', { portfolioId: holding.portfolioId, instrumentKey: holding.instrumentKey });
      try {
        const tradesResponse = await serverApi.getTrades(holding.portfolioId, holding.instrumentKey);
        console.log('Trades response:', tradesResponse);
        return tradesResponse.data || [];
      } catch (error) {
        console.error('Error fetching trades:', error);
        return [];
      }
    },
    enabled: !!holding?.portfolioId && !!holding?.instrumentKey,
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (holdingLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar
            onAddTransaction={() => setShowAddTransactionModal(true)}
            onCreatePortfolio={() => navigate("/portfolios")}
          />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!holding) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar
            onAddTransaction={() => setShowAddTransactionModal(true)}
            onCreatePortfolio={() => navigate("/portfolios")}
          />
          <main className="flex-1 p-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-foreground mb-2">Holding not found</h3>
              <Button onClick={() => navigate("/")}>Go back to dashboard</Button>
            </div>
          </main>
          <EditHoldingModal
            open={showEditHoldingModal}
            onOpenChange={setShowEditHoldingModal}
            holding={holding || null}
          />
        </div>
      </div>
    );
  }

  // Calculate additional metrics
  const totalQuantity = parseFloat(holding.quantity);
  const averageCost = parseFloat(holding.averageCost);
  const currentPrice = parseFloat(holding.currentPrice || "0");
  const costBasis = totalQuantity * averageCost;
  const currentValue = holding.currentValue;
  const totalGain = holding.totalGain;
  const totalGainPercent = holding.totalGainPercent;

  // Mock data for price comparison chart
  const priceData = [
    { date: "01 Aug 25", value: 2800 },
    { date: "04 Aug 25", value: 3200 },
    { date: "05 Aug 25", value: 3400 },
    { date: "06 Aug 25", value: 3100 },
    { date: "07 Aug 25", value: 3000 },
    { date: "08 Aug 25", value: currentPrice },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar
          onAddTransaction={() => setShowAddTransactionModal(true)}
          onCreatePortfolio={() => navigate("/portfolios")}
        />
        
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <span className="text-2xl font-bold text-primary">{holding.symbol}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    {holding.symbol} | {holding.exchange}
                    <Badge variant="secondary">{holding.exchange}</Badge>
                  </h1>
                  <p className="text-muted-foreground">{holding.companyName}</p>
                </div>
              </div>
              <Button onClick={() => setShowEditHoldingModal(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit holding
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="trades">Trades & income</TabsTrigger>
              <TabsTrigger value="notes">Notes & files</TabsTrigger>
              <TabsTrigger value="news">News</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-6">
              {/* Current Value Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Current value</p>
                      <p className="text-3xl font-bold text-foreground">
                        {formatCurrency(currentValue, holding.currency)}
                      </p>
                      <p className="text-lg text-muted-foreground">
                        {formatCurrency(currentValue * 87.73, "INR")} {/* Mock exchange rate */}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Price</p>
                      <p className="text-xl font-semibold">
                        {formatCurrency(currentPrice, holding.currency)}
                      </p>
                      <div className="flex items-center justify-end space-x-4 mt-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Qty</span>
                          <span className="text-sm font-medium ml-2">{totalQuantity.toLocaleString()}</span>
                        </div>
                        <span className="text-muted-foreground">=</span>
                        <div>
                          <span className="text-sm text-muted-foreground">Total</span>
                          <span className="text-sm font-medium ml-2">
                            {formatCurrency(currentValue, holding.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chart Controls */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="since_first_purchase">since first purchase</SelectItem>
                          <SelectItem value="1M">Last 1 month</SelectItem>
                          <SelectItem value="3M">Last 3 months</SelectItem>
                          <SelectItem value="6M">Last 6 months</SelectItem>
                          <SelectItem value="1Y">Last 1 year</SelectItem>
                          <SelectItem value="ALL">All time</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={graphType} onValueChange={setGraphType}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="price">Graph Price</SelectItem>
                          <SelectItem value="value">Graph Value</SelectItem>
                          <SelectItem value="gain">Graph Gain/Loss</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="closed-positions"
                        checked={includeClosedPositions}
                        onCheckedChange={setIncludeClosedPositions}
                      />
                      <Label htmlFor="closed-positions" className="text-sm">
                        Include closed positions
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total return
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      {formatPercent(totalGainPercent)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(totalGain, holding.currency)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Capital gain
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      {formatPercent(totalGainPercent)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(totalGain, holding.currency)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Dividends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">0.00%</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(0, holding.currency)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Currency gain
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-danger">-0.25%</p>
                    <p className="text-sm text-danger">
                      -{formatCurrency(5.04, holding.currency)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Price Comparison */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Price comparison</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Updated at 8 August 2025, 3:30 PM IST
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative h-64 bg-muted/20 rounded-lg p-4">
                      {/* Placeholder for chart */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-muted-foreground">Price chart visualization</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Button variant="link" className="text-sm">
                        Add target price
                      </Button>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-danger"></div>
                          <span>Current price: {formatCurrency(currentPrice, holding.currency)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-warning"></div>
                          <span>Your average purchase price: {formatCurrency(averageCost, holding.currency)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Exchange rate: {holding.currency}1 = ₹87.72772771
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Your Investment */}
              <Card>
                <CardHeader>
                  <CardTitle>Your investment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current value</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(currentValue * 87.73, "INR")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(currentValue, holding.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total quantity</p>
                      <p className="text-lg font-semibold">{totalQuantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cost basis</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(costBasis, holding.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cost basis per share</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(averageCost, holding.currency)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Trades */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Trades</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("trades")}>
                      View All Trades
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {tradesLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : tradesError ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Error loading trades</p>
                      <p className="text-sm text-destructive mt-2">Error: {tradesError.message}</p>
                    </div>
                  ) : trades.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No trades found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">DATE</th>
                            <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">TYPE</th>
                            <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">QUANTITY</th>
                            <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">PRICE</th>
                            <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">VALUE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {trades.slice(0, 5).map((trade) => (
                            <tr key={trade.txId} className="hover:bg-muted/50">
                              <td className="py-3 px-2 text-sm">{formatDate(trade.trdDt)}</td>
                              <td className="py-3 px-2 text-sm">
                                <Badge variant={trade.trdTypEnum === 'BUY' ? 'default' : 'destructive'}>
                                  {trade.trdTypEnum}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-sm text-right">
                                {trade.qty.toLocaleString()}
                              </td>
                              <td className="py-3 px-2 text-sm text-right">
                                {formatCurrency(trade.tradePrice, trade.ccy)}
                              </td>
                              <td className="py-3 px-2 text-sm text-right">
                                {formatCurrency(trade.qty * trade.tradePrice, trade.ccy)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Benchmark Performance */}
              <Card className="bg-warning/10">
                <CardHeader>
                  <CardTitle>Benchmark performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Compare your performance against a benchmark. You can use an index-tracking ETF or any other
                    instrument, global or local.
                  </p>
                  <Button variant="default" className="bg-warning hover:bg-warning/90">
                    Upgrade to add a benchmark
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trades" className="space-y-6">
              {/* All trades & adjustments */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>All trades & adjustments</CardTitle>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add trade or adjustment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {tradesLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : tradesError ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Error loading trades</p>
                      <p className="text-sm text-destructive mt-2">Error: {tradesError.message}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        Debug: portfolioId={holding?.portfolioId}, instrumentKey={holding?.instrumentKey}
                      </div>
                    </div>
                  ) : trades.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No trades found</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        Debug: portfolioId={holding?.portfolioId}, instrumentKey={holding?.instrumentKey}
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">DATE</th>
                            <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">TYPE</th>
                            <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">QUANTITY</th>
                            <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">PRICE</th>
                            <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">FEES</th>
                            <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">EXCHANGE RATE</th>
                            <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">VALUE</th>
                            <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">STATUS</th>
                            <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {trades.map((trade) => (
                            <tr key={trade.txId} className="hover:bg-muted/50">
                              <td className="py-3 px-2 text-sm">{formatDate(trade.trdDt)}</td>
                              <td className="py-3 px-2 text-sm">
                                <Badge variant={trade.trdTypEnum === 'BUY' ? 'default' : 'destructive'}>
                                  {trade.trdTypEnum}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-sm text-right">
                                {trade.qty.toLocaleString()}
                              </td>
                              <td className="py-3 px-2 text-sm text-right">
                                {formatCurrency(trade.tradePrice, trade.ccy)}
                              </td>
                              <td className="py-3 px-2 text-sm text-right">
                                {formatCurrency(trade.fee, trade.feeCcy)}
                              </td>
                              <td className="py-3 px-2 text-sm text-right">
                                {trade.fx || 'N/A'}<br />
                                <span className="text-xs text-muted-foreground">
                                  {trade.fxBaseCcy || trade.ccy}/INR
                                </span>
                              </td>
                              <td className="py-3 px-2 text-sm text-right">
                                {formatCurrency(trade.qty * trade.tradePrice, trade.ccy)}
                              </td>
                              <td className="py-3 px-2 text-sm text-center">
                                <Badge variant="secondary">Confirmed</Badge>
                              </td>
                              <td className="py-3 px-2 text-sm text-center">
                                <Button variant="ghost" size="sm">
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All dividends */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>All dividends</CardTitle>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add dividend
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">You have not received any dividends</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No notes or files yet</p>
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="news" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">News feed coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}