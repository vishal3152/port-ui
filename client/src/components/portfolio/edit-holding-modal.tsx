import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { serverApi } from "@/lib/server-api";
import type { HoldingWithMetrics } from "@shared/schema";

const editHoldingSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  companyName: z.string().min(1, "Company name is required"),
  exchange: z.string().min(1, "Exchange is required"),
  currency: z.string().min(1, "Currency is required"),
  quantity: z.string().min(1, "Quantity is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Quantity must be a positive number",
  }),
  averageCost: z.string().min(1, "Average cost is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Average cost must be a positive number",
  }),
});

type EditHoldingFormData = z.infer<typeof editHoldingSchema>;

interface EditHoldingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding: HoldingWithMetrics | null;
}

export function EditHoldingModal({ open, onOpenChange, holding }: EditHoldingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditHoldingFormData>({
    resolver: zodResolver(editHoldingSchema),
    defaultValues: {
      symbol: "",
      companyName: "",
      exchange: "",
      currency: "USD",
      quantity: "",
      averageCost: "",
    },
  });

  // Update form values when holding changes
  useEffect(() => {
    if (holding) {
      form.reset({
        symbol: holding.symbol,
        companyName: holding.companyName,
        exchange: holding.exchange,
        currency: holding.currency,
        quantity: holding.quantity,
        averageCost: holding.averageCost,
      });
    }
  }, [holding, form]);

  const updateHoldingMutation = useMutation({
    mutationFn: async (data: EditHoldingFormData) => {
      if (!holding) throw new Error("No holding selected");
      
      // In a real implementation, you would have an API endpoint to update holdings
      // For now, we'll simulate the update
      const response = await fetch(`/api/holdings/${holding.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          quantity: parseFloat(data.quantity),
          averageCost: parseFloat(data.averageCost),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update holding");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Holding updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update holding",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditHoldingFormData) => {
    updateHoldingMutation.mutate(data);
  };

  const exchanges = [
    { value: "NASDAQ", label: "NASDAQ" },
    { value: "NYSE", label: "NYSE" },
    { value: "LSE", label: "London Stock Exchange" },
    { value: "ASX", label: "Australian Securities Exchange" },
    { value: "TSX", label: "Toronto Stock Exchange" },
    { value: "NSE", label: "National Stock Exchange (India)" },
    { value: "BSE", label: "Bombay Stock Exchange" },
    { value: "HKEX", label: "Hong Kong Exchange" },
    { value: "SSE", label: "Shanghai Stock Exchange" },
    { value: "TSE", label: "Tokyo Stock Exchange" },
    { value: "AEX", label: "Amsterdam Exchange" },
  ];

  const currencies = [
    { value: "USD", label: "USD - US Dollar" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - British Pound" },
    { value: "AUD", label: "AUD - Australian Dollar" },
    { value: "CAD", label: "CAD - Canadian Dollar" },
    { value: "INR", label: "INR - Indian Rupee" },
    { value: "JPY", label: "JPY - Japanese Yen" },
    { value: "HKD", label: "HKD - Hong Kong Dollar" },
    { value: "SGD", label: "SGD - Singapore Dollar" },
    { value: "CHF", label: "CHF - Swiss Franc" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Holding</DialogTitle>
          <DialogDescription>
            Update the details of your holding. Changes will be reflected in your portfolio immediately.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AAPL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Apple Inc." {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exchange" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {exchanges.map((exchange) => (
                          <SelectItem key={exchange.value} value={exchange.value}>
                            {exchange.label}
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.00000001" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>Number of shares</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="averageCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Cost</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.00000001" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>Cost per share</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateHoldingMutation.isPending}>
                {updateHoldingMutation.isPending ? "Updating..." : "Update Holding"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}