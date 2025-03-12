import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Calculator, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface RentCalculatorProps {
  initialRent?: number;
}

export default function RentCalculator({ initialRent = 2000 }: RentCalculatorProps) {
  // Main state values
  const [baseRent, setBaseRent] = useState<number>(initialRent);
  const [includeBrokerFee, setIncludeBrokerFee] = useState<boolean>(false);
  const [brokerFeeMonths, setBrokerFeeMonths] = useState<number>(1);
  const [electricBill, setElectricBill] = useState<number>(100);
  const [wifiBill, setWifiBill] = useState<number>(60);
  const [leaseLength, setLeaseLength] = useState<number>(12);
  
  // Calculated values
  const [firstMonthCost, setFirstMonthCost] = useState<number>(0);
  const [monthlyAverage, setMonthlyAverage] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  
  // Calculate all values whenever inputs change
  useEffect(() => {
    // Calculate broker fee if enabled
    const brokerFee = includeBrokerFee ? baseRent * brokerFeeMonths : 0;
    
    // Calculate monthly utilities
    const monthlyUtilities = electricBill + wifiBill;
    
    // First month cost: base rent + broker fee + utilities
    const firstMonth = baseRent + brokerFee + monthlyUtilities;
    
    // Total cost over lease period
    const totalLeaseRent = baseRent * leaseLength;
    const totalLeaseUtilities = monthlyUtilities * leaseLength;
    const total = totalLeaseRent + brokerFee + totalLeaseUtilities;
    
    // Average monthly cost
    const average = total / leaseLength;
    
    setFirstMonthCost(firstMonth);
    setTotalCost(total);
    setMonthlyAverage(average);
  }, [baseRent, includeBrokerFee, brokerFeeMonths, electricBill, wifiBill, leaseLength]);
  
  const resetToDefaults = () => {
    setBaseRent(initialRent);
    setIncludeBrokerFee(false);
    setBrokerFeeMonths(1);
    setElectricBill(100);
    setWifiBill(60);
    setLeaseLength(12);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Rent Cost Calculator
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={resetToDefaults}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Calculate your total rental costs including all fees and utilities
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {/* Base Rent */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="base-rent">Monthly Base Rent</Label>
            <div className="font-medium">{formatCurrency(baseRent)}</div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="base-rent"
              type="number"
              value={baseRent}
              onChange={(e) => setBaseRent(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full"
            />
          </div>
        </div>
        
        <Separator />
        
        {/* Broker Fee */}
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="broker-fee">Include Broker Fee</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Broker fees are typically charged as a percentage of annual rent or as a flat fee equivalent to one month's rent</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              id="broker-fee"
              checked={includeBrokerFee}
              onCheckedChange={setIncludeBrokerFee}
            />
          </div>
          
          {includeBrokerFee && (
            <div className="grid gap-2 pl-4 border-l-2 border-border">
              <div className="flex items-center justify-between">
                <Label htmlFor="broker-fee-months">Broker Fee (months of rent)</Label>
                <Badge variant="outline">{brokerFeeMonths} {brokerFeeMonths === 1 ? 'month' : 'months'}</Badge>
              </div>
              <Slider
                id="broker-fee-months"
                min={0.5}
                max={2}
                step={0.5}
                value={[brokerFeeMonths]}
                onValueChange={(vals) => setBrokerFeeMonths(vals[0])}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0.5x</span>
                <span>1x</span>
                <span>1.5x</span>
                <span>2x</span>
              </div>
              <div className="text-right text-sm text-muted-foreground mt-1">
                {formatCurrency(baseRent * brokerFeeMonths)}
              </div>
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Utilities */}
        <div className="grid gap-4">
          <Label className="text-base">Monthly Utilities</Label>
          <div className="grid gap-4 pl-4 border-l-2 border-border">
            {/* Electric */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="electric-bill">Electric Bill</Label>
                <div className="font-medium">{formatCurrency(electricBill)}</div>
              </div>
              <Input
                id="electric-bill"
                type="number"
                value={electricBill}
                onChange={(e) => setElectricBill(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full"
              />
            </div>
            
            {/* WiFi */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="wifi-bill">WiFi / Internet</Label>
                <div className="font-medium">{formatCurrency(wifiBill)}</div>
              </div>
              <Input
                id="wifi-bill"
                type="number"
                value={wifiBill}
                onChange={(e) => setWifiBill(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full"
              />
            </div>
            
            <div className="text-right text-sm text-muted-foreground">
              Monthly Utilities: {formatCurrency(electricBill + wifiBill)}
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Lease Length */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="lease-length">Lease Length</Label>
            <Badge variant="outline">{leaseLength} {leaseLength === 1 ? 'month' : 'months'}</Badge>
          </div>
          <Slider
            id="lease-length"
            min={1}
            max={24}
            step={1}
            value={[leaseLength]}
            onValueChange={(vals) => setLeaseLength(vals[0])}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1</span>
            <span>6</span>
            <span>12</span>
            <span>18</span>
            <span>24</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex-col">
        <Separator className="mb-4" />
        <div className="grid gap-4 w-full">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground">First Month Cost</Label>
              <div className="text-2xl font-bold">{formatCurrency(firstMonthCost)}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Average Monthly Cost</Label>
              <div className="text-2xl font-bold">{formatCurrency(monthlyAverage)}</div>
            </div>
          </div>
          
          <div className="space-y-1">
            <Label className="text-muted-foreground">Total Cost Over Lease ({leaseLength} months)</Label>
            <div className="text-3xl font-bold">{formatCurrency(totalCost)}</div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}