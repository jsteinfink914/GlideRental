import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navigation from "@/components/layout/Navigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPropertySchema, Property } from "@shared/schema";

export default function LeasingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("active");
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch landlord's properties
  const { data: properties, isLoading } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      // In a real app, this would filter properties by landlordId
      const response = await fetch('/api/properties');
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return response.json();
    }
  });

  // Create property form schema
  const propertyFormSchema = z.object({
    title: z.string().min(1, "Property title is required"),
    description: z.string().min(1, "Description is required"),
    address: z.string().min(1, "Address is required"),
    neighborhood: z.string().min(1, "Neighborhood is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(1, "ZIP code is required"),
    rent: z.preprocess(
      (val) => (val === "" ? undefined : Number(val)),
      z.number().min(1, "Rent amount is required")
    ),
    bedrooms: z.preprocess(
      (val) => (val === "" ? undefined : Number(val)),
      z.number().min(0, "Bedrooms must be 0 or higher")
    ),
    bathrooms: z.preprocess(
      (val) => (val === "" ? undefined : Number(val)),
      z.number().min(0.5, "Bathrooms must be 0.5 or higher")
    ),
    squareFeet: z.preprocess(
      (val) => (val === "" ? undefined : Number(val)),
      z.number().optional()
    ),
    propertyType: z.string().min(1, "Property type is required"),
    availableDate: z.string().min(1, "Available date is required"),
    isPublished: z.boolean().default(true),
    hasVirtualTour: z.boolean().default(false),
    hasDoorman: z.boolean().default(false),
    hasInUnitLaundry: z.boolean().default(false),
    hasDishwasher: z.boolean().default(false),
    petFriendly: z.boolean().default(false),
    noFee: z.boolean().default(false),
    images: z.array(z.string()).min(1, "At least one image is required"),
    amenities: z.array(z.string()).min(1, "At least one amenity is required")
  });

  type PropertyFormValues = z.infer<typeof propertyFormSchema>;

  // Property form
  const propertyForm = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      title: "",
      description: "",
      address: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      rent: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      squareFeet: undefined,
      propertyType: "",
      availableDate: new Date().toISOString().split('T')[0],
      isPublished: true,
      hasVirtualTour: false,
      hasDoorman: false,
      hasInUnitLaundry: false,
      hasDishwasher: false,
      petFriendly: false,
      noFee: false,
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"],
      amenities: []
    }
  });

  // Create property mutation
  const createPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormValues) => {
      if (!user) throw new Error("User not authenticated");
      
      // Add landlord ID
      const propertyData = {
        ...data,
        landlordId: user.id
      };
      
      const res = await apiRequest("POST", "/api/properties", propertyData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Property created",
        description: "Your property has been created successfully."
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      propertyForm.reset();
      setIsAddPropertyOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create property",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onPropertySubmit = (data: PropertyFormValues) => {
    createPropertyMutation.mutate(data);
  };

  // Property publish/unpublish mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: number, isPublished: boolean }) => {
      const res = await apiRequest("PUT", `/api/properties/${id}`, {
        isPublished
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: "Property updated",
        description: "The property status has been updated."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleTogglePublish = (id: number, currentStatus: boolean) => {
    togglePublishMutation.mutate({ id, isPublished: !currentStatus });
  };

  // Property delete mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: "Property deleted",
        description: "The property has been deleted."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filter properties based on tab and search term
  const filterProperties = (status: boolean) => {
    if (!properties) return [];
    
    return properties
      .filter((property: Property) => property.isPublished === status)
      .filter((property: Property) => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        return (
          property.title.toLowerCase().includes(searchLower) ||
          property.address.toLowerCase().includes(searchLower) ||
          property.neighborhood.toLowerCase().includes(searchLower) ||
          property.city.toLowerCase().includes(searchLower)
        );
      });
  };

  const activeProperties = filterProperties(true);
  const draftProperties = filterProperties(false);

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 lg:pl-64 pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-6">
            {/* Page Title */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-heading font-bold text-text-dark">Leasing</h1>
                <p className="text-text-medium mt-2">
                  Manage your property listings and applications
                </p>
              </div>
              
              <Dialog open={isAddPropertyOpen} onOpenChange={setIsAddPropertyOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4 md:mt-0 bg-primary hover:bg-primary-light">
                    <span className="material-icons mr-1">add</span>
                    Add Property
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Property Listing</DialogTitle>
                    <DialogDescription>
                      Add details for your new property listing
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...propertyForm}>
                    <form onSubmit={propertyForm.handleSubmit(onPropertySubmit)} className="space-y-6">
                      {/* Basic Info */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Basic Information</h3>
                        
                        <FormField
                          control={propertyForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Property Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Modern 2BR in Chelsea" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={propertyForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Beautiful apartment with modern finishes and great light..." 
                                  className="min-h-24" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={propertyForm.control}
                            name="propertyType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Property Type</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select property type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="apartment">Apartment</SelectItem>
                                    <SelectItem value="condo">Condominium</SelectItem>
                                    <SelectItem value="house">House</SelectItem>
                                    <SelectItem value="townhouse">Townhouse</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={propertyForm.control}
                            name="availableDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Available Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      {/* Location */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Location</h3>
                        
                        <FormField
                          control={propertyForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input placeholder="123 Main St, Apt 4B" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={propertyForm.control}
                            name="neighborhood"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Neighborhood</FormLabel>
                                <FormControl>
                                  <Input placeholder="Chelsea" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={propertyForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="New York" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={propertyForm.control}
                              name="state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State</FormLabel>
                                  <FormControl>
                                    <Input placeholder="NY" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={propertyForm.control}
                              name="zipCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ZIP</FormLabel>
                                  <FormControl>
                                    <Input placeholder="10001" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Details</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <FormField
                            control={propertyForm.control}
                            name="rent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Monthly Rent ($)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="2500" 
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                                    value={field.value === undefined ? "" : field.value}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={propertyForm.control}
                            name="bedrooms"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bedrooms</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    placeholder="2"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                                    value={field.value === undefined ? "" : field.value}
                                  />
                                </FormControl>
                                <FormDescription>Use 0 for studio</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={propertyForm.control}
                            name="bathrooms"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bathrooms</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="1.5" 
                                    step="0.5"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                                    value={field.value === undefined ? "" : field.value}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={propertyForm.control}
                            name="squareFeet"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Square Feet</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="850"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                                    value={field.value === undefined ? "" : field.value}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      {/* Amenities */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Amenities & Features</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={propertyForm.control}
                            name="hasInUnitLaundry"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0">In-Unit Laundry</FormLabel>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={propertyForm.control}
                            name="hasDishwasher"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0">Dishwasher</FormLabel>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={propertyForm.control}
                            name="petFriendly"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0">Pet Friendly</FormLabel>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={propertyForm.control}
                            name="hasDoorman"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0">Doorman</FormLabel>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={propertyForm.control}
                            name="hasVirtualTour"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0">Virtual Tour Available</FormLabel>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={propertyForm.control}
                            name="noFee"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0">No Broker Fee</FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={propertyForm.control}
                          name="amenities"
                          render={() => (
                            <FormItem>
                              <div className="mb-4">
                                <FormLabel>Additional Amenities</FormLabel>
                                <FormDescription>
                                  Select all that apply
                                </FormDescription>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {["Elevator", "Gym", "Pool", "Roof Deck", "Balcony", "Central AC", "Hardwood Floors"].map((amenity) => (
                                  <FormField
                                    key={amenity}
                                    control={propertyForm.control}
                                    name="amenities"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={amenity}
                                          className="flex items-center space-x-2"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(amenity)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...field.value, amenity])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) => value !== amenity
                                                      )
                                                    )
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="text-sm font-normal !mt-0">
                                            {amenity}
                                          </FormLabel>
                                        </FormItem>
                                      )
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Images */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Images</h3>
                        <p className="text-sm text-text-medium">For demo purposes, a default image is provided.</p>
                        
                        <div className="border border-dashed rounded-lg p-4 flex items-center justify-center">
                          <div className="text-center">
                            <span className="material-icons text-4xl text-text-medium mb-2">add_photo_alternate</span>
                            <p className="text-sm text-text-medium">
                              Drag and drop images here or click to upload
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Publication Settings */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Publication Settings</h3>
                        
                        <FormField
                          control={propertyForm.control}
                          name="isPublished"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div>
                                <FormLabel className="!mt-0">Publish Immediately</FormLabel>
                                <FormDescription>
                                  Make this listing visible to renters
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setIsAddPropertyOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          className="bg-primary hover:bg-primary-light"
                          disabled={createPropertyMutation.isPending}
                        >
                          {createPropertyMutation.isPending ? "Creating..." : "Create Property"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-text-medium">search</span>
              <Input
                placeholder="Search properties by title, address, or neighborhood..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Properties Tabs */}
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="active" className="px-6">Active Listings</TabsTrigger>
                <TabsTrigger value="drafts" className="px-6">Drafts</TabsTrigger>
                <TabsTrigger value="applications" className="px-6">Applications</TabsTrigger>
              </TabsList>

              {/* Active Listings Tab */}
              <TabsContent value="active">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-heading">Active Listings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="border-b pb-6">
                            <div className="flex flex-col md:flex-row gap-4">
                              <Skeleton className="w-full md:w-48 h-32 rounded-lg" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-1/2" />
                                <div className="flex justify-between">
                                  <Skeleton className="h-10 w-20" />
                                  <Skeleton className="h-10 w-20" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : activeProperties.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                          <span className="material-icons text-white text-2xl">apartment</span>
                        </div>
                        <h3 className="font-heading font-medium text-lg text-text-dark mb-2">
                          No active listings
                        </h3>
                        <p className="text-text-medium mb-4">
                          Create a new property listing or publish a draft
                        </p>
                        <Button 
                          className="bg-primary hover:bg-primary-light"
                          onClick={() => setIsAddPropertyOpen(true)}
                        >
                          Add Property
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {activeProperties.map((property: Property) => (
                          <div key={property.id} className="border-b pb-6 last:border-0 last:pb-0">
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="w-full md:w-48 h-32 bg-gray-100 rounded-lg overflow-hidden">
                                <img 
                                  src={property.images?.[0] || "https://via.placeholder.com/300x200?text=No+Image"} 
                                  alt={property.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2">
                                  <div>
                                    <h3 className="font-heading font-medium text-lg text-text-dark">{property.title}</h3>
                                    <p className="text-text-medium text-sm">
                                      {property.address}, {property.neighborhood}, {property.city}, {property.state} {property.zipCode}
                                    </p>
                                  </div>
                                  <div className="text-right mt-2 md:mt-0">
                                    <p className="font-medium">${property.rent.toLocaleString()}/mo</p>
                                    <p className="text-sm">
                                      Available {formatDate(property.availableDate)}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mb-4">
                                  <Badge variant="outline">
                                    {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed${property.bedrooms > 1 ? 's' : ''}`}
                                  </Badge>
                                  <Badge variant="outline">
                                    {property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}
                                  </Badge>
                                  {property.squareFeet && (
                                    <Badge variant="outline">
                                      {property.squareFeet.toLocaleString()} sqft
                                    </Badge>
                                  )}
                                  <Badge variant="outline">
                                    {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}
                                  </Badge>
                                  {property.noFee && (
                                    <Badge className="bg-accent text-white">
                                      No Fee
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap gap-2 justify-between">
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                      <span className="flex items-center gap-1">
                                        <span className="material-icons text-sm">visibility</span>
                                        Active
                                      </span>
                                    </Badge>
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                      <span className="flex items-center gap-1">
                                        <span className="material-icons text-sm">description</span>
                                        3 Applications
                                      </span>
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm">
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleTogglePublish(property.id, property.isPublished)}
                                      disabled={togglePublishMutation.isPending}
                                    >
                                      Unpublish
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this property?')) {
                                          deletePropertyMutation.mutate(property.id);
                                        }
                                      }}
                                      disabled={deletePropertyMutation.isPending}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Drafts Tab */}
              <TabsContent value="drafts">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-heading">Draft Listings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-6">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="border-b pb-6">
                            <div className="flex flex-col md:flex-row gap-4">
                              <Skeleton className="w-full md:w-48 h-32 rounded-lg" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-1/2" />
                                <div className="flex justify-between">
                                  <Skeleton className="h-10 w-20" />
                                  <Skeleton className="h-10 w-20" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : draftProperties.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                          <span className="material-icons text-white text-2xl">edit_note</span>
                        </div>
                        <h3 className="font-heading font-medium text-lg text-text-dark mb-2">
                          No draft listings
                        </h3>
                        <p className="text-text-medium mb-4">
                          Save listings as drafts while you prepare them
                        </p>
                        <Button 
                          className="bg-primary hover:bg-primary-light"
                          onClick={() => setIsAddPropertyOpen(true)}
                        >
                          Create Draft
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {draftProperties.map((property: Property) => (
                          <div key={property.id} className="border-b pb-6 last:border-0 last:pb-0">
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="w-full md:w-48 h-32 bg-gray-100 rounded-lg overflow-hidden">
                                <img 
                                  src={property.images?.[0] || "https://via.placeholder.com/300x200?text=No+Image"} 
                                  alt={property.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2">
                                  <div>
                                    <h3 className="font-heading font-medium text-lg text-text-dark">{property.title}</h3>
                                    <p className="text-text-medium text-sm">
                                      {property.address}, {property.neighborhood}, {property.city}, {property.state} {property.zipCode}
                                    </p>
                                  </div>
                                  <div className="text-right mt-2 md:mt-0">
                                    <p className="font-medium">${property.rent.toLocaleString()}/mo</p>
                                    <p className="text-sm">
                                      Available {formatDate(property.availableDate)}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mb-4">
                                  <Badge variant="outline">
                                    {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed${property.bedrooms > 1 ? 's' : ''}`}
                                  </Badge>
                                  <Badge variant="outline">
                                    {property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}
                                  </Badge>
                                  {property.squareFeet && (
                                    <Badge variant="outline">
                                      {property.squareFeet.toLocaleString()} sqft
                                    </Badge>
                                  )}
                                  <Badge variant="outline">
                                    {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}
                                  </Badge>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 justify-between">
                                  <div>
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                                      <span className="flex items-center gap-1">
                                        <span className="material-icons text-sm">edit</span>
                                        Draft
                                      </span>
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm">
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleTogglePublish(property.id, property.isPublished)}
                                      disabled={togglePublishMutation.isPending}
                                    >
                                      Publish
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this property?')) {
                                          deletePropertyMutation.mutate(property.id);
                                        }
                                      }}
                                      disabled={deletePropertyMutation.isPending}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Applications Tab */}
              <TabsContent value="applications">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-heading">Rental Applications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                        <span className="material-icons text-white text-2xl">description</span>
                      </div>
                      <h3 className="font-heading font-medium text-lg text-text-dark mb-2">
                        No applications yet
                      </h3>
                      <p className="text-text-medium mb-4">
                        Applications from potential renters will appear here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}
