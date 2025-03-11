import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Property } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, MapPin, Home, DollarSign, Droplets, Zap, Fan, Wifi, Utensils, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

export default function ComparePage() {
  const [, setLocation] = useLocation();
  const [propertyIds, setPropertyIds] = useState<number[]>([]);
  const [propertiesData, setPropertiesData] = useState<Property[]>([]);
  
  // Get property IDs from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const ids = searchParams.get('ids')?.split(',').map(id => parseInt(id, 10)) || [];
    setPropertyIds(ids);
  }, []);
  
  // Fetch properties data based on the IDs
  const { data: properties, isLoading } = useQuery({
    queryKey: ['/api/properties', propertyIds],
    queryFn: async () => {
      if (propertyIds.length === 0) return [];
      const responses = await Promise.all(
        propertyIds.map(id => 
          fetch(`/api/properties/${id}`).then(res => res.json())
        )
      );
      return responses;
    },
    enabled: propertyIds.length > 0
  });
  
  useEffect(() => {
    if (properties) {
      setPropertiesData(properties);
    }
  }, [properties]);
  
  // Helper function to render amenity status
  const renderAmenityStatus = (property: Property, amenity: string) => {
    const hasAmenity = property.amenities?.some(a => 
      a.toLowerCase().includes(amenity.toLowerCase())
    );
    
    return hasAmenity ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }
  
  if (propertyIds.length === 0 || propertiesData.length === 0) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-4">Property Comparison</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Properties Selected</h2>
              <p className="text-muted-foreground mb-6">
                Please select properties to compare from the search or saved properties page.
              </p>
              <Button onClick={() => setLocation('/search')}>
                Go to Search
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Compare Properties</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation('/search')}>
            Back to Search
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
          <TabsTrigger value="neighborhood">Neighborhood</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {propertiesData.map((property) => (
              <Card key={property.id} className="overflow-hidden">
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={property.images?.[0]?.replace(/^'/, '').replace(/'$/, '') || '/placeholder-property.jpg'}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{property.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {property.neighborhood}, {property.city}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-lg font-semibold">
                        ${property.rent.toLocaleString()}
                      </Badge>
                      <span className="text-muted-foreground text-sm">/month</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        <span>{property.bedrooms || 'Studio'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplets className="h-4 w-4" />
                        <span>{property.bathrooms}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {property.description}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link href={`/properties/${property.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4">Feature</TableHead>
                  {propertiesData.map(property => (
                    <TableHead key={property.id}>{property.title}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Price</TableCell>
                  {propertiesData.map(property => (
                    <TableCell key={property.id}>${property.rent}/month</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Bedrooms</TableCell>
                  {propertiesData.map(property => (
                    <TableCell key={property.id}>{property.bedrooms || 'Studio'}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Bathrooms</TableCell>
                  {propertiesData.map(property => (
                    <TableCell key={property.id}>{property.bathrooms}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Square Feet</TableCell>
                  {propertiesData.map(property => (
                    <TableCell key={property.id}>{property.squareFeet || 'N/A'}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Property Type</TableCell>
                  {propertiesData.map(property => (
                    <TableCell key={property.id}>{property.propertyType}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Available Date</TableCell>
                  {propertiesData.map(property => (
                    <TableCell key={property.id}>
                      {new Date(property.availableDate).toLocaleDateString()}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Pet Friendly</TableCell>
                  {propertiesData.map(property => (
                    <TableCell key={property.id}>
                      {property.petFriendly ? 
                        <CheckCircle className="h-5 w-5 text-green-500" /> : 
                        <XCircle className="h-5 w-5 text-red-500" />}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        
        {/* Amenities Tab */}
        <TabsContent value="amenities">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4">Amenity</TableHead>
                  {propertiesData.map(property => (
                    <TableHead key={property.id}>{property.title}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Dishwasher</TableCell>
                  {propertiesData.map(property => (
                    <TableCell key={property.id}>
                      {renderAmenityStatus(property, 'dishwasher')}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">In-Unit Laundry</TableCell>
                  {propertiesData.map(property => (
                    <TableCell key={property.id}>
                      {renderAmenityStatus(property, 'laundry')}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Doorman</TableCell>
                  {propertiesData.map(property => (
                    <TableCell key={property.id}>
                      {renderAmenityStatus(property, 'doorman')}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Air Conditioning</TableCell>
                  {propertiesData.map(property => (
                    <TableCell key={property.id}>
                      {renderAmenityStatus(property, 'air conditioning') || 
                       renderAmenityStatus(property, 'ac') || 
                       renderAmenityStatus(property, 'central ac')}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Parking</TableCell>
                  {propertiesData.map(property => (
                    <TableCell key={property.id}>
                      {renderAmenityStatus(property, 'parking')}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Gym</TableCell>
                  {propertiesData.map(property => (
                    <TableCell key={property.id}>
                      {renderAmenityStatus(property, 'gym') || 
                       renderAmenityStatus(property, 'fitness')}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Pool</TableCell>
                  {propertiesData.map(property => (
                    <TableCell key={property.id}>
                      {renderAmenityStatus(property, 'pool')}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Roof Deck</TableCell>
                  {propertiesData.map(property => (
                    <TableCell key={property.id}>
                      {renderAmenityStatus(property, 'roof') || 
                       renderAmenityStatus(property, 'deck')}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        
        {/* Neighborhood Tab */}
        <TabsContent value="neighborhood">
          <div className="grid grid-cols-1 gap-6">
            {propertiesData.map((property) => (
              <Card key={property.id}>
                <CardHeader>
                  <CardTitle>{property.title}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {property.address}, {property.neighborhood}, {property.city}, {property.state} {property.zipCode}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <h3 className="font-semibold">Nearby Points of Interest</h3>
                      </div>
                      <Separator />
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Utensils className="h-4 w-4 text-muted-foreground" />
                          <span>Restaurants</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wifi className="h-4 w-4 text-muted-foreground" />
                          <span>Cafés</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Fan className="h-4 w-4 text-muted-foreground" />
                          <span>Parks</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold">Transportation</h3>
                      </div>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        Check Google Maps integration for detailed transit information near {property.address}.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        <h3 className="font-semibold">Neighborhood Facts</h3>
                      </div>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        {property.neighborhood} is known for its {
                          ['vibrant atmosphere', 'quiet streets', 'family-friendly environment', 'cultural attractions'][property.id % 4]
                        }.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}