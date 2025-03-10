import { useState, useEffect, useRef } from 'react';
import { Property } from '@shared/schema';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Home } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface MapComparisonProps {
  properties: Property[];
}

export function MapComparison({ properties }: MapComparisonProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [googleMap, setGoogleMap] = useState<google.maps.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [activeInfoWindow, setActiveInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  const [mapApiKey, setMapApiKey] = useState<string | null>(null);
  const [mapView, setMapView] = useState<'map' | 'static'>('static');
  
  // Fetch the Google Maps API key
  const { data: apiKeyData, isLoading: apiKeyLoading, error: apiKeyError } = useQuery({
    queryKey: ['/api/maps-key'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/maps-key');
      const data = await res.json();
      return data.key as string;
    },
    retry: 1,
    refetchOnWindowFocus: false
  });
  
  // Set the API key when it's fetched
  useEffect(() => {
    if (apiKeyData) {
      setMapApiKey(apiKeyData);
    }
  }, [apiKeyData]);
  
  // Load Google Maps API script
  useEffect(() => {
    if (!mapApiKey || googleMapsLoaded) return;
    
    // We'll use a simpler approach to loading the Google Maps API
    // that is more reliable and doesn't use the loadGoogleMaps function
    const loadGoogleMapsScript = () => {
      try {
        // Only load if not already loaded
        if (window.google?.maps) {
          setGoogleMapsLoaded(true);
          return;
        }
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          setGoogleMapsLoaded(true);
        };
        
        script.onerror = () => {
          setMapError('Failed to load Google Maps API');
        };
        
        document.head.appendChild(script);
        
        return () => {
          // Only remove the script if it was added by this component
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
        };
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setMapError('Failed to load Google Maps');
      }
    };
    
    loadGoogleMapsScript();
  }, [mapApiKey, googleMapsLoaded]);
  
  // Initialize the map once Google Maps is loaded
  useEffect(() => {
    if (!googleMapsLoaded || !mapContainerRef.current || mapView !== 'map') return;
    
    try {
      // Clear any previous markers
      markers.forEach(marker => marker.setMap(null));
      setMarkers([]);
      
      // Close any open info windows
      if (activeInfoWindow) {
        activeInfoWindow.close();
        setActiveInfoWindow(null);
      }
      
      // Create map bounds to contain all properties
      const bounds = new google.maps.LatLngBounds();
      let hasValidCoordinates = false;
      
      properties.forEach(property => {
        if (property.latitude && property.longitude) {
          bounds.extend(new google.maps.LatLng(property.latitude, property.longitude));
          hasValidCoordinates = true;
        }
      });
      
      // If no valid coordinates, center on NYC
      if (!hasValidCoordinates) {
        bounds.extend(new google.maps.LatLng(40.7128, -74.0060));
      }
      
      // Initialize map
      const map = new google.maps.Map(mapContainerRef.current, {
        center: bounds.getCenter(),
        zoom: 12,
        mapTypeControl: false,
        fullscreenControl: true,
        streetViewControl: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      });
      
      setGoogleMap(map);
      
      // Add markers for each property
      const newMarkers: google.maps.Marker[] = [];
      
      properties.forEach((property, index) => {
        if (!property.latitude || !property.longitude) return;
        
        // Define marker colors for different properties
        const colors = ['#4CAF50', '#2196F3', '#F44336'];
        const color = colors[index % colors.length];
        
        // Create marker
        const marker = new google.maps.Marker({
          position: { lat: property.latitude, lng: property.longitude },
          map,
          title: property.title || 'Property',
          label: {
            text: (index + 1).toString(),
            color: 'white'
          },
          zIndex: 1000 - index,
          // Use circle icon for property
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 10
          }
        });
        
        // Create info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 5px; max-width: 250px;">
              <h3 style="margin: 0; font-size: 16px; margin-bottom: 5px;">${property.title || 'Property'}</h3>
              <p style="margin: 0; font-size: 14px; margin-bottom: 5px;">${property.address || ''}</p>
              <p style="margin: 0; font-size: 14px; margin-bottom: 5px;">$${property.rent?.toLocaleString() || 0}/month</p>
              <p style="margin: 0; font-size: 14px;">${property.bedrooms || 0} bed, ${property.bathrooms || 0} bath</p>
            </div>
          `
        });
        
        // Add click listener
        marker.addListener('click', () => {
          // Close any open info window
          if (activeInfoWindow) {
            activeInfoWindow.close();
          }
          
          // Open this info window
          infoWindow.open(map, marker);
          setActiveInfoWindow(infoWindow);
        });
        
        newMarkers.push(marker);
      });
      
      setMarkers(newMarkers);
      
      // Fit map to bounds
      if (hasValidCoordinates) {
        map.fitBounds(bounds);
        
        // Add a bit of padding
        const listener = google.maps.event.addListenerOnce(map, 'idle', () => {
          if (properties.length === 1) {
            map.setZoom(15); // For a single property, zoom in more
          }
        });
      }
      
      // Clean up on unmount
      return () => {
        // Clear all markers
        newMarkers.forEach(marker => {
          google.maps.event.clearInstanceListeners(marker);
          marker.setMap(null);
        });
        
        // Close any open info windows
        if (activeInfoWindow) {
          activeInfoWindow.close();
        }
        
        // Clear map instance listeners
        if (map) {
          google.maps.event.clearInstanceListeners(map);
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map');
    }
  }, [googleMapsLoaded, properties, mapView]);
  
  // Function to toggle between map and static view
  const toggleMapView = () => {
    setMapView(prev => prev === 'map' ? 'static' : 'map');
  };

  // Static property comparison component
  function StaticPropertyComparison({ properties }: { properties: Property[] }) {
    const colors = ['#4CAF50', '#2196F3', '#F44336'];
    
    return (
      <div className="w-full">
        <div className="grid gap-4">
          {properties.map((property, index) => (
            <div key={property.id} className="border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <h3 className="font-medium text-base">{property.title}</h3>
              </div>
              <div className="pl-7">
                <p className="text-sm text-muted-foreground mb-1">{property.address}</p>
                <p className="text-sm mb-1">
                  <span className="text-muted-foreground">Price:</span> ${property.rent.toLocaleString()}/month
                </p>
                <p className="text-sm mb-1">
                  <span className="text-muted-foreground">Size:</span> {property.squareFeet} sq ft
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Bedrooms/Bathrooms:</span> {property.bedrooms}b / {property.bathrooms}ba
                </p>
                
                {property.latitude && property.longitude ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>Location: {property.neighborhood}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">No location data available</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Handle loading states and errors
  if (apiKeyLoading) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-muted/20 rounded-md">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading map...</p>
        </div>
      </div>
    );
  }
  
  if (apiKeyError || !mapApiKey) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-muted/20 rounded-md">
        <div className="text-center max-w-md p-4">
          <MapPin className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="font-medium mb-2">Unable to load Google Maps</p>
          <p className="text-sm text-muted-foreground mb-4">
            There was an issue with the Google Maps API. Please try again later.
          </p>
          <StaticPropertyComparison properties={properties} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-base font-medium">Property Locations</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={toggleMapView}
          className="text-xs"
        >
          {mapView === 'static' ? 'Show Interactive Map' : 'Show Simple View'}
        </Button>
      </div>
      
      {mapView === 'map' ? (
        <div className="relative">
          <div 
            ref={mapContainerRef}
            className="w-full h-[400px] rounded-md bg-muted/20"
          />
          
          {!googleMapsLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Loading Google Maps...</p>
              </div>
            </div>
          )}
          
          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center max-w-md p-4">
                <MapPin className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="font-medium mb-2">Map Error</p>
                <p className="text-sm text-muted-foreground mb-4">{mapError}</p>
                <Button onClick={toggleMapView} size="sm">Show Simple View</Button>
              </div>
            </div>
          )}
          
          <div className="mt-2 text-xs text-muted-foreground text-center">
            <p>Click on markers to see property details</p>
          </div>
        </div>
      ) : (
        <StaticPropertyComparison properties={properties} />
      )}
    </div>
  );
}