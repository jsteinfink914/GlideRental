import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { User, Property } from "@shared/schema";
import Navigation from "@/components/layout/Navigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PropertyGrid from "@/components/rentals/PropertyGrid";
import { getQueryFn } from "@/lib/queryClient";
import RoommateLink from "@/components/roommates/RoommateLink";
import { Redirect } from "wouter";
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

export default function SavedPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("saved");

  // Redirect to onboarding if user hasn't completed it
  if (user && !user.onboardingCompleted) {
    return <Redirect to="/onboarding" />;
  }

  // Fetch user's saved properties
  const { data: savedProperties, isLoading: isLoadingSaved } = useQuery<{savedId: number; property: Property}[]>({
    queryKey: ['/api/saved-properties'],
  });

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
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 lg:pl-64 pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-6">
            {/* Main Navigation Tabs */}
            <div className="flex mb-6 border-b border-gray-200">
              <a 
                href="/search"
                className="flex items-center px-6 py-3 font-medium text-text-medium hover:text-primary"
              >
                <span className="material-icons mr-2">search</span>
                Search
              </a>
              <a 
                href="/for-you"
                className="flex items-center px-6 py-3 font-medium text-text-medium hover:text-primary"
              >
                <span className="material-icons mr-2">recommend</span>
                For You
              </a>
              <a 
                href="/saved"
                className="flex items-center px-6 py-3 font-medium text-primary border-b-2 border-primary"
              >
                <span className="material-icons mr-2">bookmarks</span>
                Saved
              </a>
              <a 
                href="/search-tools"
                className="flex items-center px-6 py-3 font-medium text-text-medium hover:text-primary"
              >
                <span className="material-icons mr-2">view_list</span>
                Tools
              </a>
            </div>
            
            <h1 className="text-3xl font-heading font-bold mb-6">Saved & Roommates</h1>
      
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="grid grid-cols-2 md:w-[400px] mb-6">
                <TabsTrigger value="saved">
                  <span className="material-icons mr-2 text-sm">bookmark</span>
                  Saved Properties
                </TabsTrigger>
                <TabsTrigger value="roommates">
                  <Users className="h-4 w-4 mr-2" />
                  Roommates
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="saved">
                <div className="mb-6">
                  <h2 className="text-xl font-heading font-semibold text-text-dark mb-4">
                    Saved Properties
                  </h2>
                  <p className="text-text-medium mb-6">
                    Properties you've saved for later
                  </p>
                  
                  {isLoadingSaved ? (
                    <PropertyGrid isLoading={true} />
                  ) : savedProperties?.length ? (
                    <PropertyGrid savedProperties={savedProperties} />
                  ) : (
                    <div className="text-center bg-secondary rounded-xl p-8">
                      <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                        <span className="material-icons text-white text-2xl">favorite</span>
                      </div>
                      <h3 className="font-heading font-medium text-lg text-text-dark mb-2">
                        No saved properties yet
                      </h3>
                      <p className="text-text-medium mb-4">
                        Save properties you like and they will appear here
                      </p>
                      <Button 
                        className="bg-primary hover:bg-primary-light"
                        onClick={() => window.location.href = "/search"}
                      >
                        Start Searching
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="roommates">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl font-heading">Roommate Management</CardTitle>
                    <CardDescription>
                      Link with roommates to coordinate your apartment search
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RoommateLink />
                    
                    {roommatesLoading ? (
                      <div className="flex justify-center py-8 mt-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : roommates && roommates.length > 0 ? (
                      <div className="mt-8 space-y-8">
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    ) : null}
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