import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useGoogleMaps, type ListingWithPOIs, type POI } from '@/hooks/use-google-maps';
import { Property } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';

import Navigation from '@/components/layout/Navigation';
import MobileNavigation from '@/components/layout/MobileNavigation';
import Sidebar from '@/components/layout/Sidebar';
import RentalTabs from '@/components/layout/RentalTabs';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import { 
  MapPin, Search, Dumbbell, ShoppingBag, School, Coffee, Bus, 
  Utensils, RefreshCw, Eye, EyeOff, Info
} from 'lucide-react';

interface UserPreferences {
  id: number;
  userId: number;
  gym?: string; 
  grocery?: string;
  poiTypes?: string[];
}

// Convert a Property to a ListingWithPOIs
function propertyToListing(property: Property): ListingWithPOIs {
  // Get latitude and longitude from geocoded address if needed
  // In a real application, these would likely be stored with the property
  // For now, we'll add mock coordinates for NYC area if they don't exist
  const getRandomCoord = (base: number, range: number) => base + (Math.random() * range - range/2);
  
  return {
    id: property.id,
    address: property.address,
    lat: 40.7128 + getRandomCoord(40.7128, 0.1), // Mock NYC coordinates
    lon: -74.0060 + getRandomCoord(-74.0060, 0.1), // Mock NYC coordinates
    price: property.rent,
    beds: property.bedrooms,
    baths: property.bathrooms,
    sqft: property.squareFeet
  };
}

