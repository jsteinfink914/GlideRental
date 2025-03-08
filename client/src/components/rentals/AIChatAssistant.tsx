import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Property } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: {
    properties?: Property[];
    options?: { label: string; value: string }[];
  };
}

interface AIChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertySelect?: (property: Property) => void;
}

export default function AIChatAssistant({ isOpen, onClose, onPropertySelect }: AIChatAssistantProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello${user ? ` ${user.firstName}` : ''}! I'm your Glide Assistant. How can I help with your apartment search today?`
    }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // In a real implementation, this would connect to the backend API
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response based on simple pattern matching
      let response: AIChatMessage = {
        role: 'assistant',
        content: "I'm still learning how to help with that. Could you try a different question about apartments or neighborhoods?"
      };
      
      if (message.toLowerCase().includes("bedroom") || message.toLowerCase().includes("bath")) {
        response = {
          role: 'assistant',
          content: "I found several apartments matching your criteria. Here are a few options:",
          suggestions: {
            properties: [
              {
                id: 1,
                landlordId: 1,
                title: "Modern 2BR in Williamsburg",
                description: "Beautiful apartment with high ceilings and modern finishes",
                address: "123 Bedford Ave",
                neighborhood: "Williamsburg",
                city: "Brooklyn",
                state: "NY",
                zipCode: "11211",
                rent: 2950,
                bedrooms: 2,
                bathrooms: 1,
                squareFeet: 850,
                propertyType: "apartment",
                availableDate: new Date("2023-08-01"),
                isPublished: true,
                hasVirtualTour: false,
                hasDoorman: false,
                hasInUnitLaundry: true,
                hasDishwasher: true,
                petFriendly: true,
                rating: 4.8,
                noFee: false,
                images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"],
                amenities: ["Dishwasher", "In-unit laundry"],
                embedding: null,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              {
                id: 2,
                landlordId: 2,
                title: "Sunny 2BR in Park Slope",
                description: "Charming apartment with lots of natural light",
                address: "456 5th Ave",
                neighborhood: "Park Slope",
                city: "Brooklyn",
                state: "NY",
                zipCode: "11215",
                rent: 2800,
                bedrooms: 2,
                bathrooms: 1,
                squareFeet: 800,
                propertyType: "apartment",
                availableDate: new Date("2023-07-15"),
                isPublished: true,
                hasVirtualTour: false,
                hasDoorman: false,
                hasInUnitLaundry: false,
                hasDishwasher: true,
                petFriendly: false,
                rating: 4.6,
                noFee: false,
                images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"],
                amenities: ["Dishwasher", "Laundry in building"],
                embedding: null,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            ],
            options: [
              { label: "Show more apartments", value: "more" },
              { label: "Filter by neighborhood", value: "neighborhood" },
              { label: "Only in-unit laundry", value: "laundry" }
            ]
          }
        };
      } else if (message.toLowerCase().includes("neighborhood") || message.toLowerCase().includes("area")) {
        response = {
          role: 'assistant',
          content: "Here are some popular neighborhoods you might be interested in:",
          suggestions: {
            options: [
              { label: "Williamsburg", value: "williamsburg" },
              { label: "Park Slope", value: "park-slope" },
              { label: "Chelsea", value: "chelsea" },
              { label: "Upper West Side", value: "upper-west-side" },
              { label: "East Village", value: "east-village" }
            ]
          }
        };
      }
      
      return response;
    }
  });
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: AIChatMessage = {
      role: 'user',
      content: input
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    // Send to API and get response
    sendMessageMutation.mutate(input, {
      onSuccess: (response) => {
        setMessages(prev => [...prev, response]);
      }
    });
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    const userMessage: AIChatMessage = {
      role: 'user',
      content: suggestion
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Send to API and get response
    sendMessageMutation.mutate(suggestion, {
      onSuccess: (response) => {
        setMessages(prev => [...prev, response]);
      }
    });
  };
  
  const handlePropertyClick = (property: Property) => {
    if (onPropertySelect) {
      onPropertySelect(property);
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center md:items-center z-50">
      <div className="bg-white w-full max-w-lg rounded-t-xl md:rounded-xl shadow-lg h-3/4 md:h-4/5 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3">
              <span className="material-icons text-white">smart_toy</span>
            </div>
            <div>
              <h3 className="font-heading font-medium text-lg">Glide Assistant</h3>
              <p className="text-text-medium text-sm">AI-powered rental search</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full"
            onClick={onClose}
          >
            <span className="material-icons">close</span>
          </Button>
        </div>
        
        {/* Chat Messages */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex items-start ${message.role === 'user' ? 'justify-end' : ''} mb-4`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="material-icons text-white text-sm">smart_toy</span>
                </div>
              )}
              
              <div className={`space-y-3 max-w-xs md:max-w-md ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
                <div className={`${
                  message.role === 'assistant' 
                    ? 'bg-secondary rounded-lg rounded-tl-none' 
                    : 'bg-primary text-white rounded-lg rounded-tr-none'
                } p-3`}>
                  <p>{message.content}</p>
                </div>
                
                {/* Property suggestions */}
                {message.suggestions?.properties && (
                  <div className="grid grid-cols-1 gap-2">
                    {message.suggestions.properties.map((property) => (
                      <div 
                        key={property.id} 
                        className="bg-white border border-gray-200 rounded-lg p-2 hover:bg-secondary cursor-pointer transition"
                        onClick={() => handlePropertyClick(property)}
                      >
                        <div className="flex items-center">
                          <img 
                            src={property.images?.[0] || "https://via.placeholder.com/100?text=No+Image"}
                            alt={property.title} 
                            className="w-16 h-16 rounded mr-2 object-cover"
                          />
                          <div className="flex-grow">
                            <h4 className="font-medium text-sm">{property.title}</h4>
                            <p className="text-text-medium text-xs">
                              ${property.rent.toLocaleString()}/mo · {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed`} · {property.bathrooms} bath
                            </p>
                            <p className="text-text-medium text-xs">
                              {property.amenities?.slice(0, 2).join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Quick reply options */}
                {message.suggestions?.options && (
                  <div className="flex flex-wrap gap-2">
                    {message.suggestions.options.map((option, i) => (
                      <Button 
                        key={i} 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full text-sm"
                        onClick={() => handleSuggestionClick(option.label)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center ml-2 flex-shrink-0 order-2">
                  <span className="material-icons text-white text-sm">person</span>
                </div>
              )}
            </div>
          ))}
          {sendMessageMutation.isPending && (
            <div className="flex items-start mb-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2 flex-shrink-0">
                <span className="material-icons text-white text-sm">smart_toy</span>
              </div>
              <div className="bg-secondary rounded-lg rounded-tl-none p-3 max-w-xs md:max-w-md">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "600ms" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <Input 
              placeholder="Ask about neighborhoods, prices, or amenities..." 
              className="flex-grow rounded-r-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sendMessageMutation.isPending}
            />
            <Button 
              type="submit" 
              className="bg-primary text-white rounded-l-none px-4 py-3"
              disabled={sendMessageMutation.isPending}
            >
              <span className="material-icons">send</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
