import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Briefcase, 
  ArrowLeftRight, 
  TrendingUp, 
  Coins, 
  FileText, 
  Settings,
  Plus
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "My Portfolios", href: "/portfolios", icon: Briefcase },
  { name: "Transactions", href: "#transactions", icon: ArrowLeftRight },
  { name: "Analytics", href: "#analytics", icon: TrendingUp },
  { name: "Dividends", href: "#dividends", icon: Coins },
  { name: "Tax Reports", href: "#tax-reports", icon: FileText },
  { name: "Settings", href: "#settings", icon: Settings },
];

interface SidebarProps {
  onAddTransaction: () => void;
  onCreatePortfolio: () => void;
}

export function Sidebar({ onAddTransaction, onCreatePortfolio }: SidebarProps) {
  const [location] = useLocation();
  
  return (
    <aside className="w-64 bg-card shadow-sm border-r border-border hidden lg:block">
      <div className="p-6">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href === "/" && location === "/");
            
            if (item.href.startsWith("#")) {
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                    "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>
              );
            }
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-8">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Quick Add
          </h3>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={onAddTransaction}
            >
              <Plus className="w-4 h-4 mr-3" />
              Add Transaction
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={onCreatePortfolio}
            >
              <Plus className="w-4 h-4 mr-3" />
              Create Portfolio
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
