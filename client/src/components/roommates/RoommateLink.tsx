import { useState } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Copy, 
  Loader2, 
  RefreshCw, 
  Check, 
  UserPlus, 
  Users,
  Home
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Schema for roommate code form
const roommateCodeSchema = z.object({
  roommateCode: z.string().min(6, "Roommate code must be at least 6 characters")
});

type RoommateCodeFormValues = z.infer<typeof roommateCodeSchema>;

export default function RoommateLink() {
  const [activeTab, setActiveTab] = useState<string>("add");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Get roommate code
  const { data: code, isLoading: codeLoading, refetch: refetchCode } = useQuery<{code: string}, Error>({
    queryKey: ["/api/generate-roommate-code"],
    queryFn: () => apiRequest("POST", "/api/generate-roommate-code").then(res => res.json()),
    enabled: false, // Don't fetch on component mount, wait for user to click "Generate Code"
  });
  
  // Get roommates
  const { data: roommates, isLoading: roommatesLoading } = useQuery<User[], Error>({
    queryKey: ["/api/roommates"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Generate roommate code
  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/generate-roommate-code");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Code generated!",
        description: "Your roommate code has been generated. Share it with your roommate to link accounts.",
        variant: "default"
      });
      queryClient.setQueryData(["/api/generate-roommate-code"], data);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate code",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Form for entering roommate code
  const form = useForm<RoommateCodeFormValues>({
    resolver: zodResolver(roommateCodeSchema),
    defaultValues: {
      roommateCode: ""
    }
  });
  
  // Link with roommate
  const linkRoommateMutation = useMutation({
    mutationFn: async (data: RoommateCodeFormValues) => {
      const res = await apiRequest("POST", "/api/link-roommate", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Accounts linked!",
        description: "You have successfully linked with your roommate.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/roommates"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to link accounts",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleCopyCode = () => {
    if (code && code.code) {
      navigator.clipboard.writeText(code.code);
      setCopied(true);
      toast({
        title: "Code copied!",
        description: "The roommate code has been copied to your clipboard.",
        variant: "default"
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleGenerateCode = () => {
    generateCodeMutation.mutate();
  };
  
  const onSubmit = (data: RoommateCodeFormValues) => {
    linkRoommateMutation.mutate(data);
  };
  
  const getInitials = (user: User) => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-heading">Roommate Management</CardTitle>
        <CardDescription>
          Connect with your roommates to search for properties together and split payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="add" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="add">
              <UserPlus className="h-4 w-4 mr-2" />
              Link Roommates
            </TabsTrigger>
            <TabsTrigger value="view">
              <Users className="h-4 w-4 mr-2" />
              Your Roommates
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="add" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Generate a Code</h3>
                <p className="text-muted-foreground mb-4">
                  Generate a code and share it with your roommate to link your accounts.
                </p>
                
                <div className="flex gap-4 items-center mb-4">
                  <Button 
                    onClick={handleGenerateCode} 
                    disabled={generateCodeMutation.isPending}
                  >
                    {generateCodeMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : code ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate Code
                      </>
                    ) : (
                      "Generate Code"
                    )}
                  </Button>
                </div>
                
                {(code || codeLoading) && (
                  <div className="border rounded-md p-4 flex items-center justify-between">
                    {codeLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Loading code...</span>
                      </div>
                    ) : (
                      <>
                        <span className="font-mono text-lg font-bold">{code?.code}</span>
                        <Button size="sm" variant="outline" onClick={handleCopyCode}>
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Enter a Code</h3>
                <p className="text-muted-foreground mb-4">
                  Enter the code shared by your roommate to link your accounts.
                </p>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="roommateCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Roommate Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter roommate code" />
                          </FormControl>
                          <FormDescription>
                            Enter the code your roommate shared with you
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={linkRoommateMutation.isPending}
                      className="bg-primary hover:bg-primary-light"
                    >
                      {linkRoommateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Linking...
                        </>
                      ) : (
                        "Link Accounts"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="view">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Your Roommates</h3>
                <Badge className="bg-primary text-white">
                  {roommates?.length || 0} Roommates
                </Badge>
              </div>
              
              {roommatesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : roommates?.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No Roommates Yet</h3>
                  <p className="text-muted-foreground">
                    You haven't linked with any roommates yet
                  </p>
                  <Button 
                    variant="link" 
                    className="mt-2"
                    onClick={() => setActiveTab("add")}
                  >
                    Link with a Roommate
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {roommates?.map((roommate) => (
                    <div 
                      key={roommate.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-4">
                          <AvatarImage src={roommate.profileImage || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(roommate)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{roommate.firstName} {roommate.lastName}</h4>
                          <p className="text-sm text-muted-foreground">{roommate.email}</p>
                        </div>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Home className="h-4 w-4 mr-2" />
                            Co-Search
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Search Together</DialogTitle>
                            <DialogDescription>
                              Start a collaborative search with {roommate.firstName} to find a property together.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <p className="mb-4">
                              When you co-search with a roommate, both of your preferences will be considered 
                              when searching for properties.
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>Combine your budgets for higher price ranges</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>Match both of your location preferences</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>Find properties with enough bedrooms for both</span>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" className="bg-primary hover:bg-primary-light">
                              Start Co-Search
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Linking accounts allows you to search for properties together and collaborate on finding your perfect home.
        </p>
      </CardFooter>
    </Card>
  );
}