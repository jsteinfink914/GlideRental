import { Property } from "@shared/schema";
import { PropertyCard } from "./PropertyCard";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface PropertyGridProps {
  properties?: Property[];
  savedProperties?: { savedId: number; property: Property }[];
  isLoading?: boolean;
  onSelectProperty?: (property: Property) => void;
}

export default function PropertyGrid({ 
  properties, 
  savedProperties, 
  isLoading = false,
  onSelectProperty 
}: PropertyGridProps) {
  
  // Get saved property IDs for quick lookup
  const savedPropertyMap = new Map();
  savedProperties?.forEach(item => {
    savedPropertyMap.set(item.property.id, item.savedId);
  });
  
  // If properties are provided directly, use those
  // Otherwise, this component will fetch them
  const { data: fetchedProperties, isLoading: isLoadingProperties, error } = useQuery({
    queryKey: ['/api/properties'],
    enabled: !properties && !isLoading,
  });
  
  // Debug logging
  console.log("PropertyGrid render:", {
    receivedProps: !!properties,
    propertiesLength: properties?.length || 0,
    fetchedPropertiesLength: Array.isArray(fetchedProperties) ? fetchedProperties.length : 0,
    isDirectLoading: isLoading,
    isQueryLoading: isLoadingProperties,
    error: error?.message
  });
  
  const displayedProperties = properties || (fetchedProperties as Property[]) || [];
  const showLoading = isLoading || isLoadingProperties;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {showLoading ? (
        // Loading skeletons
        Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <Skeleton className="h-60 w-full" />
            <div className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-3" />
              <div className="flex gap-4 mb-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        ))
      ) : displayedProperties.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <span className="material-icons text-5xl text-muted-foreground mb-4">search_off</span>
          <h3 className="text-lg font-medium mb-2">No properties found</h3>
          <p className="text-muted-foreground">Try adjusting your search filters.</p>
        </div>
      ) : (
        // Actual property cards
        displayedProperties.map((property) => {
          const isSaved = savedPropertyMap.has(property.id);
          const savedId = savedPropertyMap.get(property.id);
          
          return (
            <PropertyCard 
              key={property.id} 
              property={property}
              isSaved={isSaved}
              savedId={savedId}
              onSelect={onSelectProperty}
            />
          );
        })
      )}
    </div>
  );
}
