import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrencyRate } from "@/lib/api";

const currencies = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CHF", name: "Swiss Franc" },
];

export function CurrencyConverter() {
  const [amount, setAmount] = useState("1000");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [convertedAmount, setConvertedAmount] = useState("");

  const { data: currencyRate, isLoading } = useQuery({
    queryKey: ["/api/currency", fromCurrency, toCurrency],
    queryFn: () => fetchCurrencyRate(fromCurrency, toCurrency),
    enabled: fromCurrency !== toCurrency,
  });

  useEffect(() => {
    if (currencyRate && amount) {
      const result = parseFloat(amount) * parseFloat(currencyRate.rate);
      setConvertedAmount(result.toFixed(2));
    }
  }, [currencyRate, amount]);

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currency Converter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">From</label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
              />
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button variant="ghost" size="icon" onClick={handleSwapCurrencies}>
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">To</label>
            <div className="flex space-x-2">
              <Input
                type="text"
                value={isLoading ? "Loading..." : convertedAmount}
                readOnly
                className="flex-1 bg-muted"
              />
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {currencyRate && !isLoading && (
            <p className="text-xs text-muted-foreground text-center">
              Rate: 1 {fromCurrency} = {parseFloat(currencyRate.rate).toFixed(4)} {toCurrency}<br />
              <span>Last updated: {new Date(currencyRate.lastUpdated!).toLocaleString()}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
