import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { CreatePortfolioModal } from "@/components/portfolio/create-portfolio-modal";
import { AddTransactionModal } from "@/components/portfolio/add-transaction-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2,
  Briefcase,
  DollarSign,
  Calendar
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { PortfolioWithMetrics } from "@shared/schema";
import { Link } from "wouter";

export default function Portfolios() {
  const [showCreatePortfolioModal, setShowCreatePortfolioModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all portfolios with metrics
  const { data: portfolios = [], isLoading } = useQuery({
    queryKey: ["/api/portfolios"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/portfolios", undefined);
      const basicPortfolios = await response.json();
      
      // Fetch metrics for each portfolio
      const portfoliosWithMetrics = await Promise.all(
        basicPortfolios.map(async (portfolio: any) => {
          try {
            const metricsResponse = await apiRequest("GET", `/api/portfolios/${portfolio.id}`, undefined);
            return await metricsResponse.json();
          } catch (error) {
            return {
              ...portfolio,
              totalValue: 0,
              totalGain: 0,
              totalGainPercent: 0,
              dividendYield: 0,
              holdingsCount: 0,
            };
          }
        })
      );
      
      return portfoliosWithMetrics;
    },
  });

  // Delete portfolio mutation
  const deletePortfolioMutation = useMutation({
    mutationFn: async (portfolioId: string) => {
      const response = await apiRequest("DELETE", `/api/portfolios/${portfolioId}`, undefined);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Portfolio deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete portfolio",
        variant: "destructive",
      });
    },
  });

  const filteredPortfolios = portfolios.filter((portfolio: PortfolioWithMetrics) =>
    portfolio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (portfolio.description && portfolio.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getTaxResidencyName = (code: string) => {
    const countries: Record<string, string> = {
      US: "United States",
      CA: "Canada", 
      GB: "United Kingdom",
      AU: "Australia",
      DE: "Germany",
      FR: "France",
      JP: "Japan",
      IN: "India",
      SG: "Singapore",
      HK: "Hong Kong",
      NL: "Netherlands",
      CH: "Switzerland",
    };
    return countries[code] || code;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar
          onAddTransaction={() => setShowAddTransactionModal(true)}
          onCreatePortfolio={() => setShowCreatePortfolioModal(true)}
        />
        
        <main className="flex-1 p-6">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">My Portfolios</h1>
                <p className="text-muted-foreground">Manage your investment portfolios across different countries</p>
              </div>
              <Button onClick={() => setShowCreatePortfolioModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Portfolio
              </Button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search portfolios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Portfolio Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPortfolios.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? "No portfolios found" : "No portfolios yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "Try adjusting your search terms"
                  : "Create your first portfolio to start tracking your investments"
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreatePortfolioModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Portfolio
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPortfolios.map((portfolio: PortfolioWithMetrics) => (
                <Card key={portfolio.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link href={`/?portfolio=${portfolio.id}`}>
                          <CardTitle className="text-lg font-semibold hover:text-primary transition-colors">
                            {portfolio.name}
                          </CardTitle>
                        </Link>
                        {portfolio.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {portfolio.description}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deletePortfolioMutation.mutate(portfolio.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Portfolio Value */}
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(portfolio.totalValue, portfolio.baseCurrency)}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`flex items-center text-sm font-medium ${
                          portfolio.totalGainPercent >= 0 ? 'text-success' : 'text-danger'
                        }`}>
                          {portfolio.totalGainPercent >= 0 ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {formatPercent(portfolio.totalGainPercent)}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          ({portfolio.totalGain >= 0 ? '+' : ''}{formatCurrency(portfolio.totalGain, portfolio.baseCurrency)})
                        </span>
                      </div>
                    </div>

                    {/* Portfolio Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Holdings</p>
                        <p className="font-medium">{portfolio.holdingsCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Dividend Yield</p>
                        <p className="font-medium">{(portfolio.dividendYield || 0).toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Portfolio Metadata */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                      <Badge variant="secondary" className="text-xs">
                        {portfolio.baseCurrency}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getTaxResidencyName(portfolio.taxResidency || "US")}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        FY: {portfolio.financialYearEnd}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Link href={`/?portfolio=${portfolio.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <DollarSign className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSelectedPortfolioId(portfolio.id);
                          setShowAddTransactionModal(true);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      <CreatePortfolioModal
        open={showCreatePortfolioModal}
        onOpenChange={setShowCreatePortfolioModal}
      />

      {selectedPortfolioId && (
        <AddTransactionModal
          open={showAddTransactionModal}
          onOpenChange={(open) => {
            setShowAddTransactionModal(open);
            if (!open) setSelectedPortfolioId("");
          }}
          portfolioId={selectedPortfolioId}
        />
      )}
    </div>
  );
}