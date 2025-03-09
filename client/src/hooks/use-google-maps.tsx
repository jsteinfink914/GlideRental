import { useState, useEffect, useRef, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

// Types for Google Maps
interface GoogleMapState {
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
  isLoading: boolean;
  error: Error | null;
}

// POI types interface
interface POI {
  name: string;
  lat: number;
  lon: number; // Google Maps API uses lng but we'll handle the conversion
  distance: string;
  rating?: number;
}

// Listing with POI data
interface ListingWithPOIs {
  id: number;
  address: string;
  lat: number;
  lon: number;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  nearestGym?: POI;
  nearestGrocery?: POI;
  nearestPOIs?: {
    [key: string]: POI;
  };
  // These are added dynamically when we render markers
  gymMarker?: google.maps.Marker;
  groceryMarker?: google.maps.Marker;
}

// Display modes for the map
type MapDisplayMode = "onClick" | "showAll";

// POI icon configuration
const poiIcons = {
  Cafes: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
  "Public Transport": "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  Schools: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  Restaurants: "https://maps.google.com/mapfiles/ms/icons/orange-dot.png",
  Gyms: "https://maps.google.com/mapfiles/ms/icons/purple-dot.png",
  Groceries: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
};

// Predefined colors for markers
const markerColors = [
  "red", "blue", "green", "purple", "orange", "pink", "yellow", "cyan"
];

/**
 * Hook to load and initialize Google Maps
 */
export function useGoogleMaps() {
  const [mapState, setMapState] = useState<GoogleMapState>({
    map: null,
    markers: [],
    listingMarkers: new Map(),
    openInfoWindows: [],
    routeInfoWindows: [],
    directionsService: null,
    directionsRenderers: [],
    cachedRoutes: new Map(),
    isLoading: true,
    error: null
  });
  
  const [displayMode, setDisplayMode] = useState<MapDisplayMode>("onClick");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const googleMapsScriptRef = useRef<HTMLScriptElement | null>(null);

  // Load Google Maps API script
  const loadGoogleMapsScript = useCallback(async () => {
    if (window.google && window.google.maps) {
      return Promise.resolve();
    }

    try {
      const response = await apiRequest('GET', '/api/maps-key');
      const { key } = await response.json();
      
      if (!key) {
        throw new Error("Missing Google Maps API key");
      }

      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Google Maps script"));
        document.head.appendChild(script);
        googleMapsScriptRef.current = script;
      });
    } catch (error) {
      throw new Error("Failed to fetch Google Maps API key");
    }
  }, []);

  // Initialize the map
  const initializeMap = useCallback(async (container: HTMLDivElement, center = { lat: 40.7128, lng: -74.0060 }, zoom = 12) => {
    if (!window.google || !window.google.maps) {
      try {
        await loadGoogleMapsScript();
      } catch (error) {
        setMapState(prev => ({ ...prev, error: error as Error, isLoading: false }));
        return;
      }
    }

    try {
      const map = new google.maps.Map(container, { center, zoom });
      
      // Close info windows when clicking on the map
      map.addListener("click", () => {
        closeAllInfoWindows();
        closeAllRouteInfoWindows();
      });

      const directionsService = new google.maps.DirectionsService();

      setMapState(prev => ({ 
        ...prev, 
        map, 
        directionsService,
        isLoading: false 
      }));
    } catch (error) {
      setMapState(prev => ({ ...prev, error: error as Error, isLoading: false }));
    }
  }, [loadGoogleMapsScript]);

  // Get a color for a marker based on index
  const getMarkerColor = useCallback((index: number) => {
    return markerColors[index % markerColors.length];
  }, []);

  // Close all open info windows
  const closeAllInfoWindows = useCallback(() => {
    setMapState(prev => {
      prev.openInfoWindows.forEach(infoWindow => infoWindow.close());
      return { ...prev, openInfoWindows: [] };
    });
  }, []);

  // Close all route info windows
  const closeAllRouteInfoWindows = useCallback(() => {
    setMapState(prev => {
      prev.routeInfoWindows.forEach(infoWindow => infoWindow.close());
      return { ...prev, routeInfoWindows: [] };
    });
  }, []);

  // Clear all gym and grocery markers
  const clearGymAndGroceryMarkers = useCallback(() => {
    setMapState(prev => {
      const newMarkers = prev.markers.filter(marker => {
        if ((marker as any).isGym || (marker as any).isGrocery) {
          marker.setMap(null);
          return false;
        }
        return true;
      });
      return { ...prev, markers: newMarkers };
    });
  }, []);

  // Clear all routes
  const clearRoutes = useCallback(() => {
    setMapState(prev => {
      prev.directionsRenderers.forEach(renderer => renderer.setMap(null));
      return { ...prev, directionsRenderers: [] };
    });
  }, []);

  // Find the midpoint of a route for placing travel time info
  const getRouteMidPoint = useCallback((route: google.maps.DirectionsRoute) => {
    let totalDistance = 0;
    let coveredDistance = 0;
    
    // Calculate total distance
    route.legs[0].steps.forEach(step => totalDistance += step.distance.value);
    
    // Find the midpoint step
    for (const step of route.legs[0].steps) {
      coveredDistance += step.distance.value;
      if (coveredDistance >= totalDistance / 2) {
        return step.end_location;
      }
    }
    
    // Fallback to the middle step
    const midStepIndex = Math.floor(route.legs[0].steps.length / 2);
    return route.legs[0].steps[midStepIndex].end_location;
  }, []);

  // Display a route on the map
  const displayRoute = useCallback((result: google.maps.DirectionsResult) => {
    setMapState(prev => {
      if (!prev.map) return prev;
      
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map: prev.map,
        directions: result,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#007bff",
          strokeOpacity: 0.9,
          strokeWeight: 7,
        },
      });
      
      const route = result.routes[0].legs[0];
      const travelTime = route.duration.text;
      const midPoint = getRouteMidPoint(result.routes[0]);
      
      const infoWindow = new google.maps.InfoWindow({
        content: `<strong>🚶 ${travelTime}</strong>`,
        position: midPoint,
      });
      
      infoWindow.open(prev.map);
      
      return {
        ...prev,
        directionsRenderers: [...prev.directionsRenderers, directionsRenderer],
        routeInfoWindows: [...prev.routeInfoWindows, infoWindow],
      };
    });
  }, [getRouteMidPoint]);

  // Draw a route between a listing and a destination
  const drawRoute = useCallback((listing: ListingWithPOIs, destination: POI) => {
    setMapState(prev => {
      if (!prev.map || !prev.directionsService) return prev;
      
      const routeKey = `${listing.lat},${listing.lon}-${destination.lat},${destination.lon}`;
      
      // Check if route is cached
      if (prev.cachedRoutes.has(routeKey)) {
        const cachedRoute = prev.cachedRoutes.get(routeKey);
        if (cachedRoute) {
          displayRoute(cachedRoute);
        }
        return prev;
      }
      
      // Calculate new route
      const request: google.maps.DirectionsRequest = {
        origin: { lat: listing.lat, lng: listing.lon },
        destination: { lat: destination.lat, lng: destination.lon as number },
        travelMode: google.maps.TravelMode.WALKING,
      };
      
      prev.directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setMapState(current => {
            const newCachedRoutes = new Map(current.cachedRoutes);
            newCachedRoutes.set(routeKey, result);
            
            // We call displayRoute separately to avoid state update conflicts
            displayRoute(result);
            
            return {
              ...current,
              cachedRoutes: newCachedRoutes,
            };
          });
        }
      });
      
      return prev;
    });
  }, [displayRoute]);

  // Add markers for POIs
  const addPOIMarkers = useCallback((listing: ListingWithPOIs) => {
    setMapState(prev => {
      if (!prev.map || !listing.nearestPOIs) return prev;
      
      const newMarkers = [...prev.markers];
      
      Object.keys(listing.nearestPOIs).forEach(poiType => {
        const poi = listing.nearestPOIs?.[poiType];
        if (!poi || !poi.lat || !poi.lon) return;
        
        const poiMarker = new google.maps.Marker({
          position: { lat: poi.lat, lng: poi.lon },
          map: prev.map,
          title: `${poiType}: ${poi.name}`,
          icon: {
            url: poiIcons[poiType as keyof typeof poiIcons] || "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            scaledSize: new google.maps.Size(20, 20),
          },
        });
        
        const infoWindow = new google.maps.InfoWindow({
          content: `<strong>${poiType}: ${poi.name}</strong><br>📍 Distance: ${poi.distance}`,
        });
        
        poiMarker.addListener("click", () => {
          infoWindow.open(prev.map, poiMarker);
        });
        
        newMarkers.push(poiMarker);
      });
      
      return { ...prev, markers: newMarkers };
    });
  }, []);

  // Add gym and grocery markers for a listing
  const addGymAndGroceryMarkers = useCallback((listing: ListingWithPOIs, color: string, drawRoutes: boolean) => {
    setMapState(prev => {
      if (!prev.map) return prev;
      
      const newMarkers = [...prev.markers];
      const updatedListing = { ...listing };
      
      // Add gym marker
      if (listing.nearestGym?.lat && listing.nearestGym?.lon) {
        const gymIcon = {
          url: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
          scaledSize: new google.maps.Size(30, 30),
        };
        
        const gymMarker = new google.maps.Marker({
          position: { lat: listing.nearestGym.lat, lng: listing.nearestGym.lon },
          map: prev.map,
          icon: gymIcon,
          title: `Gym: ${listing.nearestGym.name}`,
        });
        
        (gymMarker as any).isGym = true;
        
        const gymInfoWindow = new google.maps.InfoWindow({
          content: `<strong>🏋️ Gym: ${listing.nearestGym.name}</strong><br>📍 Distance: ${listing.nearestGym.distance}`,
        });
        
        gymMarker.addListener("click", () => {
          gymInfoWindow.open(prev.map, gymMarker);
        });
        
        newMarkers.push(gymMarker);
        updatedListing.gymMarker = gymMarker;
        
        if (drawRoutes) {
          // We call drawRoute outside this function to avoid state conflicts
          setTimeout(() => drawRoute(listing, listing.nearestGym!), 0);
        }
      }
      
      // Add grocery marker
      if (listing.nearestGrocery?.lat && listing.nearestGrocery?.lon) {
        const groceryIcon = {
          url: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
          scaledSize: new google.maps.Size(30, 30),
        };
        
        const groceryMarker = new google.maps.Marker({
          position: { lat: listing.nearestGrocery.lat, lng: listing.nearestGrocery.lon },
          map: prev.map,
          icon: groceryIcon,
          title: `Grocery: ${listing.nearestGrocery.name}`,
        });
        
        (groceryMarker as any).isGrocery = true;
        
        const groceryInfoWindow = new google.maps.InfoWindow({
          content: `<strong>🛒 Grocery: ${listing.nearestGrocery.name}</strong><br>📍 Distance: ${listing.nearestGrocery.distance}`,
        });
        
        groceryMarker.addListener("click", () => {
          groceryInfoWindow.open(prev.map, groceryMarker);
        });
        
        newMarkers.push(groceryMarker);
        updatedListing.groceryMarker = groceryMarker;
        
        if (drawRoutes) {
          // Call drawRoute outside to avoid state conflicts
          setTimeout(() => drawRoute(listing, listing.nearestGrocery!), 0);
        }
      }
      
      return { ...prev, markers: newMarkers };
    });
  }, [drawRoute]);

  // Add listing markers to the map
  const addListingMarkers = useCallback((listings: ListingWithPOIs[], isComparePage = true) => {
    setMapState(prev => {
      if (!prev.map) return prev;
      
      // Clear existing markers
      prev.markers.forEach(marker => marker.setMap(null));
      
      const newMarkers: google.maps.Marker[] = [];
      const newListingMarkers = new Map<string, { listingMarker: google.maps.Marker, color: string }>();
      
      listings.forEach((listing, index) => {
        if (!listing.lat || !listing.lon) return;
        
        const color = isComparePage ? getMarkerColor(index) : "blue";
        
        const listingMarker = new google.maps.Marker({
          position: { lat: listing.lat, lng: listing.lon },
          map: prev.map,
          title: listing.address,
          icon: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
        });
        
        const infoWindow = new google.maps.InfoWindow({
          content: `<strong>${listing.address}</strong>`,
        });
        
        listingMarker.addListener("click", () => {
          closeAllInfoWindows();
          closeAllRouteInfoWindows();
          infoWindow.open(prev.map, listingMarker);
          
          setMapState(current => ({
            ...current,
            openInfoWindows: [...current.openInfoWindows, infoWindow],
          }));
          
          // Show gym/grocery on click if we're in onClick mode
          if (displayMode === "onClick") {
            clearGymAndGroceryMarkers();
            clearRoutes();
            addGymAndGroceryMarkers(listing, color, true);
          } else {
            clearRoutes();
          }
        });
        
        newMarkers.push(listingMarker);
        newListingMarkers.set(listing.address, { listingMarker, color });
        
        // Add gym & grocery markers immediately if in showAll mode
        if (displayMode === "showAll") {
          addGymAndGroceryMarkers(listing, color, false);
        }
        
        // Add POI markers
        addPOIMarkers(listing);
      });
      
      return {
        ...prev,
        markers: newMarkers,
        listingMarkers: newListingMarkers,
      };
    });
  }, [
    displayMode, 
    getMarkerColor, 
    closeAllInfoWindows, 
    closeAllRouteInfoWindows, 
    clearGymAndGroceryMarkers, 
    clearRoutes, 
    addGymAndGroceryMarkers, 
    addPOIMarkers
  ]);

  // Toggle display mode (onClick vs showAll)
  const toggleDisplayMode = useCallback((listings: ListingWithPOIs[]) => {
    setDisplayMode(prev => {
      const newMode = prev === "onClick" ? "showAll" : "onClick";
      
      // Clear existing POI markers and routes
      clearGymAndGroceryMarkers();
      clearRoutes();
      
      // Re-add markers with new mode
      setTimeout(() => addListingMarkers(listings, true), 0);
      
      return newMode;
    });
  }, [clearGymAndGroceryMarkers, clearRoutes, addListingMarkers]);

  // Resize map if container size changes
  const resizeMap = useCallback(() => {
    setMapState(prev => {
      if (prev.map) {
        google.maps.event.trigger(prev.map, 'resize');
      }
      return prev;
    });
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      setMapState(prev => {
        // Clear markers
        prev.markers.forEach(marker => marker.setMap(null));
        
        // Clear routes
        prev.directionsRenderers.forEach(renderer => renderer.setMap(null));
        
        // Close info windows
        prev.openInfoWindows.forEach(infoWindow => infoWindow.close());
        prev.routeInfoWindows.forEach(infoWindow => infoWindow.close());
        
        return {
          ...prev,
          map: null,
          markers: [],
          directionsRenderers: [],
          openInfoWindows: [],
          routeInfoWindows: [],
        };
      });
      
      // Remove script if we added it
      if (googleMapsScriptRef.current && document.head.contains(googleMapsScriptRef.current)) {
        document.head.removeChild(googleMapsScriptRef.current);
      }
    };
  }, []);

  return {
    mapState,
    displayMode,
    mapContainerRef,
    initializeMap,
    addListingMarkers,
    toggleDisplayMode,
    clearGymAndGroceryMarkers,
    clearRoutes,
    resizeMap,
    drawRoute,
  };
}

// Export types for use in other components
export type { ListingWithPOIs, POI, MapDisplayMode };