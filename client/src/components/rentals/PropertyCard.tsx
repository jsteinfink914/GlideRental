import { useState } from "react";
import { Link } from "wouter";
import { Property } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";

interface PropertyCardProps {
  property: Property;
  isSaved?: boolean;
  savedId?: number;
  onSelect?: (property: Property) => void;
}

export default function PropertyCard({ property, isSaved = false, savedId, onSelect }: PropertyCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const saveMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      const res = await apiRequest("POST", "/api/saved-properties", { propertyId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-properties'] });
      toast({
        title: "Property saved",
        description: "The property has been added to your saved listings."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save property",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const unsaveMutation = useMutation({
    mutationFn: async (savedPropertyId: number) => {
      await apiRequest("DELETE", `/api/saved-properties/${savedPropertyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-properties'] });
      toast({
        title: "Property removed",
        description: "The property has been removed from your saved listings."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove property",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleSaveToggle = () => {
    if (isSaved && savedId) {
      unsaveMutation.mutate(savedId);
    } else {
      saveMutation.mutate(property.id);
    }
  };
  
  const handlePreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };
  
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };
  
  const handleCardClick = () => {
    if (onSelect) {
      onSelect(property);
    }
  };
  
  // Get current image or fallback
  const currentImage = property.images && property.images.length > 0
    ? property.images[currentImageIndex]
    : 'https://via.placeholder.com/500x300?text=No+Image+Available';
  
  // Format bathroom numbers (e.g., 1.5 baths)
  const formatBathrooms = (num: number) => {
    return num % 1 === 0 ? num : num.toFixed(1);
  };
  
  return (
    <Card 
      className="property-card overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lg"
      onClick={handleCardClick}
    >
      {/* Property Image Gallery */}
      <div className="relative h-60 bg-gray-100">
        <img 
          src={currentImage} 
          alt={property.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4 bg-white rounded-lg px-2 py-1 text-sm font-medium text-primary">
          ${property.rent.toLocaleString()}/mo
        </div>
        {property.noFee && (
          <div className="absolute top-4 left-24 bg-accent text-white rounded-lg px-2 py-1 text-sm font-medium">
            No Fee
          </div>
        )}
        <button 
          className={`absolute top-4 right-4 w-8 h-8 ${
            isSaved ? 'bg-secondary' : 'bg-white'
          } rounded-full flex items-center justify-center shadow-sm hover:bg-secondary`}
          onClick={(e) => {
            e.stopPropagation();
            handleSaveToggle();
          }}
          disabled={saveMutation.isPending || unsaveMutation.isPending}
        >
          <span className={`material-icons ${isSaved ? 'text-primary' : 'text-text-medium'}`}>
            {isSaved ? 'favorite' : 'favorite_border'}
          </span>
        </button>
        
        {property.images && property.images.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button 
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-secondary"
              onClick={handlePreviousImage}
            >
              <span className="material-icons text-text-medium">navigate_before</span>
            </button>
            <button 
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-secondary"
              onClick={handleNextImage}
            >
              <span className="material-icons text-text-medium">navigate_next</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Property Info */}
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-heading font-medium text-lg text-text-dark">{property.title}</h3>
          {property.rating && (
            <div className="flex items-center">
              <span className="material-icons text-warning text-sm">star</span>
              <span className="text-text-medium text-sm ml-1">{property.rating}</span>
            </div>
          )}
        </div>
        
        <p className="text-text-medium text-sm mb-3">
          {property.address}, {property.neighborhood}, {property.city}
        </p>
        
        {/* Property Features */}
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-1">
            <span className="material-icons text-text-medium text-sm">king_bed</span>
            <span className="text-sm">
              {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed${property.bedrooms > 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-icons text-text-medium text-sm">bathtub</span>
            <span className="text-sm">{formatBathrooms(property.bathrooms)} bath{property.bathrooms !== 1 ? 's' : ''}</span>
          </div>
          {property.squareFeet && (
            <div className="flex items-center gap-1">
              <span className="material-icons text-text-medium text-sm">straighten</span>
              <span className="text-sm">{property.squareFeet.toLocaleString()} sqft</span>
            </div>
          )}
        </div>
        
        {/* Available Date or Features */}
        <div className="flex justify-between items-center">
          {property.availableDate && (
            <span className="text-sm text-text-medium">
              Available {new Date(property.availableDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          
          {property.hasVirtualTour && (
            <span className="text-sm text-success font-medium">Virtual Tour Available</span>
          )}
          
          {property.hasDoorman && (
            <span className="text-sm text-success font-medium">Doorman Building</span>
          )}
          
          <Link href={`/properties/${property.id}`}>
            <Button variant="link" className="text-primary font-medium text-sm p-0">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
