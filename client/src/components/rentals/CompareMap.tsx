import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/lib/google-maps-loader';
import { Property } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { calculateRoute, RouteInfo } from '@/lib/places-service';
import { Loader2 } from 'lucide-react';

// This is needed to ensure we have the Google Maps types
declare global {
  interface Window {
    google: typeof google;
  }
}

interface CompareMapProps {
  properties: Property[];
}

type POIType = 'gym' | 'grocery' | 'restaurant' | 'school' | 'cafe';

interface POITypeOption {
  value: POIType;
  label: string;
}

const poiTypeOptions: POITypeOption[] = [
  { value: 'gym', label: 'Gyms' },
  { value: 'grocery', label: 'Grocery Stores' },
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'school', label: 'Schools' },
  { value: 'cafe', label: 'Cafes' }
];

export function CompareMap({ properties }: CompareMapProps) {
  // Safety check - if fewer than 2 properties, don't render the map
  if (!properties || properties.length < 2) {
    return (
      <Card className="w-full mb-8">
        <CardHeader>
          <CardTitle>Compare Routes & Distances</CardTitle>
          <p className="text-muted-foreground">Please select at least 2 properties to enable comparison</p>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="mb-3">This tool requires at least 2 properties to compare routes and distances.</p>
        </CardContent>
      </Card>
    );
  }
  
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const routesRef = useRef<google.maps.Polyline[]>([]);
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([]);
  
  const [selectedPOIType, setSelectedPOIType] = useState<POIType>('gym');
  const [isLoadingMap, setIsLoadingMap] = useState<boolean>(true);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<{[propertyId: number]: any[]}>({});
  const [selectedRoutes, setSelectedRoutes] = useState<{[propertyId: number]: RouteInfo | undefined}>({});
  const [propertyColors, setPropertyColors] = useState<{[propertyId: number]: string}>({});
  
  // Generate colors for properties
  useEffect(() => {
    const colors: string[] = [
      '#4CAF50', // green
      '#2196F3', // blue
      '#F44336'  // red
    ];
    
    const colorMap: {[propertyId: number]: string} = {};
    properties.forEach((property, index) => {
      colorMap[property.id] = colors[index % colors.length];
    });
    
    setPropertyColors(colorMap);
  }, [properties]);
  
  // Close all InfoWindows
  const closeAllInfoWindows = () => {
    infoWindowsRef.current.forEach(infoWindow => infoWindow.close());
  };
  
  // Initialize Google Maps
  useEffect(() => {
    let isMounted = true;
    
    const initMap = async () => {
      try {
        console.log("Loading Google Maps...");
        // Load Google Maps API
        await loadGoogleMaps();
        
        if (!isMounted) return;
        
        console.log("Google Maps loaded successfully");
        
        if (!mapRef.current) {
          console.error("Map container ref is null");
          return;
        }
        
        console.log("Initializing map with properties:", properties);
        
        // Make sure google is defined before proceeding
        if (typeof window.google === 'undefined') {
          console.error("Google Maps API not loaded");
          return;
        }
        
        // Calculate center point among all properties
        const bounds = new window.google.maps.LatLngBounds();
        let hasValidCoords = false;
        
        properties.forEach(property => {
          if (property.latitude && property.longitude) {
            bounds.extend(new window.google.maps.LatLng(property.latitude, property.longitude));
            hasValidCoords = true;
          } else {
            console.warn(`Property missing coordinates: ${property.title}`);
          }
        });
        
        if (!hasValidCoords) {
          // Default to NYC if no properties have coordinates
          bounds.extend(new window.google.maps.LatLng(40.7128, -74.0060));
        }
        
        // Create the map
        const map = new window.google.maps.Map(mapRef.current, {
          center: bounds.getCenter(),
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        
        googleMapRef.current = map;
        
        // Add property markers
        properties.forEach(property => {
          if (!property.latitude || !property.longitude) return;
          
          const color = propertyColors[property.id] || '#4CAF50';
          
          const marker = new window.google.maps.Marker({
            position: { lat: property.latitude, lng: property.longitude },
            map,
            title: property.title || 'Property',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: color,
              fillOpacity: 1,
              strokeWeight: 0,
              scale: 8
            }
          });
          
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-bold">${property.title || 'Property'}</h3>
                <p>${property.address || 'No address'}</p>
                <p>$${property.rent || '0'}/month</p>
              </div>
            `
          });
          
          marker.addListener('click', () => {
            closeAllInfoWindows();
            infoWindow.open(map, marker);
            infoWindowsRef.current.push(infoWindow);
          });
          
          markersRef.current.push(marker);
        });
        
        // Fit map to bounds and add some padding
        if (hasValidCoords) {
          map.fitBounds(bounds);
          
          // Add some padding for better visibility
          const listener = window.google.maps.event.addListenerOnce(map, 'idle', () => {
            if (properties.length === 1) {
              map.setZoom(15); // Closer zoom for single property
            } else {
              // Keep the auto zoom from fitBounds
            }
          });
        }
        
        // Add event listener to close info windows when clicking on map
        map.addListener('click', closeAllInfoWindows);
        
        if (isMounted) {
          setIsLoadingMap(false);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        if (isMounted) {
          setIsLoadingMap(false);
        }
      }
    };
    
    // Only initialize if we have properties to show
    if (properties.length > 0) {
      initMap();
    } else {
      setIsLoadingMap(false);
    }
    
    return () => {
      isMounted = false;
      
      // Clean up on unmount
      markersRef.current.forEach(marker => marker.setMap(null));
      routesRef.current.forEach(route => route.setMap(null));
      infoWindowsRef.current.forEach(infoWindow => infoWindow.close());
      
      markersRef.current = [];
      routesRef.current = [];
      infoWindowsRef.current = [];
    };
  }, [properties, propertyColors]);
  
  // Clear place markers
  const clearPlaceMarkers = () => {
    markersRef.current = markersRef.current.filter(marker => {
      if (marker.get('isPlaceMarker')) {
        marker.setMap(null);
        return false;
      }
      return true;
    });
  };
  
  // Clear routes
  const clearRoutes = () => {
    // Clear polylines
    routesRef.current.forEach(route => route.setMap(null));
    routesRef.current = [];
  };

  // Fetch nearby places when POI type changes
  const fetchNearbyPlaces = async () => {
    if (!selectedPOIType || !googleMapRef.current) {
      console.warn("Cannot fetch places - map not initialized or POI type not selected");
      return;
    }
    
    setIsLoadingPlaces(true);
    
    try {
      // Clear existing markers and routes
      clearPlaceMarkers();
      clearRoutes();
      
      const newNearbyPlaces: {[propertyId: number]: any[]} = {};
      
      console.log(`Fetching nearby ${selectedPOIType} for ${properties.length} properties`);
      
      // Get nearby places for each property
      for (const property of properties) {
        if (!property.latitude || !property.longitude) {
          console.warn(`Skipping property ${property.id} - missing coordinates`);
          continue;
        }
        
        console.log(`Fetching for property ${property.id} at ${property.latitude},${property.longitude}`);
        
        const response = await fetch(
          `/api/nearby-places?lat=${property.latitude}&lng=${property.longitude}&type=${selectedPOIType}`, 
          { method: 'GET' }
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Found ${data.places?.length || 0} places near property ${property.id}`, data.places);
          
          if (data.places && data.places.length > 0) {
            newNearbyPlaces[property.id] = data.places;
            
            // Get the closest place (first in the array - they're already sorted by distance on the server)
            const place = data.places[0];
            
            // Create marker for the place
            const placeMarker = new window.google.maps.Marker({
              position: { lat: place.lat, lng: place.lng },
              map: googleMapRef.current,
              title: place.name,
              icon: {
                url: `http://maps.google.com/mapfiles/ms/icons/${selectedPOIType === 'gym' ? 'purple' : 'blue'}-dot.png`,
              }
            });
            
            // Mark this marker as a place marker so we can clear it later
            placeMarker.set('isPlaceMarker', true);
            
            // Add info window for the place
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div class="p-2">
                  <h3 class="font-bold">${place.name}</h3>
                  <p>${place.address || ''}</p>
                  <p>Distance: ${place.distance || 'N/A'}</p>
                  ${place.rating ? `<p>Rating: ${place.rating} ⭐</p>` : ''}
                </div>
              `
            });
            
            placeMarker.addListener('click', () => {
              closeAllInfoWindows();
              infoWindow.open(googleMapRef.current, placeMarker);
              infoWindowsRef.current.push(infoWindow);
            });
            
            markersRef.current.push(placeMarker);
            
            // Draw route from property to place
            console.log(`Drawing route from property ${property.id} to ${place.name}`);
            try {
              const route = await calculateRoute(
                { lat: property.latitude, lng: property.longitude },
                { lat: place.lat, lng: place.lng }
              );
              
              if (route && route.route && route.route.length > 0) {
                console.log(`Route calculated successfully:`, route);
                
                // Draw route on map
                const routePath = new window.google.maps.Polyline({
                  path: route.route,
                  geodesic: true,
                  strokeColor: propertyColors[property.id] || '#4CAF50',
                  strokeOpacity: 0.7,
                  strokeWeight: 5
                });
                
                routePath.setMap(googleMapRef.current);
                routesRef.current.push(routePath);
                
                // Add a label with time in the middle of the route
                const midpointIndex = Math.floor(route.route.length / 2);
                const midpoint = route.route[midpointIndex];
                
                const timeInfoWindow = new window.google.maps.InfoWindow({
                  content: `
                    <div class="p-1 text-center">
                      <p class="font-bold">🚶 ${route.duration}</p>
                    </div>
                  `,
                  position: midpoint,
                  pixelOffset: new window.google.maps.Size(0, -15)
                });
                
                timeInfoWindow.open(googleMapRef.current);
                infoWindowsRef.current.push(timeInfoWindow);
                
                // Store route info for display in the results panel
                setSelectedRoutes(prev => ({
                  ...prev,
                  [property.id]: route
                }));
              } else {
                console.warn(`No route found for property ${property.id} to ${place.name}`);
              }
            } catch (routeError) {
              console.error('Error calculating route:', routeError);
            }
          } else {
            console.warn(`No ${selectedPOIType} found near property ${property.id}`);
          }
        } else {
          console.error(`API error for property ${property.id}:`, await response.text());
        }
      }
      
      setNearbyPlaces(newNearbyPlaces);
    } catch (error) {
      console.error('Error fetching nearby places:', error);
    } finally {
      setIsLoadingPlaces(false);
    }
  };
  
  return (
    <Card className="w-full mb-8">
      <CardHeader>
        <CardTitle>Compare Routes & Distances</CardTitle>
        <p className="text-muted-foreground">Find nearby places and analyze travel times for your saved properties</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div 
              ref={mapRef} 
              className="w-full h-[500px] rounded-md bg-muted/50 relative"
            >
              {isLoadingMap && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                    <span>Loading map...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-muted/30 p-4 rounded-lg space-y-4">
              <h3 className="font-medium">Find Nearby Places</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium mb-1 block">Place Type</label>
                <Select 
                  value={selectedPOIType} 
                  onValueChange={(value) => setSelectedPOIType(value as POIType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {poiTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={fetchNearbyPlaces} 
                  className="w-full mt-2"
                  disabled={isLoadingPlaces}
                >
                  {isLoadingPlaces ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Finding places...
                    </>
                  ) : (
                    `Find Nearest ${selectedPOIType.charAt(0).toUpperCase() + selectedPOIType.slice(1)}`
                  )}
                </Button>
              </div>
            </div>
            
            {/* Distance results */}
            <div className="space-y-4">
              <h3 className="font-medium">Distance Results</h3>
              
              {properties.length === 0 ? (
                <div className="text-center p-4 border rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground">No properties selected for comparison</p>
                </div>
              ) : (
                properties.map(property => (
                  <div key={property.id} className="p-4 border rounded-lg bg-background shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: propertyColors[property.id] }}
                      ></div>
                      <span className="font-medium truncate">{property.title}</span>
                    </div>
                    
                    {selectedRoutes[property.id] ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Distance:</span>
                          <span className="font-medium">{selectedRoutes[property.id]?.distance}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Travel Time:</span>
                          <span className="font-medium">{selectedRoutes[property.id]?.duration}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Destination:</span>
                          <span className="font-medium truncate max-w-[150px]">
                            {nearbyPlaces[property.id]?.[0]?.name || 'N/A'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <Badge variant="outline" className="text-xs">
                          Click "Find Nearest" to show results
                        </Badge>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}