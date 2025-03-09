import { PropertyQuery, getAIPropertyRecommendations, processLocationQuery } from "@/lib/openai";
import { Property } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PropertyCard } from "@/components/rentals/PropertyCard";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: {
    properties?: Property[];
    options?: { label: string; value: string }[];
    mapFilter?: {
      highlightedAreas?: { center: { lat: number; lng: number }; radius: number; score: number }[];
      propertyIds?: number[];
      relevanceScores?: { [propertyId: number]: number };
    };
  };
}

interface AIChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertySelect?: (property: Property) => void;
  onMapFilter?: (filter: {
    highlightedAreas?: { center: { lat: number; lng: number }; radius: number; score: number }[];
    propertyIds?: number[];
    relevanceScores?: { [propertyId: number]: number };
  }) => void;
  availableProperties?: Property[];
}

export default function AIChatAssistant({ 
  isOpen, 
  onClose,
  onPropertySelect,
  onMapFilter,
  availableProperties = []
}: AIChatAssistantProps) {
  const { toast } = useToast();
  const chatRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI rental assistant. How can I help you find your ideal home today?',
      suggestions: {
        options: [
          { label: 'Luxury apartments near downtown', value: 'luxury-downtown' },
          { label: 'Pet-friendly rentals', value: 'pet-friendly' },
          { label: 'Properties near public transit', value: 'near-transit' },
          { label: 'Apartments with in-unit laundry', value: 'in-unit-laundry' }
        ]
      }
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputSubmit = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: AIChatMessage = {
      role: 'user',
      content: text
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      // Process location first to extract preferences
      const locationResult = await processLocationQuery(text);

      // Build property query
      const query: PropertyQuery = {
        description: text,
        preferences: {
          neighborhood: locationResult.locationPreferences?.[0],
          ...(locationResult.searchArea && {
            proximity: [`${locationResult.searchArea.center.lat},${locationResult.searchArea.center.lng}`]
          })
        }
      };

      const recommendations = await getAIPropertyRecommendations(query);

      const suggestedProperties = availableProperties.filter(p => 
        recommendations.propertyIds.includes(p.id)
      );

      const mapFilter = {
        propertyIds: recommendations.propertyIds,
        relevanceScores: recommendations.relevanceScores,
        highlightedAreas: recommendations.highlightedAreas
      };

      onMapFilter?.(mapFilter);

      const assistantMessage: AIChatMessage = {
        role: 'assistant',
        content: recommendations.explanation,
        suggestions: {
          properties: suggestedProperties,
          mapFilter
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing AI chat:', error);
      toast({
        title: "Error",
        description: "Sorry, I couldn't process your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptionClick = (value: string) => {
    handleInputSubmit(value);
  };

  const handlePropertyClick = (property: Property) => {
    onPropertySelect?.(property);
  };

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>AI Rental Assistant</SheetTitle>
        </SheetHeader>
        
        <ScrollArea ref={chatRef} className="h-[calc(100vh-12rem)] pb-4 pr-4">
          <div className="flex flex-col gap-4 py-4">
            {messages.map((message, i) => (
              <div key={i} className={`flex ${message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
                <Avatar className="h-8 w-8">
                  {message.role === 'assistant' ? (
                    <>
                      <AvatarImage src="/ai-assistant.png" />
                      <AvatarFallback>AI</AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarImage src="/user-avatar.png" />
                      <AvatarFallback>Me</AvatarFallback>
                    </>
                  )}
                </Avatar>
                
                <div className={`mx-2 max-w-[80%] space-y-4 ${message.role === 'assistant' ? 'text-left' : 'text-right'}`}>
                  <Card className="p-4">
                    <p className="text-sm">{message.content}</p>
                  </Card>

                  {message.suggestions?.options && (
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.options.map((option, j) => (
                        <Button
                          key={j}
                          variant="outline"
                          size="sm"
                          onClick={() => handleOptionClick(option.label)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {message.suggestions?.properties && (
                    <div className="grid grid-cols-1 gap-4">
                      {message.suggestions.properties.map((property, j) => (
                        <PropertyCard
                          key={j}
                          property={property}
                          onSelect={handlePropertyClick}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <SheetFooter className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-background">
          <div className="flex w-full items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInputSubmit(inputValue)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 text-sm border rounded-md"
              disabled={isProcessing}
            />
            <Button
              size="icon"
              onClick={() => handleInputSubmit(inputValue)}
              disabled={isProcessing || !inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}