import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/Navigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Message, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  user: User;
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");

  // Fetch messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/messages'],
  });

  // Fetch users for displaying user info in conversations
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      // This would be a real API call to get all users
      // For demonstration, we'll return mock data
      return [
        {
          id: 2,
          username: "landlord1",
          email: "landlord@example.com",
          firstName: "John",
          lastName: "Smith",
          userType: "landlord",
          profileImage: null,
        },
        {
          id: 3,
          username: "renter2",
          email: "renter2@example.com",
          firstName: "Alice",
          lastName: "Johnson",
          userType: "renter",
          profileImage: null,
        }
      ];
    },
    enabled: !!messages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversation) throw new Error("No conversation selected");
      
      const message = {
        receiverId: selectedConversation.user.id,
        content,
      };
      
      const res = await apiRequest("POST", "/api/messages", message);
      return await res.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest("PUT", `/api/messages/${messageId}/read`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    }
  });

  // Format messages into conversations
  const formatConversations = (): Conversation[] => {
    if (!messages || !users || !user) return [];
    
    const conversationsMap = new Map<number, Conversation>();
    
    // Group messages by the other participant
    messages.forEach((message: Message) => {
      const otherUserId = message.senderId === user.id ? message.receiverId : message.senderId;
      const otherUser = users.find(u => u.id === otherUserId);
      
      if (!otherUser) return;
      
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          user: otherUser,
          messages: [],
          lastMessage: message,
          unreadCount: 0
        });
      }
      
      const conversation = conversationsMap.get(otherUserId)!;
      conversation.messages.push(message);
      
      // Update last message if this one is newer
      if (new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)) {
        conversation.lastMessage = message;
      }
      
      // Count unread messages where the user is the recipient
      if (!message.isRead && message.receiverId === user.id) {
        conversation.unreadCount++;
      }
    });
    
    // Sort conversations by the latest message time
    return Array.from(conversationsMap.values()).sort((a, b) => 
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  };
  
  const conversations = formatConversations();

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // Mark unread messages as read
    conversation.messages.forEach(message => {
      if (!message.isRead && message.receiverId === user?.id) {
        markAsReadMutation.mutate(message.id);
      }
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    
    sendMessageMutation.mutate(messageText);
  };

  const formatMessageTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatConversationTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return formatMessageTime(date);
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 lg:pl-64 pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-6 h-full">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-heading font-bold text-text-dark">Messages</h1>
              <p className="text-text-medium mt-2">
                Communicate with landlords, brokers, and roommates
              </p>
            </div>

            {/* Messages Interface */}
            <Card className="h-[calc(100vh-240px)] flex flex-col md:flex-row">
              {/* Conversations List */}
              <div className="w-full md:w-80 border-r border-gray-200 flex-shrink-0 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <Input 
                    placeholder="Search messages..." 
                    className="w-full"
                  />
                </div>
                <div className="h-[calc(100%-62px)] overflow-y-auto">
                  {isLoadingMessages || isLoadingUsers ? (
                    <div className="space-y-2 p-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-2">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[80%]" />
                            <Skeleton className="h-3 w-[60%]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <span className="material-icons text-text-medium text-4xl mb-2">chat</span>
                      <p className="text-text-medium mb-2">No messages yet</p>
                      <p className="text-text-medium text-sm mb-4">
                        Start a conversation with a landlord or roommate
                      </p>
                      <Button className="bg-primary hover:bg-primary-light">
                        New Message
                      </Button>
                    </div>
                  ) : (
                    <ul>
                      {conversations.map((conversation) => (
                        <li 
                          key={conversation.user.id}
                          onClick={() => handleSelectConversation(conversation)}
                          className={`flex items-start p-4 hover:bg-gray-50 cursor-pointer ${
                            selectedConversation?.user.id === conversation.user.id ? 'bg-secondary' : ''
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center mr-3 flex-shrink-0">
                            {conversation.user.profileImage ? (
                              <img
                                src={conversation.user.profileImage}
                                alt={`${conversation.user.firstName} ${conversation.user.lastName}`}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="material-icons">person</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <h3 className="font-medium truncate">
                                {conversation.user.firstName} {conversation.user.lastName}
                              </h3>
                              <span className="text-xs text-text-medium ml-2 whitespace-nowrap">
                                {formatConversationTime(conversation.lastMessage.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-text-medium truncate">
                              {conversation.lastMessage.senderId === user?.id ? 'You: ' : ''}
                              {conversation.lastMessage.content}
                            </p>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <div className="ml-2 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 flex flex-col h-full">
                {!selectedConversation ? (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <span className="material-icons text-text-medium text-4xl mb-2">forum</span>
                    <h3 className="text-lg font-medium mb-2">Your Messages</h3>
                    <p className="text-text-medium text-sm mb-4">
                      Select a conversation to view messages
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Conversation Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center">
                      <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center mr-3">
                        {selectedConversation.user.profileImage ? (
                          <img
                            src={selectedConversation.user.profileImage}
                            alt={`${selectedConversation.user.firstName} ${selectedConversation.user.lastName}`}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="material-icons">person</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {selectedConversation.user.firstName} {selectedConversation.user.lastName}
                        </h3>
                        <p className="text-xs text-text-medium">
                          {selectedConversation.user.userType === 'landlord' ? 'Landlord' : 'Renter'}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <Button variant="ghost" size="icon">
                          <span className="material-icons">more_vert</span>
                        </Button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto">
                      <div className="space-y-4">
                        {selectedConversation.messages.map((message) => (
                          <div 
                            key={message.id} 
                            className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                          >
                            {message.senderId !== user?.id && (
                              <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                                {selectedConversation.user.profileImage ? (
                                  <img
                                    src={selectedConversation.user.profileImage}
                                    alt={`${selectedConversation.user.firstName}`}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="material-icons text-sm">person</span>
                                )}
                              </div>
                            )}
                            <div 
                              className={`px-4 py-2 rounded-lg max-w-xs md:max-w-md ${
                                message.senderId === user?.id 
                                  ? 'bg-primary text-white rounded-tr-none' 
                                  : 'bg-secondary rounded-tl-none'
                              }`}
                            >
                              <p>{message.content}</p>
                              <div 
                                className={`text-xs mt-1 ${
                                  message.senderId === user?.id ? 'text-white/70' : 'text-text-medium'
                                }`}
                              >
                                {formatMessageTime(message.createdAt)}
                                {message.senderId === user?.id && (
                                  <span className="ml-2">
                                    {message.isRead ? (
                                      <span className="material-icons text-xs">done_all</span>
                                    ) : (
                                      <span className="material-icons text-xs">done</span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                            {message.senderId === user?.id && (
                              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center ml-2 flex-shrink-0 mt-1">
                                {user.profileImage ? (
                                  <img
                                    src={user.profileImage}
                                    alt={`${user.firstName}`}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="material-icons text-sm">person</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200">
                      <form onSubmit={handleSendMessage} className="flex items-center">
                        <Input
                          placeholder="Type a message..."
                          className="flex-1 rounded-r-none"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          disabled={sendMessageMutation.isPending}
                        />
                        <Button 
                          type="submit" 
                          className="rounded-l-none bg-primary hover:bg-primary-light"
                          disabled={sendMessageMutation.isPending}
                        >
                          <span className="material-icons">send</span>
                        </Button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}
