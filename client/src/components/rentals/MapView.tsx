import { useState, useEffect, useRef } from "react";
import { Property } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

interface MapViewProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property | null) => void;
  aiFilteredPropertyIds?: number[];
  relevanceScores?: { [propertyId: number]: number };
  highlightedAreas?: { 
    center: { lat: number; lng: number };
    radius: number;
    score: number;
  }[];
}

export default function MapView({ 
  properties, 
  selectedProperty, 
  onSelectProperty,
  aiFilteredPropertyIds,
  relevanceScores,
  highlightedAreas
}: MapViewProps) {
  const [mapZoom, setMapZoom] = useState(12);
  const [aiFilterActive, setAiFilterActive] = useState(!!aiFilteredPropertyIds);
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Function to generate mock property markers for visualization
  // In a real implementation, this would work with actual map markers
  const getPropertyMarkers = () => {
    // If AI filtering is active, only show filtered properties
    const displayProperties = aiFilterActive && aiFilteredPropertyIds 
      ? properties.filter(p => aiFilteredPropertyIds.includes(p.id))
      : properties;
      
    return displayProperties.map(property => {
      // Check if this property has a relevance score
      const hasScore = relevanceScores && relevanceScores[property.id];
      const score = hasScore ? relevanceScores[property.id] : 0;
      const isHighlighted = selectedProperty?.id === property.id;
      
      // Calculate marker size and color intensity based on relevance score
      const markerSize = hasScore ? Math.max(30, Math.min(50, 30 + (score / 10))) : 30;
      const colorIntensity = hasScore ? Math.max(0.5, Math.min(1, score / 100)) : 0.7;
      
      return (
        <div 
          key={property.id}
          className={`absolute rounded-full cursor-pointer transition-all duration-300 
                     flex items-center justify-center
                     ${isHighlighted ? 'z-10 ring-4 ring-primary' : 'hover:z-10'}`}
          style={{
            width: `${markerSize}px`,
            height: `${markerSize}px`,
            backgroundColor: `rgba(var(--primary-rgb), ${colorIntensity})`,
            // Random position for demonstration
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          onClick={() => onSelectProperty(property)}
        >
          <span className="text-white text-xs font-bold">
            ${Math.round(property.rent / 100)}
          </span>
        </div>
      );
    });
  };
  
  // Function to render highlighted areas (for AI neighborhoods)
  const renderHighlightedAreas = () => {
    if (!highlightedAreas || !aiFilterActive) return null;
    
    return highlightedAreas.map((area, index) => {
      // Calculate color based on score
      const opacity = Math.max(0.1, Math.min(0.4, area.score / 100));
      
      return (
        <div 
          key={index}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${area.radius * 5}px`,
            height: `${area.radius * 5}px`,
            backgroundColor: `rgba(var(--primary-rgb), ${opacity})`,
            border: '2px dashed rgba(var(--primary-rgb), 0.8)',
            // Random position for demonstration
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      );
    });
  };
  
  // Update the AI filter state when props change
  useEffect(() => {
    if (aiFilteredPropertyIds) {
      setAiFilterActive(true);
    }
  }, [aiFilteredPropertyIds]);
  
  // Zoom controls
  const handleZoomIn = () => setMapZoom(prev => Math.min(prev + 1, 18));
  const handleZoomOut = () => setMapZoom(prev => Math.max(prev - 1, 5));
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Map Controls Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          {aiFilteredPropertyIds && (
            <Badge variant="outline" className="bg-primary/10">
              <span className="material-icons text-primary text-sm mr-1">auto_awesome</span>
              AI Filtered
              <button 
                className="ml-2 text-xs"
                onClick={() => setAiFilterActive(!aiFilterActive)}
              >
                {aiFilterActive ? 'Disable' : 'Enable'}
              </button>
            </Badge>
          )}
          {aiFilteredPropertyIds && (
            <Badge variant="outline">
              {aiFilteredPropertyIds.length} properties match
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <span className="material-icons text-sm mr-1">share</span>
            Share Map
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <span className="material-icons text-sm mr-1">draw</span>
            Draw
          </Button>
        </div>
      </div>
      
      {/* Map Container */}
      <div 
        ref={mapRef}
        className="h-[50vh] min-h-[300px] bg-gray-100 rounded-xl shadow-sm mb-6 relative overflow-hidden"
        style={{ transition: 'all 0.3s ease' }}
      >
        {/* Placeholder for map */}
        <div className="absolute inset-0 bg-secondary flex items-center justify-center">
          {/* Static map backdrop */}
          <div className="absolute inset-0 bg-[#f8f8f8]">
            <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-73.98,40.73,12,0/1200x600?access_token=pk.placeholder')]"></div>
            
            {/* Grid lines to simulate a map */}
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-4">
              {Array.from({ length: 32 }).map((_, i) => (
                <div key={i} className="border border-gray-200 opacity-30"></div>
              ))}
            </div>
          </div>
          
          {/* Render highlighted neighborhoods/areas */}
          {renderHighlightedAreas()}
          
          {/* Render property markers */}
          {getPropertyMarkers()}
          
          {/* Map center */}
          {!properties.length && (
            <div className="text-center z-10">
              <span className="material-icons text-5xl text-primary mb-4">map</span>
              <p className="text-text-medium">
                Map would display real properties with a mapping API
              </p>
            </div>
          )}
        </div>
        
        {/* Map controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full w-10 h-10"
            onClick={handleZoomIn}
          >
            <span className="material-icons">add</span>
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full w-10 h-10"
            onClick={handleZoomOut}
          >
            <span className="material-icons">remove</span>
          </Button>
          <Button size="icon" variant="secondary" className="rounded-full w-10 h-10">
            <span className="material-icons">my_location</span>
          </Button>
        </div>
        
        {/* AI Assistant trigger */}
        <div className="absolute top-4 left-4">
          <Button 
            className="rounded-full bg-white text-primary hover:bg-white/90 shadow-md"
            onClick={() => {}}
          >
            <span className="material-icons mr-2">auto_awesome</span>
            Ask AI Assistant
          </Button>
        </div>
      </div>
      
      {/* Property List Summary when AI filtered */}
      {aiFilterActive && aiFilteredPropertyIds && aiFilteredPropertyIds.length > 0 && (
        <div className="mb-4 bg-secondary p-4 rounded-lg">
          <h3 className="font-medium text-lg mb-2 flex items-center">
            <span className="material-icons text-primary mr-2">auto_awesome</span>
            AI Selected Properties
          </h3>
          <p className="text-sm text-text-medium mb-3">
            These properties best match your preferences based on AI analysis.
          </p>
          <div className="flex flex-wrap gap-2">
            {properties
              .filter(p => aiFilteredPropertyIds.includes(p.id))
              .slice(0, 5)
              .map(property => (
                <Badge 
                  key={property.id} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => onSelectProperty(property)}
                >
                  {property.title} - ${property.rent.toLocaleString()}/mo
                </Badge>
              ))}
            {aiFilteredPropertyIds.length > 5 && (
              <Badge variant="outline">
                +{aiFilteredPropertyIds.length - 5} more
              </Badge>
            )}
          </div>
        </div>
      )}
      
      {/* Selected Property Preview */}
      {selectedProperty ? (
        <Card className="bg-white rounded-xl shadow-sm p-4">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/3">
                <div className="relative">
                  <img 
                    src={selectedProperty.images?.[0] || "https://via.placeholder.com/500x300?text=No+Image"}
                    alt={selectedProperty.title} 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {relevanceScores && relevanceScores[selectedProperty.id] && (
                    <div className="absolute top-2 right-2 bg-primary text-white rounded-full px-2 py-1 text-xs flex items-center">
                      <span className="material-icons text-xs mr-1">auto_awesome</span>
                      {Math.round(relevanceScores[selectedProperty.id])}% Match
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full md:w-2/3">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-heading font-medium text-xl text-text-dark">
                    {selectedProperty.title}
                  </h3>
                  <span className="text-primary font-medium">
                    ${selectedProperty.rent.toLocaleString()}/mo
                  </span>
                </div>
                <p className="text-text-medium text-sm mb-3">
                  {selectedProperty.address}, {selectedProperty.neighborhood}, {selectedProperty.city}
                </p>
                <div className="flex gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <span className="material-icons text-text-medium text-sm">king_bed</span>
                    <span>{selectedProperty.bedrooms === 0 ? 'Studio' : `${selectedProperty.bedrooms} bed${selectedProperty.bedrooms > 1 ? 's' : ''}`}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-icons text-text-medium text-sm">bathtub</span>
                    <span>{selectedProperty.bathrooms} bath{selectedProperty.bathrooms !== 1 ? 's' : ''}</span>
                  </div>
                  {selectedProperty.squareFeet && (
                    <div className="flex items-center gap-1">
                      <span className="material-icons text-text-medium text-sm">straighten</span>
                      <span>{selectedProperty.squareFeet.toLocaleString()} sqft</span>
                    </div>
                  )}
                </div>
                
                {/* Property features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedProperty.petFriendly && (
                    <Badge variant="outline" className="bg-secondary/50">
                      <span className="material-icons text-xs mr-1">pets</span>
                      Pet Friendly
                    </Badge>
                  )}
                  {selectedProperty.hasInUnitLaundry && (
                    <Badge variant="outline" className="bg-secondary/50">
                      <span className="material-icons text-xs mr-1">local_laundry_service</span>
                      In-unit Laundry
                    </Badge>
                  )}
                  {selectedProperty.hasDishwasher && (
                    <Badge variant="outline" className="bg-secondary/50">
                      <span className="material-icons text-xs mr-1">countertops</span>
                      Dishwasher
                    </Badge>
                  )}
                  {selectedProperty.hasDoorman && (
                    <Badge variant="outline" className="bg-secondary/50">
                      <span className="material-icons text-xs mr-1">security</span>
                      Doorman
                    </Badge>
                  )}
                </div>
                
                <p className="text-text-medium mb-4">{selectedProperty.description}</p>
                <div className="flex gap-2">
                  <Button>
                    Contact Agent
                  </Button>
                  <Button variant="secondary">
                    Schedule Tour
                  </Button>
                  <Link href={`/properties/${selectedProperty.id}`} className="ml-auto">
                    <Button variant="outline">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-text-medium">Select a property on the map to view details</p>
        </Card>
      )}
    </div>
  );
}
