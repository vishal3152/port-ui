import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, Search, Eye } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import type { HoldingWithMetrics } from "@shared/schema";

interface HoldingsTableProps {
  holdings: HoldingWithMetrics[];
  isLoading?: boolean;
}

export function HoldingsTable({ holdings, isLoading }: HoldingsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [, navigate] = useLocation();

  const filteredHoldings = holdings.filter(holding =>
    holding.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    holding.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? "+" : "";
    return `${sign}${percent.toFixed(2)}%`;
  };

  const getExchangeBadgeColor = (exchange: string) => {
    const colors: Record<string, string> = {
      NASDAQ: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
      NYSE: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
      LSE: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
      ASX: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
      AEX: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
    };
    return colors[exchange] || "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Current Holdings</CardTitle>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search holdings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredHoldings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No holdings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Symbol</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Company</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Shares</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Price</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Value</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Gain/Loss</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredHoldings.map((holding) => (
                  <tr
                    key={holding.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/holdings/${holding.id}`, { state: { holding } })}
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-foreground">{holding.symbol}</span>
                        <Badge 
                          variant="secondary" 
                          className={getExchangeBadgeColor(holding.exchange)}
                        >
                          {holding.exchange}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-foreground">{holding.companyName}</td>
                    <td className="py-3 px-2 text-right text-foreground">
                      {parseFloat(holding.quantity).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right text-foreground">
                      {holding.currentPrice ? formatCurrency(parseFloat(holding.currentPrice), holding.currency) : "—"}
                    </td>
                    <td className="py-3 px-2 text-right font-medium text-foreground">
                      {formatCurrency(holding.currentValue, holding.currency)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-medium ${holding.totalGain >= 0 ? 'text-success' : 'text-danger'}`}>
                          {holding.totalGain >= 0 ? '+' : ''}{formatCurrency(holding.totalGain, holding.currency)}
                        </span>
                        <span className={`text-sm ${holding.totalGainPercent >= 0 ? 'text-success' : 'text-danger'}`}>
                          ({formatPercent(holding.totalGainPercent)})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/holdings/${holding.id}`, { state: { holding } });
                        }}
                      >
                        <Eye className="h-4 w-4" />
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
  );
}
