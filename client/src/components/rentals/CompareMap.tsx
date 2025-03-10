import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/lib/google-maps-loader';
import { Property } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { calculateRoute, RouteInfo } from '@/lib/places-service';
import { Loader2 } from 'lucide-react';

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
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const routesRef = useRef<google.maps.Polyline[]>([]);
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([]);
  
  const [selectedPOIType, setSelectedPOIType] = useState<POIType>('gym');
  const [isLoadingMap, setIsLoadingMap] = useState<boolean>(true);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<{[propertyId: number]: any[]}>({});
  const [selectedRoutes, setSelectedRoutes] = useState<{[propertyId: number]: RouteInfo | null}>({});
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
  
  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        const google = await loadGoogleMaps();
        
        if (!mapRef.current) return;
        
        // Calculate center point among all properties
        const bounds = new google.maps.LatLngBounds();
        properties.forEach(property => {
          bounds.extend(new google.maps.LatLng(property.latitude, property.longitude));
        });
        
        const map = new google.maps.Map(mapRef.current, {
          center: bounds.getCenter(),
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        
        googleMapRef.current = map;
        
        // Add property markers
        properties.forEach(property => {
          const marker = new google.maps.Marker({
            position: { lat: property.latitude, lng: property.longitude },
            map,
            title: property.title,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: propertyColors[property.id],
              fillOpacity: 1,
              strokeWeight: 0,
              scale: 8
            }
          });
          
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-bold">${property.title}</h3>
                <p>${property.address}</p>
                <p>$${property.rent}/month</p>
              </div>
            `
          });
          
          marker.addListener('click', () => {
            infoWindowsRef.current.forEach(iw => iw.close());
            infoWindow.open(map, marker);
          });
          
          markersRef.current.push(marker);
          infoWindowsRef.current.push(infoWindow);
        });
        
        map.fitBounds(bounds);
        
        setIsLoadingMap(false);
      } catch (error) {
        console.error('Error initializing map:', error);
        setIsLoadingMap(false);
      }
    };
    
    initMap();
    
    return () => {
      // Clean up on unmount
      markersRef.current.forEach(marker => marker.setMap(null));
      routesRef.current.forEach(route => route.setMap(null));
      infoWindowsRef.current.forEach(infoWindow => infoWindow.close());
      
      markersRef.current = [];
      routesRef.current = [];
      infoWindowsRef.current = [];
    };
  }, [properties]);
  
  // Fetch nearby places when POI type changes
  const fetchNearbyPlaces = async () => {
    if (!selectedPOIType || !googleMapRef.current) return;
    
    setIsLoadingPlaces(true);
    
    try {
      // Clear existing route lines
      routesRef.current.forEach(route => route.setMap(null));
      routesRef.current = [];
      
      const newNearbyPlaces: {[propertyId: number]: any[]} = {};
      
      // Get nearby places for each property
      for (const property of properties) {
        const response = await fetch(
          `/api/nearby-places?lat=${property.latitude}&lng=${property.longitude}&type=${selectedPOIType}`, 
          { method: 'GET' }
        );
        
        if (response.ok) {
          const data = await response.json();
          newNearbyPlaces[property.id] = data.places || [];
          
          // Add markers for the places
          if (data.places && data.places.length > 0) {
            const place = data.places[0]; // Get the first/closest place
            
            // Only plot the closest place to each property
            const placeMarker = new google.maps.Marker({
              position: { lat: place.lat, lng: place.lng },
              map: googleMapRef.current,
              title: place.name,
              icon: {
                url: `http://maps.google.com/mapfiles/ms/icons/${selectedPOIType === 'gym' ? 'purple' : 'blue'}-dot.png`,
              }
            });
            
            markersRef.current.push(placeMarker);
            
            // Get route from property to place
            const route = await calculateRoute(
              { lat: property.latitude, lng: property.longitude },
              { lat: place.lat, lng: place.lng }
            );
            
            if (route) {
              // Draw route on map
              const routePath = new google.maps.Polyline({
                path: route.route,
                geodesic: true,
                strokeColor: propertyColors[property.id],
                strokeOpacity: 0.7,
                strokeWeight: 3
              });
              
              routePath.setMap(googleMapRef.current);
              routesRef.current.push(routePath);
              
              // Store route info
              setSelectedRoutes(prev => ({
                ...prev,
                [property.id]: route
              }));
            }
          }
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
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-2/3">
            <div 
              ref={mapRef} 
              className="w-full h-96 rounded-md bg-muted/50"
              style={{ minHeight: '400px' }}
            >
              {isLoadingMap && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-2">Loading map...</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-1/3 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Find Nearby</label>
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
            
            {/* Distance results */}
            <div className="space-y-3">
              <h3 className="font-medium">Distance Results</h3>
              
              {properties.map(property => (
                <div key={property.id} className="p-3 border rounded-lg">
                  <div className="flex items-center mb-2">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: propertyColors[property.id] }}
                    ></div>
                    <span className="font-medium">{property.title}</span>
                  </div>
                  
                  {selectedRoutes[property.id] ? (
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-medium">Distance:</span>{' '}
                        {selectedRoutes[property.id]?.distance}
                      </p>
                      <p>
                        <span className="font-medium">Est. Time:</span>{' '}
                        {selectedRoutes[property.id]?.duration}
                      </p>
                      <p>
                        <span className="font-medium">To:</span>{' '}
                        {nearbyPlaces[property.id]?.[0]?.name || 'N/A'}
                      </p>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Select a place type and click "Find Nearest"
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}