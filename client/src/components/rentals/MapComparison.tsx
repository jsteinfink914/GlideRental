import { useState, useEffect, useRef } from 'react';
import { Property } from '@shared/schema';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Home, Navigation, Search, X, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface MapComparisonProps {
  properties: Property[];
}

interface POI {
  name: string;
  location: google.maps.LatLng;
  address: string;
  placeId: string;
  type: string;
  marker?: google.maps.Marker;
  distance?: string;
  duration?: string;
}

interface RouteInfo {
  origin: number; // Property ID
  destination: string; // POI place_id
  route?: google.maps.DirectionsRenderer;
  distance?: string;
  duration?: string;
  polyline?: google.maps.Polyline;
}

export function MapComparison({ properties }: MapComparisonProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [googleMap, setGoogleMap] = useState<google.maps.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [activeInfoWindow, setActiveInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  const [mapApiKey, setMapApiKey] = useState<string | null>(null);
  const [mapView, setMapView] = useState<'map' | 'static'>('static');
  const [searchQuery, setSearchQuery] = useState('');
  const [pois, setPois] = useState<POI[]>([]);
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [searchingPOIs, setSearchingPOIs] = useState(false);
  const [calculatingRoutes, setCalculatingRoutes] = useState(false);
  
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
      
      // Initialize Places service
      const places = new google.maps.places.PlacesService(map);
      setPlacesService(places);
      
      // Initialize Directions service
      const directions = new google.maps.DirectionsService();
      setDirectionsService(directions);
      
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
        
        // Create a custom info window with POI search
        const customInfoWindow = document.createElement('div');
        customInfoWindow.className = 'property-info-window';
        customInfoWindow.innerHTML = `
          <div style="padding: 5px; max-width: 280px;">
            <h3 style="margin: 0; font-size: 16px; margin-bottom: 5px;">${property.title || 'Property'}</h3>
            <p style="margin: 0; font-size: 14px; margin-bottom: 5px;">${property.address || ''}</p>
            <p style="margin: 0; font-size: 14px; margin-bottom: 5px;">$${property.rent?.toLocaleString() || 0}/month</p>
            <p style="margin: 0; font-size: 14px;">${property.bedrooms || 0} bed, ${property.bathrooms || 0} bath</p>
            <div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
              <div style="font-weight: bold; margin-bottom: 5px;">Find nearby:</div>
              <div id="poi-buttons-${property.id}" style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 5px;">
                <button class="poi-button" data-poi="restaurant" style="padding: 3px 6px; border-radius: 4px; border: 1px solid #ddd; background: #f5f5f5; font-size: 12px; cursor: pointer;">Restaurants</button>
                <button class="poi-button" data-poi="grocery_or_supermarket" style="padding: 3px 6px; border-radius: 4px; border: 1px solid #ddd; background: #f5f5f5; font-size: 12px; cursor: pointer;">Grocery</button>
                <button class="poi-button" data-poi="gym" style="padding: 3px 6px; border-radius: 4px; border: 1px solid #ddd; background: #f5f5f5; font-size: 12px; cursor: pointer;">Gym</button>
                <button class="poi-button" data-poi="school" style="padding: 3px 6px; border-radius: 4px; border: 1px solid #ddd; background: #f5f5f5; font-size: 12px; cursor: pointer;">School</button>
                <button class="poi-button" data-poi="park" style="padding: 3px 6px; border-radius: 4px; border: 1px solid #ddd; background: #f5f5f5; font-size: 12px; cursor: pointer;">Park</button>
              </div>
              <div id="poi-results-${property.id}" style="font-size: 12px; max-height: 100px; overflow-y: auto;">
                <p style="margin: 0; color: #666;">Click a category to find nearby places</p>
              </div>
            </div>
          </div>
        `;
        
        // Create info window with custom content
        const infoWindow = new google.maps.InfoWindow({
          content: customInfoWindow
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
          
          // Add event listeners to POI buttons after the InfoWindow is opened
          setTimeout(() => {
            const buttonsContainer = document.getElementById(`poi-buttons-${property.id}`);
            if (buttonsContainer) {
              const buttons = buttonsContainer.querySelectorAll('.poi-button');
              buttons.forEach(button => {
                button.addEventListener('click', (e) => {
                  const poiType = (e.currentTarget as HTMLElement).getAttribute('data-poi');
                  if (poiType) {
                    searchNearbyPOIs(property, poiType);
                  }
                });
              });
            }
          }, 300);
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
        
        // Clear POI markers
        setPois(prevPois => {
          prevPois.forEach(poi => {
            if (poi.marker) {
              poi.marker.setMap(null);
            }
          });
          return [];
        });
        
        // Clear routes
        setRoutes(prevRoutes => {
          prevRoutes.forEach(route => {
            if (route.route) {
              route.route.setMap(null);
            }
            if (route.polyline) {
              route.polyline.setMap(null);
            }
          });
          return [];
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
  
  // Function to search for POIs near a property
  const searchNearbyPOIs = async (property: Property, poiType: string) => {
    if (!placesService || !googleMap || !property.latitude || !property.longitude) return;
    
    // Clear existing POI markers
    setPois(prevPois => {
      prevPois.forEach(poi => {
        if (poi.marker) {
          poi.marker.setMap(null);
        }
      });
      return [];
    });
    
    // Clear existing routes
    setRoutes(prevRoutes => {
      prevRoutes.forEach(route => {
        if (route.route) {
          route.route.setMap(null);
        }
        if (route.polyline) {
          route.polyline.setMap(null);
        }
      });
      return [];
    });
    
    try {
      setSearchingPOIs(true);
      
      // Update the results container to show loading
      const resultsContainer = document.getElementById(`poi-results-${property.id}`);
      if (resultsContainer) {
        resultsContainer.innerHTML = '<p style="margin: 0; color: #666;">Searching nearby...</p>';
      }
      
      const propertyLocation = new google.maps.LatLng(property.latitude, property.longitude);
      
      // Perform a nearby search
      placesService.nearbySearch(
        {
          location: propertyLocation,
          radius: 2000, // 2km radius
          type: poiType
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Get top 3 results
            const topResults = results.slice(0, 3);
            
            // Create POI markers
            const newPOIs: POI[] = [];
            
            // Update the results container with the places
            let resultsHTML = '';
            
            topResults.forEach((place, index) => {
              if (place.geometry && place.geometry.location) {
                // Create POI object
                const poi: POI = {
                  name: place.name || `${poiType} ${index + 1}`,
                  location: place.geometry.location,
                  address: place.vicinity || '',
                  placeId: place.place_id || '',
                  type: poiType
                };
                
                // Create marker for POI
                const marker = new google.maps.Marker({
                  position: place.geometry.location,
                  map: googleMap,
                  title: place.name,
                  icon: {
                    url: place.icon || 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    scaledSize: new google.maps.Size(24, 24)
                  }
                });
                
                // Create info window for POI
                const infoWindow = new google.maps.InfoWindow({
                  content: `
                    <div style="padding: 5px; max-width: 200px;">
                      <h3 style="margin: 0; font-size: 14px; margin-bottom: 3px;">${place.name}</h3>
                      <p style="margin: 0; font-size: 12px; margin-bottom: 3px;">${place.vicinity || ''}</p>
                      <p style="margin: 0; font-size: 12px;">Rating: ${place.rating ? `${place.rating} ⭐` : 'N/A'}</p>
                    </div>
                  `
                });
                
                // Add click listener to POI marker
                marker.addListener('click', () => {
                  // Close any open info window
                  if (activeInfoWindow && activeInfoWindow !== infoWindow) {
                    activeInfoWindow.close();
                  }
                  
                  // Open this info window
                  infoWindow.open(googleMap, marker);
                  setActiveInfoWindow(infoWindow);
                  
                  // Calculate route to this POI
                  calculateRoute(property, poi);
                });
                
                // Store marker with POI
                poi.marker = marker;
                newPOIs.push(poi);
                
                // Add to results HTML
                resultsHTML += `
                  <div style="padding: 4px 0; border-bottom: 1px solid #eee; cursor: pointer;" class="poi-result" data-place-id="${place.place_id}">
                    <div style="font-weight: bold;">${place.name}</div>
                    <div style="display: flex; justify-content: space-between;">
                      <span>${place.vicinity || ''}</span>
                      <span>${place.rating ? `${place.rating} ⭐` : ''}</span>
                    </div>
                  </div>
                `;
              }
            });
            
            // Update state with new POIs
            setPois(prevPois => [...prevPois, ...newPOIs]);
            
            // Update the results container
            if (resultsContainer) {
              if (topResults.length > 0) {
                resultsContainer.innerHTML = resultsHTML;
                
                // Add click listeners to result items
                setTimeout(() => {
                  const resultItems = resultsContainer.querySelectorAll('.poi-result');
                  resultItems.forEach(item => {
                    item.addEventListener('click', () => {
                      const placeId = item.getAttribute('data-place-id');
                      if (placeId) {
                        const poi = newPOIs.find(p => p.placeId === placeId);
                        if (poi && poi.marker) {
                          // Trigger a click on the marker
                          google.maps.event.trigger(poi.marker, 'click');
                        }
                      }
                    });
                  });
                }, 100);
              } else {
                resultsContainer.innerHTML = `<p style="margin: 0; color: #666;">No ${poiType.replace('_', ' ')} found nearby</p>`;
              }
            }
          } else {
            // Update the results container with error
            if (resultsContainer) {
              resultsContainer.innerHTML = `<p style="margin: 0; color: #c00;">Error searching for nearby ${poiType.replace('_', ' ')}</p>`;
            }
          }
          
          setSearchingPOIs(false);
        }
      );
    } catch (error) {
      console.error('Error searching for POIs:', error);
      setSearchingPOIs(false);
    }
  };
  
  // Calculate route between property and POI
  const calculateRoute = async (property: Property, poi: POI) => {
    if (!directionsService || !googleMap || !property.latitude || !property.longitude) return;
    
    try {
      setCalculatingRoutes(true);
      
      // Clear existing routes first
      setRoutes(prevRoutes => {
        prevRoutes.forEach(route => {
          if (route.route) {
            route.route.setMap(null);
          }
          if (route.polyline) {
            route.polyline.setMap(null);
          }
        });
        return [];
      });
      
      const propertyLocation = new google.maps.LatLng(property.latitude, property.longitude);
      
      // Request directions
      directionsService.route(
        {
          origin: propertyLocation,
          destination: { placeId: poi.placeId },
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            // Create a DirectionsRenderer
            const directionsRenderer = new google.maps.DirectionsRenderer({
              map: googleMap,
              directions: result,
              suppressMarkers: true, // We'll use our own markers
              polylineOptions: {
                strokeColor: '#4285F4',
                strokeWeight: 5,
                strokeOpacity: 0.7
              }
            });
            
            // Get route details
            const route = result.routes[0].legs[0];
            const distance = route.distance?.text || 'Unknown';
            const duration = route.duration?.text || 'Unknown';
            
            // Update POI info window with route information
            if (poi.marker) {
              const infoWindow = new google.maps.InfoWindow({
                content: `
                  <div style="padding: 5px; max-width: 200px;">
                    <h3 style="margin: 0; font-size: 14px; margin-bottom: 3px;">${poi.name}</h3>
                    <p style="margin: 0; font-size: 12px; margin-bottom: 3px;">${poi.address || ''}</p>
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                      <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 2px;">
                        <span style="color: #666; font-size: 12px;">Distance:</span>
                        <strong style="font-size: 12px;">${distance}</strong>
                      </div>
                      <div style="display: flex; align-items: center; gap: 5px;">
                        <span style="color: #666; font-size: 12px;">Travel time:</span>
                        <strong style="font-size: 12px;">${duration}</strong>
                      </div>
                    </div>
                  </div>
                `
              });
              
              // Close the existing info window for this POI
              if (activeInfoWindow) {
                activeInfoWindow.close();
              }
              
              // Open the updated info window
              infoWindow.open(googleMap, poi.marker);
              setActiveInfoWindow(infoWindow);
            }
            
            // Add route to state
            setRoutes(prevRoutes => [
              ...prevRoutes,
              {
                origin: property.id,
                destination: poi.placeId,
                route: directionsRenderer,
                distance,
                duration
              }
            ]);
            
            // Update the poi with distance and duration
            setPois(prevPois => 
              prevPois.map(p => 
                p.placeId === poi.placeId 
                  ? { ...p, distance, duration } 
                  : p
              )
            );
          } else {
            console.error('Directions request failed:', status);
            // Show error in POI info window
            if (poi.marker) {
              const infoWindow = new google.maps.InfoWindow({
                content: `
                  <div style="padding: 5px; max-width: 200px;">
                    <h3 style="margin: 0; font-size: 14px; margin-bottom: 3px;">${poi.name}</h3>
                    <p style="margin: 0; font-size: 12px; margin-bottom: 3px;">${poi.address || ''}</p>
                    <p style="margin: 0; font-size: 12px; color: #c00;">Unable to calculate route</p>
                  </div>
                `
              });
              
              // Close the existing info window for this POI
              if (activeInfoWindow) {
                activeInfoWindow.close();
              }
              
              // Open the updated info window
              infoWindow.open(googleMap, poi.marker);
              setActiveInfoWindow(infoWindow);
            }
          }
          
          setCalculatingRoutes(false);
        }
      );
    } catch (error) {
      console.error('Error calculating route:', error);
      setCalculatingRoutes(false);
    }
  };
  
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
  
  // Handle external POI search
  const handlePOISearch = () => {
    if (searchQuery.trim() && googleMap && properties.length > 0) {
      // Find the first property with coordinates to center the search
      const propertyWithCoords = properties.find(p => p.latitude && p.longitude);
      
      if (propertyWithCoords && placesService && propertyWithCoords.latitude && propertyWithCoords.longitude) {
        setSearchingPOIs(true);
        
        const propertyLocation = new google.maps.LatLng(
          propertyWithCoords.latitude, 
          propertyWithCoords.longitude
        );
        
        // Perform the search
        placesService.textSearch(
          {
            query: searchQuery,
            location: propertyLocation,
            radius: 5000 // 5km radius
          },
          (results, status) => {
            // Clear existing POI markers
            setPois(prevPois => {
              prevPois.forEach(poi => {
                if (poi.marker) {
                  poi.marker.setMap(null);
                }
              });
              return [];
            });
            
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              // Get top 5 results
              const topResults = results.slice(0, 5);
              
              // Add markers for each POI
              const newPOIs: POI[] = [];
              
              topResults.forEach((place) => {
                if (place.geometry && place.geometry.location) {
                  // Create POI object
                  const poi: POI = {
                    name: place.name || 'Place',
                    location: place.geometry.location,
                    address: place.formatted_address || '',
                    placeId: place.place_id || '',
                    type: 'search_result'
                  };
                  
                  // Create marker for POI
                  const marker = new google.maps.Marker({
                    position: place.geometry.location,
                    map: googleMap,
                    title: place.name,
                    icon: {
                      url: place.icon || 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
                      scaledSize: new google.maps.Size(24, 24)
                    }
                  });
                  
                  // Create info window for POI
                  const infoWindow = new google.maps.InfoWindow({
                    content: `
                      <div style="padding: 5px; max-width: 200px;">
                        <h3 style="margin: 0; font-size: 14px; margin-bottom: 3px;">${place.name}</h3>
                        <p style="margin: 0; font-size: 12px; margin-bottom: 3px;">${place.formatted_address || ''}</p>
                        <p style="margin: 0; font-size: 12px;">Rating: ${place.rating ? `${place.rating} ⭐` : 'N/A'}</p>
                      </div>
                    `
                  });
                  
                  // Add click listener to POI marker
                  marker.addListener('click', () => {
                    // Close any open info window
                    if (activeInfoWindow) {
                      activeInfoWindow.close();
                    }
                    
                    // Open this info window
                    infoWindow.open(googleMap, marker);
                    setActiveInfoWindow(infoWindow);
                  });
                  
                  // Store marker with POI
                  poi.marker = marker;
                  newPOIs.push(poi);
                }
              });
              
              // Update state with new POIs
              setPois(prevPois => [...prevPois, ...newPOIs]);
              
              // Expand bounds to include POIs and properties
              const bounds = new google.maps.LatLngBounds();
              
              // Include property locations
              properties.forEach(property => {
                if (property.latitude && property.longitude) {
                  bounds.extend(new google.maps.LatLng(property.latitude, property.longitude));
                }
              });
              
              // Include POI locations
              newPOIs.forEach(poi => {
                bounds.extend(poi.location);
              });
              
              // Fit map to new bounds with some padding
              googleMap.fitBounds(bounds);
              
              // Add a small amount of padding
              const listener = google.maps.event.addListenerOnce(googleMap, 'idle', () => {
                // Slightly zoom out for better visibility
                const currentZoom = googleMap.getZoom();
                if (currentZoom !== undefined) {
                  googleMap.setZoom(currentZoom - 1);
                }
              });
            }
            
            setSearchingPOIs(false);
          }
        );
      }
    }
  };
  
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
        <div className="space-y-3">
          {/* POI search input */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for points of interest..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePOISearch();
                    }
                  }}
                  className="pr-8"
                />
                {searchQuery && (
                  <button 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button 
                onClick={handlePOISearch} 
                disabled={searchingPOIs || !searchQuery.trim()}
                size="sm"
              >
                {searchingPOIs ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                Search
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-1">
              Search for places or click property markers to find nearby POIs
            </p>
          </div>
          
          {/* Map display */}
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
          </div>
          
          {/* Instructions */}
          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground text-center pt-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <p>Click on property markers to view details and find nearby points of interest</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5" />
              <p>Click on a POI marker to calculate routes and travel times from properties</p>
            </div>
          </div>
          
          {/* Display active routes if any */}
          {routes.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <h4 className="text-sm font-medium mb-2">Active Routes:</h4>
              <div className="space-y-2">
                {routes.map((route, index) => {
                  // Find the property and POI for this route
                  const property = properties.find(p => p.id === route.origin);
                  const poi = pois.find(p => p.placeId === route.destination);
                  
                  if (!property || !poi) return null;
                  
                  return (
                    <div key={`${route.origin}-${route.destination}`} className="flex items-center justify-between text-sm border rounded-md p-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1 text-xs">
                          <Home className="h-3 w-3" />
                          {property.title}
                        </Badge>
                        <span>→</span>
                        <span className="font-medium">{poi.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{route.distance}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{route.duration}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <StaticPropertyComparison properties={properties} />
      )}
    </div>
  );
}