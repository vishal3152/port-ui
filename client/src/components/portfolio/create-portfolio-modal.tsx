import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { serverApi, type ClientPortfolioCreateRequest } from "@/lib/server-api";
import { useToast } from "@/hooks/use-toast";
import { insertPortfolioSchema } from "@shared/schema";
import { z } from "zod";
import { Calendar, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formSchema = insertPortfolioSchema.extend({
  externalIdentifier: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreatePortfolioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const countries = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "IN", name: "India" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "NL", name: "Netherlands" },
  { code: "CH", name: "Switzerland" },
];

const financialYearEnds = [
  "31st Mar",
  "30th Jun", 
  "30th Sep",
  "31st Dec",
];

const performanceMethods = [
  { value: "Simple", label: "Simple", description: "Basic time-weighted returns" },
  { value: "TWRR", label: "Time-Weighted Rate of Return", description: "Industry standard for portfolio performance" },
  { value: "MWRR", label: "Money-Weighted Rate of Return", description: "Considers timing of cash flows" },
];

export function CreatePortfolioModal({ open, onOpenChange }: CreatePortfolioModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      externalIdentifier: "",
      taxResidency: "US",
      financialYearEnd: "31st Mar",
      performanceCalculationMethod: "Simple",
      baseCurrency: "USD",
    },
  });

  const createPortfolioMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Transform form data to client API format
      const clientData: ClientPortfolioCreateRequest = {
        name: data.name,
        description: data.description || undefined,
        baseCurrency: data.baseCurrency || "USD",
        taxResidency: data.taxResidency || "US",
        financialYearEnd: data.financialYearEnd || "31st Mar",
        performanceCalculationMethod: data.performanceCalculationMethod,
        externalIdentifier: data.externalIdentifier
      };
      return await serverApi.createPortfolio(clientData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Portfolio created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create portfolio",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createPortfolioMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create a new portfolio</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter portfolio name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of this portfolio" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="externalIdentifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External identifier (optional)</FormLabel>
                  <FormDescription>
                    Identification of the tax entity owner of the portfolio
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="Tax ID, SSN, or other identifier" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxResidency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax residency of portfolio</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
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
              name="financialYearEnd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Financial year end date</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select financial year end" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {financialYearEnds.map((date) => (
                        <SelectItem key={date} value={date}>
                          {date}
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
              name="performanceCalculationMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Performance calculation method</FormLabel>
                  <FormDescription>
                    Select the performance calculation method for percentage statistics
                  </FormDescription>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select calculation method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {performanceMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          <div>
                            <div className="font-medium">{method.label}</div>
                            <div className="text-sm text-muted-foreground">{method.description}</div>
                          </div>
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
              name="baseCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select base currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                      <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-6">
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
                disabled={createPortfolioMutation.isPending}
              >
                {createPortfolioMutation.isPending ? "Creating..." : "Create portfolio"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}