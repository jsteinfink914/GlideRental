import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/layout/Navigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { 
  CreditCard, 
  Building, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  Plus,
  Trash2,
  Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Payment } from "@shared/schema";

export default function PaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [autopayEnabled, setAutopayEnabled] = useState(false);

  // Fetch payments
  const { data: payments, isLoading } = useQuery({
    queryKey: ['/api/payments'],
  });

  // Create payment mutation
  const paymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const res = await apiRequest("PUT", `/api/payments/${paymentId}`, {
        status: "completed"
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      toast({
        title: "Payment successful",
        description: "Your payment has been processed successfully."
      });
      setCardNumber("");
      setCardName("");
      setExpiryDate("");
      setCvv("");
    },
    onError: (error: Error) => {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const filterPayments = (status: string) => {
    if (!payments || !Array.isArray(payments)) return [];
    return payments.filter((payment: Payment) => payment.status === status);
  };

  const upcomingPayments = filterPayments("pending");
  const paidPayments = filterPayments("completed");
  
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPaymentStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Due</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatPaymentType = (type: string) => {
    switch (type) {
      case 'rent':
        return "Monthly Rent";
      case 'security_deposit':
        return "Security Deposit";
      case 'application_fee':
        return "Application Fee";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const handleSubmitPayment = (paymentId: number) => {
    if (paymentMethod === "card") {
      // Basic validation
      if (!cardNumber || !cardName || !expiryDate || !cvv) {
        toast({
          title: "Missing information",
          description: "Please fill out all card details",
          variant: "destructive"
        });
        return;
      }
      
      // In a real app, we would securely process the payment
      // For this demo, we'll just update the payment status
      paymentMutation.mutate(paymentId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 lg:pl-64 pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-6">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-heading font-bold text-text-dark">Payments</h1>
              <p className="text-text-medium mt-2">
                Manage your rent payments and view payment history
              </p>
            </div>

            {/* Payments Tabs */}
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming" className="px-6">Upcoming</TabsTrigger>
                <TabsTrigger value="history" className="px-6">Payment History</TabsTrigger>
                <TabsTrigger value="methods" className="px-6">Payment Methods</TabsTrigger>
              </TabsList>

              {/* Upcoming Payments Tab */}
              <TabsContent value="upcoming">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-heading">Upcoming Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="border-b pb-4">
                            <div className="flex justify-between mb-2">
                              <Skeleton className="h-6 w-32" />
                              <Skeleton className="h-6 w-24" />
                            </div>
                            <div className="flex justify-between">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-4 w-20" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : upcomingPayments.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                          <span className="material-icons text-white text-2xl">payments</span>
                        </div>
                        <h3 className="font-heading font-medium text-lg text-text-dark mb-2">
                          No upcoming payments
                        </h3>
                        <p className="text-text-medium mb-4">
                          You're all caught up with your payments
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {upcomingPayments.map((payment: Payment) => (
                          <div key={payment.id} className="border-b pb-6 last:border-0 last:pb-0">
                            <div className="flex justify-between mb-2">
                              <div>
                                <h4 className="font-medium">{formatPaymentType(payment.type)}</h4>
                                <p className="text-sm text-text-medium">
                                  Due: {payment.dueDate ? formatDate(payment.dueDate) : 'No due date set'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">${payment.amount.toLocaleString()}</p>
                                {formatPaymentStatus(payment.status)}
                              </div>
                            </div>
                            
                            {/* Payment Form */}
                            <div className="mt-4 p-4 bg-secondary rounded-lg">
                              <h4 className="font-medium mb-4">Payment Method</h4>
                              
                              <div className="flex gap-4 mb-4">
                                <div 
                                  className={`flex-1 border rounded-lg p-3 cursor-pointer ${
                                    paymentMethod === 'card' ? 'border-primary bg-white' : 'border-gray-200'
                                  }`}
                                  onClick={() => setPaymentMethod('card')}
                                >
                                  <div className="flex items-center">
                                    <span className="material-icons text-primary mr-2">credit_card</span>
                                    <span className="font-medium">Credit/Debit Card</span>
                                  </div>
                                </div>
                                <div 
                                  className={`flex-1 border rounded-lg p-3 cursor-pointer ${
                                    paymentMethod === 'bank' ? 'border-primary bg-white' : 'border-gray-200'
                                  }`}
                                  onClick={() => setPaymentMethod('bank')}
                                >
                                  <div className="flex items-center">
                                    <span className="material-icons text-primary mr-2">account_balance</span>
                                    <span className="font-medium">Bank Account</span>
                                  </div>
                                </div>
                              </div>
                              
                              {paymentMethod === 'card' && (
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="cardNumber">Card Number</Label>
                                    <Input
                                      id="cardNumber"
                                      placeholder="1234 5678 9012 3456"
                                      value={cardNumber}
                                      onChange={(e) => setCardNumber(e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="cardName">Name on Card</Label>
                                    <Input
                                      id="cardName"
                                      placeholder="John Doe"
                                      value={cardName}
                                      onChange={(e) => setCardName(e.target.value)}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="expiryDate">Expiry Date</Label>
                                      <Input
                                        id="expiryDate"
                                        placeholder="MM/YY"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="cvv">CVV</Label>
                                      <Input
                                        id="cvv"
                                        placeholder="123"
                                        value={cvv}
                                        onChange={(e) => setCvv(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {paymentMethod === 'bank' && (
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="accountType">Account Type</Label>
                                    <Select defaultValue="checking">
                                      <SelectTrigger id="accountType">
                                        <SelectValue placeholder="Select account type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="checking">Checking</SelectItem>
                                        <SelectItem value="savings">Savings</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="routingNumber">Routing Number</Label>
                                    <Input id="routingNumber" placeholder="123456789" />
                                  </div>
                                  <div>
                                    <Label htmlFor="accountNumber">Account Number</Label>
                                    <Input id="accountNumber" placeholder="1234567890123" />
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center mt-6">
                                <p className="font-medium">Total: ${payment.amount.toLocaleString()}</p>
                                <Button 
                                  className="bg-primary hover:bg-primary-light"
                                  onClick={() => handleSubmitPayment(payment.id)}
                                  disabled={paymentMutation.isPending}
                                >
                                  {paymentMutation.isPending ? "Processing..." : "Pay Now"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payment History Tab */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-heading">Payment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="border-b pb-4">
                            <div className="flex justify-between mb-2">
                              <Skeleton className="h-6 w-32" />
                              <Skeleton className="h-6 w-24" />
                            </div>
                            <div className="flex justify-between">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-4 w-20" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : paidPayments.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                          <span className="material-icons text-white text-2xl">history</span>
                        </div>
                        <h3 className="font-heading font-medium text-lg text-text-dark mb-2">
                          No payment history
                        </h3>
                        <p className="text-text-medium mb-4">
                          Your past payments will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {paidPayments.map((payment: Payment) => (
                          <div key={payment.id} className="border-b pb-4 last:border-0 last:pb-0">
                            <div className="flex justify-between mb-2">
                              <div>
                                <h4 className="font-medium">{formatPaymentType(payment.type)}</h4>
                                <p className="text-sm text-text-medium">
                                  Paid: {payment.paidDate ? formatDate(payment.paidDate) : 'No payment date'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">${payment.amount.toLocaleString()}</p>
                                {formatPaymentStatus(payment.status)}
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button variant="outline" size="sm" className="border-primary text-primary">
                                <span className="material-icons text-sm mr-1">receipt</span>
                                View Receipt
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payment Methods Tab */}
              <TabsContent value="methods">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-xl font-heading">Payment Methods</CardTitle>
                        <CardDescription>Manage your preferred payment methods</CardDescription>
                      </div>
                      <Button className="bg-primary hover:bg-primary-light">
                        <Plus size={16} className="mr-1" />
                        Add Method
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 shadow-sm transition-all hover:shadow-md">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-12 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                              <Building className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">Bank Account (Chase)</h4>
                              <p className="text-sm text-text-medium">Checking ****1234</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end mt-4 space-x-2">
                          <Button variant="outline" size="sm" className="text-text-medium">
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-text-medium">
                            <Trash2 size={14} className="mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 shadow-sm transition-all hover:shadow-md">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-12 h-8 bg-green-100 rounded flex items-center justify-center mr-3">
                              <svg className="h-5 w-5 text-green-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17 3H7C4.79086 3 3 4.79086 3 7V17C3 19.2091 4.79086 21 7 21H17C19.2091 21 21 19.2091 21 17V7C21 4.79086 19.2091 3 17 3Z" stroke="currentColor" strokeWidth="2" />
                                <path d="M15 9C14.2044 9 13.4413 9.31607 12.8787 9.87868C12.3161 10.4413 12 11.2044 12 12V12C12 11.2044 11.6839 10.4413 11.1213 9.87868C10.5587 9.31607 9.79565 9 9 9H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M15 15C14.2044 15 13.4413 14.6839 12.8787 14.1213C12.3161 13.5587 12 12.7956 12 12V12C12 12.7956 11.6839 13.5587 11.1213 14.1213C10.5587 14.6839 9.79565 15 9 15H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-medium">Bilt Rewards</h4>
                              <p className="text-sm text-text-medium">Mastercard ending in 8765</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end mt-4 space-x-2">
                          <Button variant="outline" size="sm" className="text-text-medium">
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-text-medium">
                            <Trash2 size={14} className="mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 shadow-sm transition-all hover:shadow-md">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-12 h-8 bg-purple-100 rounded flex items-center justify-center mr-3">
                              <svg className="h-5 w-5 text-purple-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
                                <path d="M7.5 12.5L10.5 15.5L16.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-medium">Zelle</h4>
                              <p className="text-sm text-text-medium">Connected to example@email.com</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end mt-4 space-x-2">
                          <Button variant="outline" size="sm" className="text-text-medium">
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-text-medium">
                            <Trash2 size={14} className="mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-medium text-lg mb-4">Autopay Settings</h3>
                      <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm">
                        <div>
                          <h4 className="font-medium">Automatic Payments</h4>
                          <p className="text-sm text-text-medium">Pay rent automatically on the due date</p>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2 text-sm">Off</span>
                          <Switch 
                            id="autopay" 
                            checked={autopayEnabled} 
                            onCheckedChange={setAutopayEnabled}
                          />
                          <span className="ml-2 text-sm">On</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}
