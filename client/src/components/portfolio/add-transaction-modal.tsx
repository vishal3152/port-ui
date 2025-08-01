import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertTransactionSchema.extend({
  date: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string;
}

const exchanges = [
  "NASDAQ",
  "NYSE", 
  "LSE",
  "ASX",
  "TSX",
  "AEX",
];

const currencies = [
  "USD",
  "EUR",
  "GBP", 
  "AUD",
  "CAD",
  "JPY",
];

export function AddTransactionModal({ open, onOpenChange, portfolioId }: AddTransactionModalProps) {
  const [transactionType, setTransactionType] = useState<"buy" | "sell">("buy");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      portfolioId,
      type: "buy",
      symbol: "",
      quantity: "",
      price: "",
      totalAmount: "",
      fees: "0",
      currency: "USD",
      exchange: "NASDAQ",
      date: new Date().toISOString().split('T')[0],
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", `/api/portfolios/${portfolioId}/transactions`, {
        ...data,
        type: transactionType,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", portfolioId, "holdings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", portfolioId, "transactions"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add transaction",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    // Calculate total amount if not provided
    const quantity = parseFloat(data.quantity);
    const price = parseFloat(data.price);
    const fees = parseFloat(data.fees || "0");
    const totalAmount = (quantity * price) + fees;

    createTransactionMutation.mutate({
      ...data,
      totalAmount: totalAmount.toString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Transaction Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={transactionType === "buy" ? "default" : "outline"}
                  onClick={() => setTransactionType("buy")}
                  className="w-full"
                >
                  Buy
                </Button>
                <Button
                  type="button"
                  variant={transactionType === "sell" ? "default" : "outline"}
                  onClick={() => setTransactionType("sell")}
                  className="w-full"
                >
                  Sell
                </Button>
              </div>
            </div>

            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AAPL, MSFT" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="150.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="exchange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exchange</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exchange" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {exchanges.map((exchange) => (
                          <SelectItem key={exchange} value={exchange}>
                            {exchange}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fees (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createTransactionMutation.isPending}
              >
                {createTransactionMutation.isPending ? "Adding..." : "Add Transaction"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
