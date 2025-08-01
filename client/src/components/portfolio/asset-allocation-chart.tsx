import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useRef } from "react";
import type { HoldingWithMetrics } from "@shared/schema";

interface AssetAllocationChartProps {
  holdings: HoldingWithMetrics[];
}

export function AssetAllocationChart({ holdings }: AssetAllocationChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);

  // Calculate allocation data
  const allocationData = holdings.reduce((acc, holding) => {
    const region = getRegionFromExchange(holding.exchange);
    acc[region] = (acc[region] || 0) + holding.currentValue;
    return acc;
  }, {} as Record<string, number>);

  const totalValue = Object.values(allocationData).reduce((sum, value) => sum + value, 0);
  
  const allocations = Object.entries(allocationData).map(([region, value]) => ({
    region,
    value,
    percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
  }));

  useEffect(() => {
    if (!chartRef.current || allocations.length === 0) return;

    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pie chart
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#8b5cf6', // purple
      '#f59e0b', // yellow
      '#ef4444', // red
    ];

    let currentAngle = -Math.PI / 2; // Start from top

    allocations.forEach((allocation, index) => {
      const sliceAngle = (allocation.percentage / 100) * 2 * Math.PI;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();

      currentAngle += sliceAngle;
    });

  }, [allocations]);

  function getRegionFromExchange(exchange: string): string {
    const regionMap: Record<string, string> = {
      NASDAQ: "US Stocks",
      NYSE: "US Stocks",
      LSE: "International",
      ASX: "International",
      AEX: "International",
      TSX: "International",
    };
    return regionMap[exchange] || "Other";
  }

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-yellow-500',
    'bg-red-500',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        {allocations.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            No holdings data available
          </div>
        ) : (
          <>
            <div className="h-48 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center relative mb-4">
              <canvas
                ref={chartRef}
                width={200}
                height={192}
                className="absolute inset-0 w-full h-full"
              />
            </div>
            <div className="space-y-3">
              {allocations.map((allocation, index) => (
                <div key={allocation.region} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                    <span className="text-sm text-muted-foreground">{allocation.region}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {allocation.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
