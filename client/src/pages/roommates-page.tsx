import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoommateLink from "@/components/roommates/RoommateLink";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Home, Settings, Building, Mail, Calendar } from "lucide-react";
import { useState } from "react";
import { Redirect } from "wouter";

export default function RoommatesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("management");

  // Redirect to onboarding if user hasn't completed it
  if (user && !user.onboardingCompleted) {
    return <Redirect to="/onboarding" />;
  }

  // Get roommates
  const { data: roommates, isLoading: roommatesLoading } = useQuery<User[], Error>({
    queryKey: ["/api/roommates"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Function to get initials for avatar fallback
  const getInitials = (roommate: User) => {
    return `${roommate.firstName.charAt(0)}${roommate.lastName.charAt(0)}`;
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-heading font-bold mb-6">Roommates</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-2 md:w-[400px] mb-6">
          <TabsTrigger value="management">
            <Users className="h-4 w-4 mr-2" />
            Management
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="management">
          <RoommateLink />
        </TabsContent>
        
        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-heading">Roommate Dashboard</CardTitle>
              <CardDescription>
                View and manage your living situation with roommates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {roommatesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !roommates || roommates.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-2">No Roommates Connected</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't linked with any roommates yet. Link with roommates to
                    enable collaborative features.
                  </p>
                  <Button 
                    onClick={() => setActiveTab("management")}
                    className="bg-primary hover:bg-primary-light"
                  >
                    Link Roommates
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <h3 className="font-medium text-lg mb-4">Your Roommate Group</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Include the current user in the group */}
                      <div className="border rounded-md p-4 flex flex-col items-center">
                        <Avatar className="h-16 w-16 mb-2">
                          <AvatarImage src={user?.profileImage || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user && `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`}
                          </AvatarFallback>
                        </Avatar>
                        <h4 className="font-medium">{user?.firstName} {user?.lastName}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{user?.email}</p>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">You</span>
                      </div>
                      
                      {roommates?.map((roommate) => (
                        <div key={roommate.id} className="border rounded-md p-4 flex flex-col items-center">
                          <Avatar className="h-16 w-16 mb-2">
                            <AvatarImage src={roommate.profileImage || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(roommate)}
                            </AvatarFallback>
                          </Avatar>
                          <h4 className="font-medium">{roommate.firstName} {roommate.lastName}</h4>
                          <p className="text-sm text-muted-foreground">{roommate.email}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Shared Search</CardTitle>
                          <Button size="icon" variant="ghost">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center py-4">
                          <Building className="h-12 w-12 text-primary mb-2" />
                          <p className="text-center text-sm text-muted-foreground mb-4">
                            Search for properties that match all roommates' preferences
                          </p>
                          <Button className="w-full bg-primary hover:bg-primary-light">
                            Start Shared Search
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Group Chat</CardTitle>
                          <Button size="icon" variant="ghost">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center py-4">
                          <Mail className="h-12 w-12 text-primary mb-2" />
                          <p className="text-center text-sm text-muted-foreground mb-4">
                            Create a group chat with all your roommates for easier coordination
                          </p>
                          <Button className="w-full bg-primary hover:bg-primary-light">
                            Create Group Chat
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Move-in Planner</CardTitle>
                          <Button size="icon" variant="ghost">
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center py-4">
                          <Calendar className="h-12 w-12 text-primary mb-2" />
                          <p className="text-center text-sm text-muted-foreground mb-4">
                            Plan your move-in logistics and coordinate with roommates
                          </p>
                          <Button className="w-full bg-primary hover:bg-primary-light">
                            Open Planner
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}