import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, X, MapPin, Home } from "lucide-react";

interface UserPreferences {
  gym: string;
  grocery: string;
  poiTypes: string[];
}

interface POI {
  name: string;
  lat: number;
  lng: number;
  distance: string;
  rating?: number;
}

interface PropertyWithPOIs extends Property {
  lat?: number;
  lon?: number;
  nearestGym?: POI;
  nearestGrocery?: POI;
  nearestPOIs?: Record<string, POI>;
  sqft?: number;
}

// Map related state
interface MapState {
  map: google.maps.Map | null;
  markers: google.maps.Marker[];
  listingMarkers: Map<string, { 
    listingMarker: google.maps.Marker, 
    color: string 
  }>;
  openInfoWindows: google.maps.InfoWindow[];
  routeInfoWindows: google.maps.InfoWindow[];
  directionsService: google.maps.DirectionsService | null;
  directionsRenderers: google.maps.DirectionsRenderer[];
  cachedRoutes: Map<string, google.maps.DirectionsResult>;
}

export default function ComparePage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [showMap, setShowMap] = useState(true);
  const [compareProperties, setCompareProperties] = useState<PropertyWithPOIs[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState({
    price: true,
    sqft: true,
    beds: true,
    baths: true
  });
  const [showMode, setShowMode] = useState<"onClick" | "showAll">("onClick");
  
  // Map related state
  const [mapState, setMapState] = useState<MapState>({
    map: null,
    markers: [],
    listingMarkers: new Map(),
    openInfoWindows: [],
    routeInfoWindows: [],
    directionsService: null,
    directionsRenderers: [],
    cachedRoutes: new Map()
  });

  // Colors for markers
  const colors = ["red", "blue", "green", "purple", "orange", "pink", "yellow", "cyan"];
  
  // Get saved properties
  const { data: savedProperties, isLoading } = useQuery<{savedId: number; property: Property}[]>({
    queryKey: ["/api/saved-properties"],
    retry: false,
  });

  // Get user preferences
  const { data: userPreferences } = useQuery<UserPreferences>({
    queryKey: ["/api/user/preferences"],
    retry: false,
  });

  // Close all info windows
  const closeAllInfoWindows = () => {
    mapState.openInfoWindows.forEach(infoWindow => infoWindow.close());
    setMapState(prev => ({...prev, openInfoWindows: []}));
  };

  // Close all route info windows
  const closeAllRouteInfoWindows = () => {
    mapState.routeInfoWindows.forEach(infoWindow => infoWindow.close());
    setMapState(prev => ({...prev, routeInfoWindows: []}));
  };

  // Clear routes
  const clearRoutes = () => {
    mapState.directionsRenderers.forEach(renderer => renderer.setMap(null));
    setMapState(prev => ({...prev, directionsRenderers: []}));
  };

  // Clear gym and grocery markers
  const clearGymAndGroceryMarkers = () => {
    const updatedMarkers = mapState.markers.filter(marker => {
      if ((marker as any).isGym || (marker as any).isGrocery) {
        marker.setMap(null);
        return false;
      }
      return true;
    });
    
    setMapState(prev => ({...prev, markers: updatedMarkers}));
  };

  // Toggle show mode between onClick and showAll
  const toggleShowMode = () => {
    setShowMode(prev => prev === "onClick" ? "showAll" : "onClick");
    clearGymAndGroceryMarkers();
    clearRoutes();
    initializeMap(compareProperties, true);
  };

  // Get route midpoint
  const getRouteMidPoint = (route: google.maps.DirectionsRoute) => {
    const leg = route.legs[0];
    if (!leg || !leg.steps || leg.steps.length === 0) {
      return leg.end_location;
    }
    
    let totalDistance = 0;
    let coveredDistance = 0;
    
    leg.steps.forEach(step => totalDistance += step.distance?.value || 0);
    
    for (const step of leg.steps) {
      coveredDistance += step.distance?.value || 0;
      if (coveredDistance >= totalDistance / 2) {
        return step.end_location;
      }
    }
    
    return leg.steps[Math.floor(leg.steps.length / 2)].end_location;
  };

  // Draw route between two points
  const drawRoute = (property: PropertyWithPOIs, destination: POI) => {
    if (!mapState.map || !mapState.directionsService) return;
    
    const routeKey = `${property.lat},${property.lon}-${destination.lat},${destination.lng}`;
    
    if (mapState.cachedRoutes.has(routeKey)) {
      displayCachedRoute(mapState.cachedRoutes.get(routeKey)!);
      return;
    }
    
    const request = {
      origin: { lat: property.lat || 0, lng: property.lon || 0 },
      destination: { lat: destination.lat, lng: destination.lng },
      travelMode: google.maps.TravelMode.WALKING,
    };
    
    mapState.directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        setMapState(prev => {
          const updatedCache = new Map(prev.cachedRoutes);
          updatedCache.set(routeKey, result);
          return {...prev, cachedRoutes: updatedCache};
        });
        displayCachedRoute(result);
      } else {
        console.warn("⚠️ Directions API request failed:", status);
      }
    });
  };

  // Display cached route on map
  const displayCachedRoute = (result: google.maps.DirectionsResult) => {
    if (!mapState.map) return;
    
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map: mapState.map,
      directions: result,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#007bff",
        strokeOpacity: 0.9,
        strokeWeight: 7,
      },
    });
    
    setMapState(prev => ({
      ...prev, 
      directionsRenderers: [...prev.directionsRenderers, directionsRenderer]
    }));
    
    const route = result.routes[0].legs[0];
    const travelTime = route.duration?.text || "Unknown";
    const midPoint = getRouteMidPoint(result.routes[0]);
    
    const infoWindow = new google.maps.InfoWindow({
      content: `<strong>🚶 ${travelTime}</strong>`,
      position: midPoint,
    });
    
    infoWindow.open(mapState.map);
    
    setMapState(prev => ({
      ...prev,
      routeInfoWindows: [...prev.routeInfoWindows, infoWindow]
    }));
  };

  // Add gym and grocery markers
  const addGymAndGroceryMarkers = (property: PropertyWithPOIs, color: string, drawRoutesParam: boolean) => {
    if (!mapState.map) return;
    
    // Clear existing routes
    clearRoutes();
    
    // Initialize directions service if needed
    if (!mapState.directionsService) {
      setMapState(prev => ({
        ...prev,
        directionsService: new google.maps.DirectionsService()
      }));
    }
    
    const gymIcon = {
      url: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
      scaledSize: new google.maps.Size(30, 30) as google.maps.Size,
    };
    
    const groceryIcon = {
      url: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
      scaledSize: new google.maps.Size(30, 30) as google.maps.Size,
    };
    
    // Add gym marker
    if (property.nearestGym?.lat && property.nearestGym?.lng) {
      const gymMarker = new google.maps.Marker({
        position: { lat: property.nearestGym.lat, lng: property.nearestGym.lng },
        map: mapState.map,
        icon: gymIcon,
        title: `Gym: ${property.nearestGym.name}`,
      });
      
      // Add custom property to identify marker type
      (gymMarker as any).isGym = true;
      
      const gymInfoWindow = new google.maps.InfoWindow({
        content: `<strong>🏋️ Gym: ${property.nearestGym.name}</strong><br>📍 Distance: ${property.nearestGym.distance}`,
      });
      
      gymMarker.addListener("click", () => {
        gymInfoWindow.open(mapState.map!, gymMarker);
      });
      
      setMapState(prev => ({
        ...prev,
        markers: [...prev.markers, gymMarker]
      }));
      
      if (drawRoutesParam) {
        drawRoute(property, property.nearestGym);
      }
    }
    
    // Add grocery marker
    if (property.nearestGrocery?.lat && property.nearestGrocery?.lng) {
      const groceryMarker = new google.maps.Marker({
        position: { lat: property.nearestGrocery.lat, lng: property.nearestGrocery.lng },
        map: mapState.map,
        icon: groceryIcon,
        title: `Grocery: ${property.nearestGrocery.name}`,
      });
      
      // Add custom property to identify marker type
      (groceryMarker as any).isGrocery = true;
      
      const groceryInfoWindow = new google.maps.InfoWindow({
        content: `<strong>🛒 Grocery: ${property.nearestGrocery.name}</strong><br>📍 Distance: ${property.nearestGrocery.distance}`,
      });
      
      groceryMarker.addListener("click", () => {
        groceryInfoWindow.open(mapState.map!, groceryMarker);
      });
      
      setMapState(prev => ({
        ...prev,
        markers: [...prev.markers, groceryMarker]
      }));
      
      if (drawRoutesParam) {
        drawRoute(property, property.nearestGrocery);
      }
    }
  };

  // Initialize Google Maps
  const loadGoogleMapsScript = (callback: () => void) => {
    if (window.google && window.google.maps) {
      callback();
      return;
    }
    
    apiRequest("GET", "/api/maps-key")
      .then(response => response.json())
      .then(({ key }) => {
        if (!key) throw new Error("Missing API key from backend.");
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = callback;
        document.head.appendChild(script);
      })
      .catch(error => {
        console.error("Failed to load Google Maps:", error);
      });
  };

  // Initialize map with properties
  const initializeMap = (properties: PropertyWithPOIs[], isComparePage = true) => {
    if (!mapRef.current || properties.length === 0) return;
    
    const mapContainer = mapRef.current;
    const mode = showMode;
    
    // Create new map instance
    const newMap = new google.maps.Map(mapContainer, {
      center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
      zoom: 12,
    });
    
    // Close all info windows when clicking on the map
    newMap.addListener("click", () => {
      closeAllInfoWindows();
      closeAllRouteInfoWindows();
    });
    
    // Clear existing markers
    mapState.markers.forEach(marker => marker.setMap(null));
    
    // Create new state object
    const newMapState: MapState = {
      map: newMap,
      markers: [],
      listingMarkers: new Map(),
      openInfoWindows: [],
      routeInfoWindows: [],
      directionsService: new google.maps.DirectionsService(),
      directionsRenderers: [],
      cachedRoutes: new Map()
    };
    
    // Add property markers
    properties.forEach((property, index) => {
      if (property.lat && property.lon) {
        const color = isComparePage ? colors[index % colors.length] : "blue";
        
        const listingMarker = new google.maps.Marker({
          position: { lat: property.lat, lng: property.lon },
          map: newMap,
          title: property.address,
          icon: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
        });
        
        const infoWindow = new google.maps.InfoWindow({
          content: `<strong>${property.address}</strong>`,
        });
        
        listingMarker.addListener("click", () => {
          closeAllInfoWindows();
          closeAllRouteInfoWindows();
          infoWindow.open(newMap, listingMarker);
          newMapState.openInfoWindows.push(infoWindow);
          
          // Only show gym/grocery on click if mode is "onClick"
          if (mode === "onClick") {
            clearGymAndGroceryMarkers();
            clearRoutes();
            addGymAndGroceryMarkers(property, color, true);
          } else {
            clearRoutes();
          }
        });
        
        newMapState.markers.push(listingMarker);
        newMapState.listingMarkers.set(property.address, { listingMarker, color });
        
        // Add gym & grocery markers immediately if "Show All"
        if (mode === "showAll") {
          addGymAndGroceryMarkers(property, color, false);
        }
      }
    });
    
    // Update map state
    setMapState(newMapState);
  };

  // Fetch property details with POI data
  const fetchPropertyDetails = async (propertyId: number) => {
    try {
      const response = await apiRequest("GET", `/api/properties/${propertyId}`);
      const property = await response.json();
      
      // Add POI data
      if (userPreferences) {
        if (userPreferences.gym) {
          const gymResponse = await apiRequest("GET", `/api/nearby-places?lat=${property.lat}&lng=${property.lon}&type=gym&keyword=${encodeURIComponent(userPreferences.gym)}`);
          const gymData = await gymResponse.json();
          if (gymData.places && gymData.places.length > 0) {
            property.nearestGym = gymData.places[0];
          }
        }
        
        if (userPreferences.grocery) {
          const groceryResponse = await apiRequest("GET", `/api/nearby-places?lat=${property.lat}&lng=${property.lon}&type=supermarket&keyword=${encodeURIComponent(userPreferences.grocery)}`);
          const groceryData = await groceryResponse.json();
          if (groceryData.places && groceryData.places.length > 0) {
            property.nearestGrocery = groceryData.places[0];
          }
        }
      }
      
      return property;
    } catch (error) {
      console.error("Error fetching property details:", error);
      return null;
    }
  };

  // Load compare properties based on saved properties
  useEffect(() => {
    if (savedProperties && savedProperties.length > 0) {
      const loadCompareProperties = async () => {
        const propertyIds = savedProperties.map(item => item.property.id);
        const detailedProperties = await Promise.all(
          propertyIds.map(id => fetchPropertyDetails(id))
        );
        
        // Filter out any null values
        const validProperties = detailedProperties.filter(property => property !== null) as PropertyWithPOIs[];
        setCompareProperties(validProperties);
      };
      
      loadCompareProperties();
    }
  }, [savedProperties, userPreferences]);

  // Initialize map when compare properties are loaded
  useEffect(() => {
    if (compareProperties.length > 0 && showMap) {
      loadGoogleMapsScript(() => {
        initializeMap(compareProperties, true);
      });
    }
  }, [compareProperties, showMap]);

  // Render amenity status
  const renderAmenityStatus = (property: Property, amenity: string) => {
    const amenityValue = property[amenity as keyof Property];
    
    if (amenityValue === true) {
      return <Check className="h-5 w-5 text-green-500" />;
    } else if (amenityValue === false) {
      return <X className="h-5 w-5 text-red-500" />;
    } else {
      return <span className="text-gray-400">N/A</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!savedProperties || savedProperties.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Property Comparison</CardTitle>
            <CardDescription>
              You haven't saved any properties yet. Save properties to compare them here.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Property Comparison</CardTitle>
              <CardDescription>
                Compare your saved properties side by side
              </CardDescription>
            </div>
            <div>
              <Button 
                variant="outline" 
                onClick={() => setShowMap(!showMap)}
                className="mr-2"
              >
                {showMap ? "Hide Map" : "Show Map"}
              </Button>
              {showMap && (
                <Button variant="outline" onClick={toggleShowMode}>
                  {showMode === "onClick" ? "Show All POIs" : "POIs On Click"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {showMap && (
          <CardContent>
            <div 
              ref={mapRef} 
              id="map" 
              className="w-full h-96 rounded-md border border-gray-200"
            ></div>
          </CardContent>
        )}
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Comparison column headers */}
        <div className="sticky top-0 z-10 bg-background p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-4">Features</h3>
          <div className="space-y-6">
            <div>
              <p className="font-medium">Address</p>
            </div>
            {selectedAttributes.price && (
              <div>
                <p className="font-medium">Price</p>
              </div>
            )}
            {selectedAttributes.beds && (
              <div>
                <p className="font-medium">Bedrooms</p>
              </div>
            )}
            {selectedAttributes.baths && (
              <div>
                <p className="font-medium">Bathrooms</p>
              </div>
            )}
            {selectedAttributes.sqft && (
              <div>
                <p className="font-medium">Square Feet</p>
              </div>
            )}
            <Separator />
            <div>
              <p className="font-medium">In-unit Laundry</p>
            </div>
            <div>
              <p className="font-medium">Dishwasher</p>
            </div>
            <div>
              <p className="font-medium">Pet Friendly</p>
            </div>
            <div>
              <p className="font-medium">Doorman</p>
            </div>
            <div>
              <p className="font-medium">Elevator</p>
            </div>
            <Separator />
            <div>
              <p className="font-medium">Nearest Grocery</p>
            </div>
            <div>
              <p className="font-medium">Nearest Gym</p>
            </div>
          </div>
        </div>
        
        {/* Property comparison columns */}
        {compareProperties.map((property, index) => (
          <Card key={property.id} className="overflow-hidden">
            <CardHeader className={`bg-${colors[index % colors.length]}-50`}>
              <Badge 
                className={`bg-${colors[index % colors.length]}-100 text-${colors[index % colors.length]}-800 mb-2`}
              >
                Property {index + 1}
              </Badge>
              <CardTitle className="text-base truncate">
                {property.title || property.address}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              <div>
                <p className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                  {property.address}
                </p>
              </div>
              {selectedAttributes.price && (
                <div>
                  <p className="font-semibold">${property.rent?.toLocaleString()}/mo</p>
                </div>
              )}
              {selectedAttributes.beds && (
                <div>
                  <p>{property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}</p>
                </div>
              )}
              {selectedAttributes.baths && (
                <div>
                  <p>{property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}</p>
                </div>
              )}
              {selectedAttributes.sqft && (
                <div>
                  <p>{property.sqft?.toLocaleString() || 'N/A'} sqft</p>
                </div>
              )}
              <Separator />
              <div>
                {renderAmenityStatus(property, 'hasInUnitLaundry')}
              </div>
              <div>
                {renderAmenityStatus(property, 'hasDishwasher')}
              </div>
              <div>
                {renderAmenityStatus(property, 'petFriendly')}
              </div>
              <div>
                {renderAmenityStatus(property, 'hasDoorman')}
              </div>
              <div>
                {renderAmenityStatus(property, 'hasElevator')}
              </div>
              <Separator />
              <div>
                <p className="text-sm">
                  {property.nearestGrocery ? (
                    <>
                      <span className="font-medium">{property.nearestGrocery.name}</span>
                      <br />
                      <span className="text-gray-500">{property.nearestGrocery.distance}</span>
                    </>
                  ) : 'No data'}
                </p>
              </div>
              <div>
                <p className="text-sm">
                  {property.nearestGym ? (
                    <>
                      <span className="font-medium">{property.nearestGym.name}</span>
                      <br />
                      <span className="text-gray-500">{property.nearestGym.distance}</span>
                    </>
                  ) : 'No data'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}