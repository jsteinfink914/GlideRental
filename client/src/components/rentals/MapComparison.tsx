import { useState, useEffect, useRef } from 'react';
import { Property } from '@shared/schema';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Home, Navigation, Search, X, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { recentSearchPOIs, SearchPOI } from '@/pages/search-page';

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
  
  // Function declarations - moving these up so they're defined before being used
  const calculateRouteDistanceOnly = async (property: Property, poi: POI) => {
    // Skip if we don't have the required services
    if (!directionsService || !googleMap || !property.latitude || !property.longitude) {
      console.error("Missing required services for route calculation");
      return;
    }
    
    try {
      const propertyLocation = new google.maps.LatLng(property.latitude, property.longitude);
      
      // Calculate route
      const response = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route({
          origin: propertyLocation,
          destination: poi.location,
          travelMode: google.maps.TravelMode.DRIVING
        }, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(status);
          }
        });
      });
      
      // Update the route info in the UI
      if (response.routes.length > 0) {
        const route = response.routes[0];
        const leg = route.legs[0];
        
        // Update distance and duration in the UI
        const distanceElem = document.getElementById(`route-${poi.placeId}`);
        if (distanceElem) {
          distanceElem.textContent = `${leg.distance?.text || 'Unknown distance'}, ${leg.duration?.text || 'Unknown time'}`;
        }
      }
    } catch (error) {
      console.error("Error calculating route distance:", error);
      // Silently fail - this is just for informational purposes
    }
  };
  
  const calculateRoute = async (property: Property, poi: POI) => {
    if (!directionsService || !googleMap || !property.latitude || !property.longitude) {
      console.error("Missing required services for route calculation");
      return;
    }
    
    try {
      setCalculatingRoutes(true);
      
      // Find and clear any existing route for this property-POI pair
      setRoutes(prevRoutes => {
        const existingRoute = prevRoutes.find(r => r.origin === property.id && r.destination === poi.placeId);
        if (existingRoute) {
          // Clear existing renderer
          if (existingRoute.route) {
            existingRoute.route.setMap(null);
          }
          if (existingRoute.polyline) {
            existingRoute.polyline.setMap(null);
          }
        }
        return prevRoutes.filter(r => !(r.origin === property.id && r.destination === poi.placeId));
      });
      
      const propertyLocation = new google.maps.LatLng(property.latitude, property.longitude);
      
      // Calculate route
      const response = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route({
          origin: propertyLocation,
          destination: poi.location,
          travelMode: google.maps.TravelMode.DRIVING
        }, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(status);
          }
        });
      });
      
      // Create a renderer for the route
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map: googleMap,
        suppressMarkers: true, // Don't show default markers
        preserveViewport: true, // Don't move the map view
        polylineOptions: {
          strokeColor: "#4285F4", 
          strokeWeight: 5,
          strokeOpacity: 0.7
        }
      });
      
      // Display the route
      directionsRenderer.setDirections(response);
      
      // Extract route info
      let distance = "Unknown";
      let duration = "Unknown";
      if (response.routes.length > 0) {
        const route = response.routes[0];
        const leg = route.legs[0];
        distance = leg.distance?.text || 'Unknown distance';
        duration = leg.duration?.text || 'Unknown time';
      }
      
      // Add to routes state
      const newRoute: RouteInfo = {
        origin: property.id,
        destination: poi.placeId,
        route: directionsRenderer,
        distance,
        duration
      };
      
      setRoutes(prevRoutes => [...prevRoutes, newRoute]);
      
      // Update all POI results with the route info
      const routeInfoElems = document.querySelectorAll(`[id="route-${poi.placeId}"]`);
      routeInfoElems.forEach(elem => {
        elem.textContent = `${distance}, ${duration}`;
      });
      
    } catch (error) {
      console.error("Error calculating route:", error);
      // Display error in the route info elements
      const routeInfoElems = document.querySelectorAll(`[id="route-${poi.placeId}"]`);
      routeInfoElems.forEach(elem => {
        elem.textContent = `Unable to calculate route`;
      });
    } finally {
      setCalculatingRoutes(false);
    }
  };
  
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
    
    // Use the recommended approach to loading the Google Maps API
    // following best practices from Google
    const loadGoogleMapsScript = () => {
      try {
        // Only load if not already loaded
        if (window.google?.maps) {
          setGoogleMapsLoaded(true);
          return;
        }
        
        // Create the script element with async loading pattern
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=places&callback=initMap&loading=async`;
        script.async = true;
        
        // Define the global callback function that Google Maps will call
        (window as any).initMap = () => {
          setGoogleMapsLoaded(true);
          console.log('Google Maps API loaded successfully');
        };
        
        script.onerror = () => {
          setMapError('Failed to load Google Maps API');
          console.error('Google Maps script failed to load');
        };
        
        document.head.appendChild(script);
        
        return () => {
          // Only remove the script if it was added by this component
          if (document.head.contains(script)) {
            document.head.removeChild(script);
            delete (window as any).initMap;
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
      
      // Initialize Places service - ensure it's created properly
      const placesDiv = document.createElement('div');
      document.body.appendChild(placesDiv);
      
      // Create the places service with a temporary element and then with the map
      try {
        console.log("Creating Places service...");
        const placesTemp = new google.maps.places.PlacesService(placesDiv);
        const places = new google.maps.places.PlacesService(map);
        console.log("Places service created successfully");
        setPlacesService(places);
      } catch (err) {
        console.error("Error creating Places service:", err);
      }
      
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
        
        // Create the main content
        const contentWrapper = document.createElement('div');
        contentWrapper.style.padding = '5px';
        contentWrapper.style.maxWidth = '280px';
        
        // Add property info
        const title = document.createElement('h3');
        title.style.margin = '0';
        title.style.fontSize = '16px';
        title.style.marginBottom = '5px';
        title.textContent = property.title || 'Property';
        contentWrapper.appendChild(title);
        
        const address = document.createElement('p');
        address.style.margin = '0';
        address.style.fontSize = '14px';
        address.style.marginBottom = '5px';
        address.textContent = property.address || '';
        contentWrapper.appendChild(address);
        
        const price = document.createElement('p');
        price.style.margin = '0';
        price.style.fontSize = '14px';
        price.style.marginBottom = '5px';
        price.textContent = `$${property.rent?.toLocaleString() || 0}/month`;
        contentWrapper.appendChild(price);
        
        const details = document.createElement('p');
        details.style.margin = '0';
        details.style.fontSize = '14px';
        details.textContent = `${property.bedrooms || 0} bed, ${property.bathrooms || 0} bath`;
        contentWrapper.appendChild(details);
        
        // Add POI section
        const poiSection = document.createElement('div');
        poiSection.style.marginTop = '10px';
        poiSection.style.borderTop = '1px solid #eee';
        poiSection.style.paddingTop = '10px';
        
        const poiTitle = document.createElement('div');
        poiTitle.style.fontWeight = 'bold';
        poiTitle.style.marginBottom = '5px';
        poiTitle.textContent = 'Find nearby:';
        poiSection.appendChild(poiTitle);
        
        // Create POI buttons - using a simple table for even layout
        const buttonsTable = document.createElement('table');
        buttonsTable.style.width = '100%';
        buttonsTable.style.borderCollapse = 'separate';
        buttonsTable.style.borderSpacing = '4px';
        buttonsTable.id = `poi-buttons-${property.id}`;
        
        // Row 1
        const row1 = document.createElement('tr');
        
        // Restaurant button
        const cell1 = document.createElement('td');
        const restaurantBtn = document.createElement('button');
        restaurantBtn.textContent = 'Restaurants';
        restaurantBtn.style.width = '100%';
        restaurantBtn.style.padding = '6px';
        restaurantBtn.style.borderRadius = '4px';
        restaurantBtn.style.border = '1px solid #ddd';
        restaurantBtn.style.background = '#f5f5f5';
        restaurantBtn.style.fontSize = '12px';
        restaurantBtn.style.cursor = 'pointer';
        restaurantBtn.id = `restaurant-btn-${property.id}`;
        cell1.appendChild(restaurantBtn);
        row1.appendChild(cell1);
        
        // Grocery button
        const cell2 = document.createElement('td');
        const groceryBtn = document.createElement('button');
        groceryBtn.textContent = 'Grocery';
        groceryBtn.style.width = '100%';
        groceryBtn.style.padding = '6px';
        groceryBtn.style.borderRadius = '4px';
        groceryBtn.style.border = '1px solid #ddd';
        groceryBtn.style.background = '#f5f5f5';
        groceryBtn.style.fontSize = '12px';
        groceryBtn.style.cursor = 'pointer';
        groceryBtn.id = `grocery-btn-${property.id}`;
        cell2.appendChild(groceryBtn);
        row1.appendChild(cell2);
        
        buttonsTable.appendChild(row1);
        
        // Row 2
        const row2 = document.createElement('tr');
        
        // Gym button
        const cell3 = document.createElement('td');
        const gymBtn = document.createElement('button');
        gymBtn.textContent = 'Gym';
        gymBtn.style.width = '100%';
        gymBtn.style.padding = '6px';
        gymBtn.style.borderRadius = '4px';
        gymBtn.style.border = '1px solid #ddd';
        gymBtn.style.background = '#f5f5f5';
        gymBtn.style.fontSize = '12px';
        gymBtn.style.cursor = 'pointer';
        gymBtn.id = `gym-btn-${property.id}`;
        cell3.appendChild(gymBtn);
        row2.appendChild(cell3);
        
        // School button
        const cell4 = document.createElement('td');
        const schoolBtn = document.createElement('button');
        schoolBtn.textContent = 'School';
        schoolBtn.style.width = '100%';
        schoolBtn.style.padding = '6px';
        schoolBtn.style.borderRadius = '4px';
        schoolBtn.style.border = '1px solid #ddd';
        schoolBtn.style.background = '#f5f5f5';
        schoolBtn.style.fontSize = '12px';
        schoolBtn.style.cursor = 'pointer';
        schoolBtn.id = `school-btn-${property.id}`;
        cell4.appendChild(schoolBtn);
        row2.appendChild(cell4);
        
        buttonsTable.appendChild(row2);
        
        // Row 3
        const row3 = document.createElement('tr');
        
        // Park button
        const cell5 = document.createElement('td');
        cell5.colSpan = 2;
        const parkBtn = document.createElement('button');
        parkBtn.textContent = 'Parks';
        parkBtn.style.width = '100%';
        parkBtn.style.padding = '6px';
        parkBtn.style.borderRadius = '4px';
        parkBtn.style.border = '1px solid #ddd';
        parkBtn.style.background = '#f5f5f5';
        parkBtn.style.fontSize = '12px';
        parkBtn.style.cursor = 'pointer';
        parkBtn.id = `park-btn-${property.id}`;
        cell5.appendChild(parkBtn);
        row3.appendChild(cell5);
        
        buttonsTable.appendChild(row3);
        
        // Add recent search terms as additional buttons
        if (recentSearchPOIs.length > 0) {
          // Add a separator
          const separatorRow = document.createElement('tr');
          const separatorCell = document.createElement('td');
          separatorCell.colSpan = 2;
          separatorCell.style.paddingTop = '8px';
          separatorCell.style.paddingBottom = '4px';
          
          const separator = document.createElement('div');
          separator.style.borderTop = '1px solid #ddd';
          separator.style.marginBottom = '4px';
          separatorCell.appendChild(separator);
          
          const searchTitle = document.createElement('div');
          searchTitle.style.fontSize = '12px';
          searchTitle.style.fontWeight = 'bold';
          searchTitle.style.color = '#666';
          searchTitle.textContent = 'Your recent searches:';
          separatorCell.appendChild(searchTitle);
          
          separatorRow.appendChild(separatorCell);
          buttonsTable.appendChild(separatorRow);
          
          // Create rows for search terms (2 per row)
          let searchRow: HTMLTableRowElement | null = null;
          let cellIndex = 0;
          
          // Sort by most recent first
          const sortedSearches = [...recentSearchPOIs].sort((a, b) => b.timestamp - a.timestamp);
          
          sortedSearches.forEach((searchItem, index) => {
            if (index % 2 === 0) {
              searchRow = document.createElement('tr');
              buttonsTable.appendChild(searchRow);
              cellIndex = 0;
            }
            
            const searchCell = document.createElement('td');
            const searchBtn = document.createElement('button');
            searchBtn.textContent = searchItem.term;
            searchBtn.style.width = '100%';
            searchBtn.style.padding = '6px';
            searchBtn.style.borderRadius = '4px';
            searchBtn.style.border = '1px solid #dbd'; 
            searchBtn.style.background = '#f0f7ff'; // Light blue for search terms
            searchBtn.style.fontSize = '12px';
            searchBtn.style.cursor = 'pointer';
            searchBtn.id = `search-btn-${property.id}-${index}`;
            
            // Add data attributes
            searchBtn.setAttribute('data-property-id', property.id.toString());
            searchBtn.setAttribute('data-poi-type', 'search_term');
            searchBtn.setAttribute('data-search-term', searchItem.term);
            searchBtn.classList.add('poi-button');
            
            searchCell.appendChild(searchBtn);
            if (searchRow) {
              searchRow.appendChild(searchCell);
            }
            
            cellIndex++;
          });
          
          // If we have an odd number and ended with only one cell in the row,
          // add an empty cell to balance the layout
          if (cellIndex === 1) { 
            // Explicitly type searchRow here as HTMLTableRowElement to avoid the error
            const currentRow: HTMLTableRowElement | null = searchRow;
            if (currentRow) {
              const emptyCell = document.createElement('td');
              currentRow.appendChild(emptyCell);
            }
          }
        }
        
        // Add data attributes to store the property ID and POI type
        restaurantBtn.setAttribute('data-property-id', property.id.toString());
        restaurantBtn.setAttribute('data-poi-type', 'restaurant');
        restaurantBtn.classList.add('poi-button');
        
        groceryBtn.setAttribute('data-property-id', property.id.toString());
        groceryBtn.setAttribute('data-poi-type', 'grocery_or_supermarket'); 
        groceryBtn.classList.add('poi-button');
        
        gymBtn.setAttribute('data-property-id', property.id.toString());
        gymBtn.setAttribute('data-poi-type', 'gym');
        gymBtn.classList.add('poi-button');
        
        schoolBtn.setAttribute('data-property-id', property.id.toString());
        schoolBtn.setAttribute('data-poi-type', 'school');
        schoolBtn.classList.add('poi-button');
        
        parkBtn.setAttribute('data-property-id', property.id.toString());
        parkBtn.setAttribute('data-poi-type', 'park');
        parkBtn.classList.add('poi-button');
        
        // Use DOM events instead of direct button click handlers
        const handlePOIButtonClick = (e: Event) => {
          const button = e.currentTarget as HTMLElement;
          const propertyId = parseInt(button.getAttribute('data-property-id') || '0', 10);
          const poiType = button.getAttribute('data-poi-type') || '';
          
          console.log(`Button clicked: ${poiType} for property ${propertyId}`);
          
          // Find the property
          const property = properties.find(p => p.id === propertyId);
          if (!property) {
            console.error(`Property ${propertyId} not found`);
            return;
          }
          
          // If this is a search term button, get the search term and use text search
          if (poiType === 'search_term') {
            const searchTerm = button.getAttribute('data-search-term') || '';
            console.log(`Searching for term: ${searchTerm} near property ${propertyId}`);
            
            // Create a custom type for the search term
            const searchTermType = `search:${searchTerm}`;
            const resultsContainer = document.getElementById(`poi-results-${property.id}`);
            if (resultsContainer) {
              resultsContainer.innerHTML = `<p style="margin: 0; color: #666;">Searching for "${searchTerm}"...</p>`;
            }
            
            // Use textSearch instead of nearbySearch for search terms
            if (googleMap && property.latitude && property.longitude) {
              try {
                const propertyLocation = new google.maps.LatLng(property.latitude, property.longitude);
                const searchService = new google.maps.places.PlacesService(googleMap);
                
                searchService.textSearch({
                  query: searchTerm,
                  location: propertyLocation,
                  radius: 2000 // 2km
                }, (results, status) => {
                  if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                    // Now process these results similarly to nearbySearch
                    // We'll use a special "search_result" type for these markers
                    handleSearchResults(property, searchTerm, results);
                  } else {
                    if (resultsContainer) {
                      resultsContainer.innerHTML = `<p style="margin: 0; color: #c00;">No "${searchTerm}" found nearby</p>`;
                    }
                  }
                });
              } catch (error) {
                console.error("Error during text search:", error);
                if (resultsContainer) {
                  resultsContainer.innerHTML = `<p style="margin: 0; color: #c00;">Error searching for "${searchTerm}"</p>`;
                }
              }
            }
          } else {
            // Call the standard POI search function for regular POI types
            searchNearbyPOIs(property, poiType);
          }
        };
        
        // Add event listeners
        restaurantBtn.addEventListener('click', handlePOIButtonClick);
        groceryBtn.addEventListener('click', handlePOIButtonClick);
        gymBtn.addEventListener('click', handlePOIButtonClick);
        schoolBtn.addEventListener('click', handlePOIButtonClick);
        parkBtn.addEventListener('click', handlePOIButtonClick);
        
        // Add event listeners to search term buttons
        if (recentSearchPOIs.length > 0) {
          // Wait for buttons to be rendered
          setTimeout(() => {
            const searchButtons = document.querySelectorAll(`[id^="search-btn-${property.id}"]`);
            searchButtons.forEach(btn => {
              btn.addEventListener('click', handlePOIButtonClick);
            });
          }, 100);
        }
        
        poiSection.appendChild(buttonsTable);
        
        // Create results container
        const resultsContainer = document.createElement('div');
        resultsContainer.id = `poi-results-${property.id}`;
        resultsContainer.style.fontSize = '12px';
        resultsContainer.style.maxHeight = '100px';
        resultsContainer.style.overflowY = 'auto';
        
        const placeholderText = document.createElement('p');
        placeholderText.style.margin = '0';
        placeholderText.style.color = '#666';
        placeholderText.textContent = 'Click a category to find nearby places';
        resultsContainer.appendChild(placeholderText);
        
        poiSection.appendChild(resultsContainer);
        contentWrapper.appendChild(poiSection);
        
        // Add the content to the info window
        customInfoWindow.appendChild(contentWrapper);
        
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
  
  // Function to handle search term results
  const handleSearchResults = (property: Property, searchTerm: string, results: google.maps.places.PlaceResult[]) => {
    if (!googleMap || !property.latitude || !property.longitude) {
      console.error("Cannot process search results - missing map or property location");
      return;
    }
    
    const currentMap = googleMap;
    const resultsContainer = document.getElementById(`poi-results-${property.id}`);
    
    // Custom type for the search results to differentiate them
    const customType = `search:${searchTerm}`;
    
    // Clear any existing POIs with this search term
    setPois(prevPois => {
      prevPois
        .filter(poi => poi.type === customType)
        .forEach(poi => {
          if (poi.marker) {
            poi.marker.setMap(null);
          }
        });
      
      return prevPois.filter(poi => poi.type !== customType);
    });
    
    // Clear routes for this search term
    setRoutes(prevRoutes => {
      // Find which POIs have this type
      const poiIdsToRemove = new Set<string>();
      pois.forEach(poi => {
        if (poi.type === customType) {
          poiIdsToRemove.add(poi.placeId);
        }
      });
      
      // Remove routes
      prevRoutes
        .filter(route => poiIdsToRemove.has(route.destination))
        .forEach(route => {
          if (route.route) {
            route.route.setMap(null);
          }
          if (route.polyline) {
            route.polyline.setMap(null);
          }
        });
      
      return prevRoutes.filter(route => !poiIdsToRemove.has(route.destination));
    });
    
    // Get top 3 results
    const topResults = results.slice(0, 3);
    
    if (topResults.length === 0) {
      if (resultsContainer) {
        resultsContainer.innerHTML = `<p style="margin: 0; color: #c00;">No "${searchTerm}" found nearby</p>`;
      }
      return;
    }
    
    // Create POI markers - use a unique style for search results
    const newPOIs: POI[] = [];
    let resultsHTML = '';
    
    topResults.forEach((place, index) => {
      if (place.geometry && place.geometry.location) {
        // Create POI object
        const poi: POI = {
          name: place.name || `${searchTerm} ${index + 1}`,
          location: place.geometry.location,
          address: place.formatted_address || '',
          placeId: place.place_id || '',
          type: customType // Use our custom type
        };
        
        // Create a unique marker for search results - pink dot 
        const marker = new google.maps.Marker({
          position: place.geometry.location,
          map: currentMap,
          title: place.name,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png',
            scaledSize: new google.maps.Size(28, 28)
          }
        });
        
        // Create info window with search term attribution
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 5px; max-width: 200px;">
              <div style="font-size: 10px; color: #666; margin-bottom: 4px;">
                <i>Search result for "${searchTerm}"</i>
              </div>
              <h3 style="margin: 0; font-size: 14px; margin-bottom: 3px;">${place.name}</h3>
              <p style="margin: 0; font-size: 12px; margin-bottom: 3px;">${place.formatted_address || ''}</p>
              <p style="margin: 0; font-size: 12px;">Rating: ${place.rating ? `${place.rating} ⭐` : 'N/A'}</p>
              <p style="margin: 0; font-size: 12px; margin-top: 5px; font-style: italic;">Click for route details</p>
            </div>
          `
        });
        
        // Add click listener to marker
        marker.addListener('click', () => {
          // Close any open info window
          if (activeInfoWindow && activeInfoWindow !== infoWindow) {
            activeInfoWindow.close();
          }
          
          // Open this info window
          infoWindow.open(currentMap, marker);
          setActiveInfoWindow(infoWindow);
          
          // Calculate route to this POI
          calculateRoute(property, poi);
        });
        
        // Store marker with POI
        poi.marker = marker;
        newPOIs.push(poi);
        
        // Add to results HTML
        resultsHTML += `
          <div style="padding: 4px 0; border-bottom: 1px solid #eee; cursor: pointer; background-color: #fef6ff;" class="poi-result" data-place-id="${place.place_id}">
            <div style="font-weight: bold;">${place.name}</div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 11px">${place.formatted_address?.substring(0, 25) || ''}${place.formatted_address && place.formatted_address.length > 25 ? '...' : ''}</span>
              <span>${place.rating ? `${place.rating} ⭐` : ''}</span>
            </div>
            <div style="margin-top: 4px; font-size: 11px; color: #666;" id="route-${place.place_id}">
              Calculating route...
            </div>
          </div>
        `;
      }
    });
    
    // Update state with new POIs
    setPois(prevPois => [...prevPois, ...newPOIs]);
    
    // If there are POIs found, automatically calculate route to the closest one
    if (newPOIs.length > 0) {
      // Calculate route to the first POI immediately
      calculateRoute(property, newPOIs[0]);
      
      // Then calculate routes to all POIs to show distances
      newPOIs.forEach(poi => {
        calculateRouteDistanceOnly(property, poi);
      });
    }
    
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
      }
    }
    
    // Increment the search term's count and update timestamp in recentSearchPOIs
    const existingIndex = recentSearchPOIs.findIndex(item => item.term.toLowerCase() === searchTerm.toLowerCase());
    if (existingIndex >= 0) {
      // Update existing search term
      recentSearchPOIs[existingIndex] = {
        ...recentSearchPOIs[existingIndex],
        count: recentSearchPOIs[existingIndex].count + 1,
        timestamp: Date.now()
      };
    } else {
      // Add new search term if not found and limit to 10 items
      recentSearchPOIs.push({
        term: searchTerm,
        count: 1,
        timestamp: Date.now()
      });
      
      // Keep only 10 most recent
      if (recentSearchPOIs.length > 10) {
        // Sort by timestamp and remove oldest
        recentSearchPOIs.sort((a, b) => b.timestamp - a.timestamp);
        recentSearchPOIs.pop();
      }
    }
  };
  
  // Function to search for POIs near a property
  const searchNearbyPOIs = async (property: Property, poiType: string) => {
    // Debug to see what's happening
    console.log("Searching for POIs with:", { 
      hasMap: !!googleMap,
      hasLatitude: !!property.latitude, 
      hasLongitude: !!property.longitude 
    });
    
    // We need to check coordinates and map
    if (!googleMap || !property.latitude || !property.longitude) {
      console.error("Cannot search POIs - missing map or property location");
      return;
    }
    
    // Get the current map - we'll use this for markers
    const currentMap = googleMap;
    
    console.log(`Searching for ${poiType} near property ${property.id}`);
    
    // Keep existing POIs but clear markers of this type
    setPois(prevPois => {
      // Only remove markers of the same type to allow multiple POI types on the map
      prevPois
        .filter(poi => poi.type === poiType)
        .forEach(poi => {
          if (poi.marker) {
            poi.marker.setMap(null);
          }
        });
      
      // Keep all POIs except those of the current type that we're replacing
      return prevPois.filter(poi => poi.type !== poiType);
    });
    
    // Clear existing routes that go to POIs of this type
    setRoutes(prevRoutes => {
      // Find which POIs have this type
      const poiIdsToRemove = new Set<string>();
      pois.forEach(poi => {
        if (poi.type === poiType) {
          poiIdsToRemove.add(poi.placeId);
        }
      });
      
      // Remove routes that go to those POIs
      prevRoutes
        .filter(route => poiIdsToRemove.has(route.destination))
        .forEach(route => {
          if (route.route) {
            route.route.setMap(null);
          }
          if (route.polyline) {
            route.polyline.setMap(null);
          }
        });
      
      // Return filtered routes
      return prevRoutes.filter(route => !poiIdsToRemove.has(route.destination));
    });
    
    try {
      setSearchingPOIs(true);
      
      // Update the results container to show loading
      const resultsContainer = document.getElementById(`poi-results-${property.id}`);
      if (resultsContainer) {
        resultsContainer.innerHTML = '<p style="margin: 0; color: #666;">Searching nearby...</p>';
      }
      
      const propertyLocation = new google.maps.LatLng(property.latitude, property.longitude);
      
      // Create a new places service directly from current map every time
      // This ensures we're working with a fresh service
      if (!googleMap) {
        console.error("Map isn't available");
        if (resultsContainer) {
          resultsContainer.innerHTML = `<p style="margin: 0; color: #c00;">Error: Map not available</p>`;
        }
        setSearchingPOIs(false);
        return;
      }
      
      // Always create a new service that we know will work with the current map
      const activeService = new google.maps.places.PlacesService(googleMap);
      console.log("Created a fresh Places service");
      
      // Perform a nearby search with specific error handling
      console.log("Starting nearby search");
      activeService.nearbySearch(
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
                
                // Create marker for POI with different colors for each type
                const getMarkerColor = (type: string) => {
                  const colorMap: Record<string, string> = {
                    restaurant: 'red-dot.png',
                    grocery_or_supermarket: 'green-dot.png',
                    gym: 'orange-dot.png',
                    school: 'purple-dot.png',
                    park: 'yellow-dot.png'
                  };
                  return colorMap[type] || 'blue-dot.png';
                };
                
                const marker = new google.maps.Marker({
                  position: place.geometry.location,
                  map: currentMap,
                  title: place.name,
                  icon: {
                    url: `https://maps.google.com/mapfiles/ms/icons/${getMarkerColor(poiType)}`,
                    scaledSize: new google.maps.Size(28, 28)
                  }
                });
                
                // Create info window for POI
                const infoWindow = new google.maps.InfoWindow({
                  content: `
                    <div style="padding: 5px; max-width: 200px;">
                      <h3 style="margin: 0; font-size: 14px; margin-bottom: 3px;">${place.name}</h3>
                      <p style="margin: 0; font-size: 12px; margin-bottom: 3px;">${place.vicinity || ''}</p>
                      <p style="margin: 0; font-size: 12px;">Rating: ${place.rating ? `${place.rating} ⭐` : 'N/A'}</p>
                      <p style="margin: 0; font-size: 12px; margin-top: 5px; font-style: italic;">Click for route details</p>
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
                  infoWindow.open(currentMap, marker);
                  setActiveInfoWindow(infoWindow);
                  
                  // Calculate route to this POI
                  calculateRoute(property, poi);
                });
                
                // Store marker with POI
                poi.marker = marker;
                newPOIs.push(poi);
                
                // Add to results HTML with distance that will be updated
                resultsHTML += `
                  <div style="padding: 4px 0; border-bottom: 1px solid #eee; cursor: pointer;" class="poi-result" data-place-id="${place.place_id}">
                    <div style="font-weight: bold;">${place.name}</div>
                    <div style="display: flex; justify-content: space-between;">
                      <span>${place.vicinity || ''}</span>
                      <span>${place.rating ? `${place.rating} ⭐` : ''}</span>
                    </div>
                    <div style="margin-top: 4px; font-size: 11px; color: #666;" id="route-${place.place_id}">
                      Calculating route...
                    </div>
                  </div>
                `;
              }
            });
            
            // Update state with new POIs
            setPois(prevPois => [...prevPois, ...newPOIs]);
            
            // If there are POIs found, automatically calculate route to the closest one
            if (newPOIs.length > 0) {
              // Calculate route to the first POI immediately
              calculateRoute(property, newPOIs[0]);
              
              // Then calculate routes to all POIs to show distances
              newPOIs.forEach(poi => {
                calculateRouteDistanceOnly(property, poi);
              });
            }
            
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
  
  // These route calculation functions were moved to the top of the component 
  // to fix TypeScript errors with function hoisting
  
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