export default function NearbyPage() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const {
    mapState,
    displayMode,
    initializeMap,
    addListingMarkers,
    toggleDisplayMode,
    clearGymAndGroceryMarkers,
    clearRoutes,
  } = useGoogleMaps();

  // Local state
  const [gymName, setGymName] = useState('');
  const [groceryName, setGroceryName] = useState('');
  const [selectedPoiTypes, setSelectedPoiTypes] = useState<string[]>([]);
  const [listingsWithPOIs, setListingsWithPOIs] = useState<ListingWithPOIs[]>([]);
  
  // Fetch properties
  const { data: properties, isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    enabled: !!user,
  });

  // Fetch user preferences
  const { data: preferences, isLoading: isLoadingPreferences } = useQuery<UserPreferences>({
    queryKey: ['/api/user/preferences'],
    enabled: !!user,
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      const res = await apiRequest('POST', '/api/user/preferences', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
    }
  });

  // Fetch nearby places mutation
  const fetchNearbyPlacesMutation = useMutation({
    mutationFn: async ({ 
      lat, 
      lng, 
      type, 
      name 
    }: { 
      lat: number; 
      lng: number; 
      type: string; 
      name?: string; 
    }) => {
      const res = await apiRequest('POST', '/api/nearby-places', {
        lat,
        lng,
        type,
        name,
        radius: 5000 // 5km radius
      });
      return res.json();
    }
  });

  // Initialize map when component mounts
  useEffect(() => {
    if (mapContainerRef.current && !mapState.map) {
      initializeMap(mapContainerRef.current);
    }
  }, [initializeMap, mapState.map]);

  // Update local state when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setGymName(preferences.gym || '');
      setGroceryName(preferences.grocery || '');
      setSelectedPoiTypes(preferences.poiTypes || []);
    }
  }, [preferences]);

  // Add markers when properties are loaded
  useEffect(() => {
    if (properties && properties.length > 0 && mapState.map) {
      const listings = properties.map(propertyToListing);
      setListingsWithPOIs(listings);
      addListingMarkers(listings);
    }
  }, [properties, mapState.map, addListingMarkers]);

  // Save user preferences
  const savePreferences = async () => {
    await updatePreferencesMutation.mutateAsync({
      gym: gymName,
      grocery: groceryName,
      poiTypes: selectedPoiTypes
    });

    // After saving preferences, update POI data
    await updatePOIData();
  };

  // Update POI data for all listings
  const updatePOIData = async () => {
    if (!properties || !mapState.map) return;
    
    // Clear existing POIs before adding new ones
    clearGymAndGroceryMarkers();
    clearRoutes();
    
    const updatedListings: ListingWithPOIs[] = [];
    
    // Process each property
    for (const property of properties) {
      if (!property.latitude || !property.longitude) continue;
      
      const listing = propertyToListing(property);
      
      // Fetch nearest gym if requested
      if (gymName) {
        try {
          const gymResult = await fetchNearbyPlacesMutation.mutateAsync({
            lat: property.latitude,
            lng: property.longitude,
            type: 'gym',
            name: gymName
          });
          
          if (gymResult.places && gymResult.places.length > 0) {
            const nearestGym = gymResult.places[0];
            listing.nearestGym = {
              name: nearestGym.name,
              lat: nearestGym.lat,
              lon: nearestGym.lng,
              distance: nearestGym.distance,
              rating: nearestGym.rating
            };
          }
        } catch (error) {
          console.error('Failed to fetch gym data:', error);
        }
      }
      
      // Fetch nearest grocery if requested
      if (groceryName) {
        try {
          const groceryResult = await fetchNearbyPlacesMutation.mutateAsync({
            lat: property.latitude,
            lng: property.longitude,
            type: 'grocery',
            name: groceryName
          });
          
          if (groceryResult.places && groceryResult.places.length > 0) {
            const nearestGrocery = groceryResult.places[0];
            listing.nearestGrocery = {
              name: nearestGrocery.name,
              lat: nearestGrocery.lat,
              lon: nearestGrocery.lng,
              distance: nearestGrocery.distance,
              rating: nearestGrocery.rating
            };
          }
        } catch (error) {
          console.error('Failed to fetch grocery data:', error);
        }
      }
      
      // Fetch other POIs if requested
      if (selectedPoiTypes.length > 0) {
        listing.nearestPOIs = {};
        
        for (const poiType of selectedPoiTypes) {
          try {
            const poiResult = await fetchNearbyPlacesMutation.mutateAsync({
              lat: property.latitude,
              lng: property.longitude,
              type: poiType.toLowerCase()
            });
            
            if (poiResult.places && poiResult.places.length > 0) {
              const nearestPOI = poiResult.places[0];
              listing.nearestPOIs[poiType] = {
                name: nearestPOI.name,
                lat: nearestPOI.lat,
                lon: nearestPOI.lng,
                distance: nearestPOI.distance,
                rating: nearestPOI.rating
              };
            }
          } catch (error) {
            console.error(`Failed to fetch ${poiType} data:`, error);
          }
        }
      }
      
      updatedListings.push(listing);
    }
    
    setListingsWithPOIs(updatedListings);
    addListingMarkers(updatedListings);
  };

  // Toggle POI type selection
  const togglePoiType = (poiType: string) => {
    setSelectedPoiTypes(prev => {
      if (prev.includes(poiType)) {
        return prev.filter(type => type !== poiType);
      } else {
        return [...prev, poiType];
      }
    });
  };

  // Loading state
  if (isLoadingAuth || isLoadingProperties || isLoadingPreferences || mapState.isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 lg:pl-64 pb-16 md:pb-0">
            <div className="container mx-auto px-4 py-6">
              <Skeleton className="h-10 w-60 mb-6" />
              <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-[400px] w-full" />
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </div>
          </main>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 lg:pl-64 pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-6">
            
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-heading font-bold text-text-dark">Explore Nearby Amenities</h1>
              <p className="text-text-medium mt-2">
                Find properties close to the places that matter to you
              </p>
            </div>

            {/* Content Tabs */}
            <RentalTabs />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Map container */}
              <div className="lg:col-span-2">
                <div 
                  ref={mapContainerRef} 
                  className="w-full h-[500px] rounded-lg border overflow-hidden"
                ></div>
                
                {/* Display mode toggle */}
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toggleDisplayMode(listingsWithPOIs)}
                    className="flex items-center gap-2"
                  >
                    {displayMode === "onClick" ? (
                      <>
                        <Eye className="h-4 w-4" />
                        <span>Show All POIs</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4" />
                        <span>Show POIs On Click</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Preferences Panel */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Your Preferences</CardTitle>
                    <CardDescription>
                      Customize what matters to you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="gym">Favorite Gym</Label>
                      <Input
                        id="gym"
                        placeholder="e.g., Planet Fitness, Equinox"
                        value={gymName}
                        onChange={(e) => setGymName(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="grocery">Favorite Grocery Store</Label>
                      <Input
                        id="grocery"
                        placeholder="e.g., Whole Foods, Trader Joe's"
                        value={groceryName}
                        onChange={(e) => setGroceryName(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2">
                      <Label>Points of Interest</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="cafes" 
                            checked={selectedPoiTypes.includes('Cafes')}
                            onCheckedChange={() => togglePoiType('Cafes')}
                          />
                          <Label htmlFor="cafes" className="flex items-center gap-1">
                            <Coffee className="h-4 w-4" /> Cafes
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="transport" 
                            checked={selectedPoiTypes.includes('Public Transport')}
                            onCheckedChange={() => togglePoiType('Public Transport')}
                          />
                          <Label htmlFor="transport" className="flex items-center gap-1">
                            <Bus className="h-4 w-4" /> Transit
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="schools" 
                            checked={selectedPoiTypes.includes('Schools')}
                            onCheckedChange={() => togglePoiType('Schools')}
                          />
                          <Label htmlFor="schools" className="flex items-center gap-1">
                            <School className="h-4 w-4" /> Schools
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="restaurants" 
                            checked={selectedPoiTypes.includes('Restaurants')}
                            onCheckedChange={() => togglePoiType('Restaurants')}
                          />
                          <Label htmlFor="restaurants" className="flex items-center gap-1">
                            <Utensils className="h-4 w-4" /> Restaurants
                          </Label>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={savePreferences} 
                      className="w-full mt-6"
                      disabled={updatePreferencesMutation.isPending}
                    >
                      {updatePreferencesMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Save & Update Map'
                      )}
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Info card explaining the feature */}
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      How It Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-2 text-text-medium text-sm">
                      <li>Enter your favorite places to see how close properties are to them</li>
                      <li>Toggle points of interest you care about</li>
                      <li>Click on properties to see walking routes and travel times</li>
                      <li>Use "Show All POIs" to display everything at once</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Comparison Table - shown if any listings have POI data */}
            {listingsWithPOIs.some(listing => 
              listing.nearestGym || listing.nearestGrocery || (listing.nearestPOIs && Object.keys(listing.nearestPOIs).length > 0)
            ) && (
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Proximity Comparison</CardTitle>
                    <CardDescription>
                      Compare distances to your preferred amenities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted">
                            <th className="p-2 text-left">Property</th>
                            <th className="p-2 text-left">Price</th>
                            {gymName && <th className="p-2 text-left">Nearest {gymName}</th>}
                            {groceryName && <th className="p-2 text-left">Nearest {groceryName}</th>}
                            {selectedPoiTypes.map(poiType => (
                              <th key={poiType} className="p-2 text-left">Nearest {poiType}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {listingsWithPOIs.map(listing => (
                            <tr key={listing.id} className="border-b hover:bg-muted/50">
                              <td className="p-2 font-medium">{listing.address}</td>
                              <td className="p-2">${listing.price?.toLocaleString()}</td>
                              {gymName && (
                                <td className="p-2">
                                  {listing.nearestGym ? (
                                    <div className="flex flex-col">
                                      <span>{listing.nearestGym.name}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {listing.nearestGym.distance}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">Not found</span>
                                  )}
                                </td>
                              )}
                              {groceryName && (
                                <td className="p-2">
                                  {listing.nearestGrocery ? (
                                    <div className="flex flex-col">
                                      <span>{listing.nearestGrocery.name}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {listing.nearestGrocery.distance}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">Not found</span>
                                  )}
                                </td>
                              )}
                              {selectedPoiTypes.map(poiType => (
                                <td key={`${listing.id}-${poiType}`} className="p-2">
                                  {listing.nearestPOIs?.[poiType] ? (
                                    <div className="flex flex-col">
                                      <span>{listing.nearestPOIs[poiType].name}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {listing.nearestPOIs[poiType].distance}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">Not found</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}