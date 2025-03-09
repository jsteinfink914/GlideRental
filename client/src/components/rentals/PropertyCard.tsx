import { Property } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, BedDouble, Bath, Calendar } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import QuickApply from "./QuickApply";

interface PropertyCardProps {
  property: Property;
  isSaved?: boolean;
  savedId?: number;
  onSelect?: (property: Property) => void;
}

export function PropertyCard({ property, isSaved = false, savedId, onSelect }: PropertyCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/saved-properties", {
        propertyId: property.id
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-properties"] });
      toast({
        title: "Property saved",
        description: "This property has been added to your saved list."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const unsaveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/saved-properties/${savedId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-properties"] });
      toast({
        title: "Property removed",
        description: "This property has been removed from your saved list."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSaveClick = () => {
    if (isSaved) {
      unsaveMutation.mutate();
    } else {
      saveMutation.mutate();
    }
  };

  return (
    <Card onClick={() => onSelect?.(property)} className="relative w-full cursor-pointer transition-colors hover:bg-secondary/10">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-2">{property.title}</CardTitle>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleSaveClick();
            }}
            variant="ghost"
            size="icon"
            disabled={saveMutation.isPending || unsaveMutation.isPending}
          >
            <Heart
              className={`h-5 w-5 ${isSaved ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{property.neighborhood}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <BedDouble className="h-3 w-3" />
            {property.bedrooms} {property.bedrooms === 1 ? "bed" : "beds"}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Bath className="h-3 w-3" />
            {property.bathrooms} {property.bathrooms === 1 ? "bath" : "baths"}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Available {new Date(property.availableDate).toLocaleDateString()}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1">
          {property.hasInUnitLaundry && <Badge>In-unit laundry</Badge>}
          {property.hasDishwasher && <Badge>Dishwasher</Badge>}
          {property.petFriendly && <Badge>Pet friendly</Badge>}
          {property.hasDoorman && <Badge>Doorman</Badge>}
          {property.hasVirtualTour && <Badge>Virtual tour</Badge>}
          {property.noFee && <Badge>No fee</Badge>}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <p className="text-lg font-bold">${property.rent.toLocaleString()}/month</p>
        <div 
          onClick={(e) => e.stopPropagation()}
          className="w-1/2"
        >
          <QuickApply 
            property={property}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
              toast({
                title: "Application Submitted",
                description: "Your application has been successfully submitted."
              });
            }}
          />
        </div>
      </CardFooter>
    </Card>
  );
}