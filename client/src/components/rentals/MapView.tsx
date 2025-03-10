import { useState, useEffect, useRef } from "react";
import { Property } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || mapInitialized) return;
    
    const initMap = async () => {
      try {
        setIsLoading(true);
        // Load Google Maps API
        const mapsApi = await loadGoogleMaps();
        
        // Create a map centered on NYC
        const mapOptions = {
          center: { lat: 40.7128, lng: -74.0060 }, // NYC coordinates
          zoom: mapZoom,
          mapTypeControl: true,
          fullscreenControl: false,
          streetViewControl: true,
          zoomControl: false, // We'll add custom zoom controls
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        };
        
        // Check that mapRef.current is not null before initializing
        if (!mapRef.current) {
          throw new Error("Map container element not found");
        }
        const newMap = new mapsApi.Map(mapRef.current, mapOptions);
        setMap(newMap);
        
        // Create an info window for property details
        const newInfoWindow = new mapsApi.InfoWindow();
        setInfoWindow(newInfoWindow);
        
        setMapInitialized(true);
        setIsLoading(false);
        
        // Add event listener to close info window when map is clicked
        newMap.addListener("click", () => {
          newInfoWindow.close();
          onSelectProperty(null);
        });
        
      } catch (error) {
        console.error("Error initializing Google Maps:", error);
        setLoadError("Failed to load Google Maps. Please try again later.");
        setIsLoading(false);
      }
    };
    
    initMap();
    
    // Cleanup function
    return () => {
      if (markers.length > 0) {
        markers.forEach(marker => marker.setMap(null));
      }
    };
  }, [mapRef, mapInitialized, mapZoom]);
  
  // Add property markers when properties or map changes
  useEffect(() => {
    if (!map || !mapInitialized || !infoWindow || isLoading) return;
    
    // Remove existing markers
    markers.forEach(marker => marker.setMap(null));
    
    const newMarkers: google.maps.Marker[] = [];
    
    // If AI filtering is active, only show filtered properties
    const displayProperties = aiFilterActive && aiFilteredPropertyIds 
      ? properties.filter(p => aiFilteredPropertyIds.includes(p.id))
      : properties;
    
    // Add markers for each property
    displayProperties.forEach(property => {
      if (!property.latitude || !property.longitude) return;
      
      const isHighlighted = selectedProperty?.id === property.id;
      const hasScore = relevanceScores && relevanceScores[property.id];
      const score = hasScore ? relevanceScores[property.id] : 0;
      
      // Determine marker style based on selected state and AI filtering
      const markerOptions: google.maps.MarkerOptions = {
        position: { lat: property.latitude, lng: property.longitude },
        map: map,
        title: property.title,
        animation: isHighlighted ? google.maps.Animation.BOUNCE : undefined,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: hasScore ? '#1E88E5' : (isHighlighted ? '#4CAF50' : '#FF5722'),
          fillOpacity: hasScore ? Math.min(0.9, 0.5 + (score / 100) * 0.4) : 0.8,
          strokeWeight: isHighlighted ? 2 : 1,
          strokeColor: '#FFFFFF',
          scale: isHighlighted ? 14 : 10
        },
        zIndex: isHighlighted ? 1000 : (hasScore ? 100 : 1)
      };
      
      const marker = new google.maps.Marker(markerOptions);
      
      // Add click event
      marker.addListener("click", () => {
        // Create content for the info window
        const contentString = `
          <div class="p-3">
            <h3 class="text-lg font-bold">${property.title}</h3>
            <p class="text-sm mb-2">${property.address}, ${property.neighborhood}</p>
            <div class="flex justify-between items-center">
              <p class="text-lg font-bold">$${property.rent.toLocaleString()}/mo</p>
              <div>${property.bedrooms} bed | ${property.bathrooms} bath</div>
            </div>
          </div>
        `;
        
        infoWindow.setContent(contentString);
        infoWindow.open(map, marker);
        
        // Update selected property
        onSelectProperty(property);
      });
      
      newMarkers.push(marker);
    });
    
    setMarkers(newMarkers);
    
    // Center map and adjust bounds
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      
      // If a property is selected, center on it
      if (selectedProperty?.latitude && selectedProperty?.longitude) {
        bounds.extend({ lat: selectedProperty.latitude, lng: selectedProperty.longitude });
        map.setCenter({ lat: selectedProperty.latitude, lng: selectedProperty.longitude });
        map.setZoom(15); // Zoom in closer on selected property
      } 
      // Otherwise fit all markers
      else {
        newMarkers.forEach(marker => {
          if (marker.getPosition()) {
            bounds.extend(marker.getPosition()!);
          }
        });
        
        map.fitBounds(bounds);
        
        // Don't zoom in too far for small datasets
        const zoomListener = google.maps.event.addListener(map, "idle", () => {
          if (map.getZoom()! > 16) map.setZoom(16);
          google.maps.event.removeListener(zoomListener);
        });
      }
    }
    
    // Add highlighted areas if any
    if (highlightedAreas && aiFilterActive) {
      highlightedAreas.forEach(area => {
        new google.maps.Circle({
          strokeColor: "#4CAF50",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#4CAF50",
          fillOpacity: 0.1 + area.score * 0.2, // Opacity based on score
          map: map,
          center: area.center,
          radius: area.radius
        });
      });
    }
    
  // Remove markers from dependencies array to prevent infinite loop
  }, [map, properties, selectedProperty, infoWindow, aiFilterActive, aiFilteredPropertyIds, highlightedAreas, mapInitialized, isLoading]);
  
  // Update zoom when map zoom controls are used
  useEffect(() => {
    if (map && !isLoading) {
      map.setZoom(mapZoom);
    }
  }, [mapZoom, map, isLoading]);
  
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
        className="h-[60vh] min-h-[400px] bg-gray-100 rounded-xl shadow-sm mb-6 relative overflow-hidden"
      >
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
              <p>Loading Map...</p>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {loadError && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-20">
            <div className="text-center p-8 max-w-md">
              <span className="material-icons text-destructive text-5xl mb-4">error_outline</span>
              <h3 className="text-xl font-medium mb-2">Map Error</h3>
              <p className="mb-4">{loadError}</p>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </div>
        )}
        
        {/* Google Maps will be rendered in this div */}
        <div 
          ref={mapRef}
          className="w-full h-full"
        />
        
        {/* Map controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
          <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full w-10 h-10 bg-white shadow-md hover:bg-gray-100"
            onClick={handleZoomIn}
          >
            <span className="material-icons">add</span>
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full w-10 h-10 bg-white shadow-md hover:bg-gray-100"
            onClick={handleZoomOut}
          >
            <span className="material-icons">remove</span>
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full w-10 h-10 bg-white shadow-md hover:bg-gray-100"
            onClick={() => {
              if (navigator.geolocation && map) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const pos = {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                    };
                    map.setCenter(pos);
                    map.setZoom(14);
                  },
                  () => {
                    alert("Error: The Geolocation service failed.");
                  }
                );
              } else {
                alert("Error: Your browser doesn't support geolocation.");
              }
            }}
          >
            <span className="material-icons">my_location</span>
          </Button>
        </div>
        
        {/* AI Assistant trigger */}
        <div className="absolute top-4 left-4 z-10">
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
