import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Property } from "@shared/schema";
import Navigation from "@/components/layout/Navigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import PropertyFilters, { FilterValues } from "@/components/rentals/PropertyFilters";
import PropertyGrid from "@/components/rentals/PropertyGrid";
import MapView from "@/components/rentals/MapView";
import { RentalPagination } from "@/components/ui/rental-pagination";
import AIChatAssistant from "@/components/rentals/AIChatAssistant";
import { useMap } from "@/hooks/use-map";
import { Button } from "@/components/ui/button";

// Number of properties per page
const ITEMS_PER_PAGE = 6;

export default function SearchPage() {
  // Log when the page loads
  console.log("Search page loaded");
  const { user } = useAuth();
  const { mapState, selectProperty, clearSelectedProperty } = useMap();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Fetch properties
  const { data: properties, isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ['/api/properties', filters],
    queryFn: async () => {
      // Convert filters to query parameters
      const params = new URLSearchParams();
      
      if (filters.neighborhood) params.append('neighborhood', filters.neighborhood);
      if (filters.minRent) params.append('minRent', filters.minRent.toString());
      if (filters.maxRent) params.append('maxRent', filters.maxRent.toString());
      if (filters.bedrooms !== undefined) params.append('bedrooms', filters.bedrooms.toString());
      if (filters.bathrooms !== undefined) params.append('bathrooms', filters.bathrooms.toString());
      if (filters.propertyType) params.append('propertyType', filters.propertyType);
      if (filters.hasInUnitLaundry !== undefined) params.append('hasInUnitLaundry', filters.hasInUnitLaundry.toString());
      if (filters.hasDishwasher !== undefined) params.append('hasDishwasher', filters.hasDishwasher.toString());
      if (filters.petFriendly !== undefined) params.append('petFriendly', filters.petFriendly.toString());
      if (filters.hasDoorman !== undefined) params.append('hasDoorman', filters.hasDoorman.toString());
      if (filters.hasVirtualTour !== undefined) params.append('hasVirtualTour', filters.hasVirtualTour.toString());
      if (filters.noFee !== undefined) params.append('noFee', filters.noFee.toString());
      
      const queryString = params.toString();
      const response = await fetch(`/api/properties${queryString ? `?${queryString}` : ''}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      
      return response.json();
    }
  });

  // Fetch saved properties
  const { data: savedProperties } = useQuery<{savedId: number; property: Property}[]>({
    queryKey: ['/api/saved-properties'],
    enabled: !!user
  });

  // Apply sorting to properties
  const sortedProperties = [...(properties || [])].sort((a, b) => {
    if (filters.sortBy === 'price-asc') {
      return a.rent - b.rent;
    } else if (filters.sortBy === 'price-desc') {
      return b.rent - a.rent;
    } else if (filters.sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (filters.sortBy === 'rating' && a.rating && b.rating) {
      return b.rating - a.rating;
    }
    return 0;
  });

  // Apply search filter if there's a search term
  const filteredProperties = sortedProperties.filter(property => {
    if (!filters.searchTerm) return true;
    
    const searchLower = filters.searchTerm.toLowerCase();
    return (
      property.title.toLowerCase().includes(searchLower) ||
      property.description.toLowerCase().includes(searchLower) ||
      property.address.toLowerCase().includes(searchLower) ||
      property.neighborhood.toLowerCase().includes(searchLower) ||
      property.city.toLowerCase().includes(searchLower)
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil((filteredProperties?.length || 0) / ITEMS_PER_PAGE);
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handlePropertySelect = (property: Property) => {
    selectProperty(property);
    if (viewMode === "list") {
      setViewMode("map");
    }
  };

  const handleAIChatOpen = () => {
    setIsAIChatOpen(true);
  };

  const handleAIChatClose = () => {
    setIsAIChatOpen(false);
  };

  const handleAIPropertySelect = (property: Property) => {
    selectProperty(property);
    setIsAIChatOpen(false);
    setViewMode("map");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 lg:pl-64 pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-6">

            
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-heading font-bold text-text-dark">Find your next home</h1>
              <p className="text-text-medium mt-2">
                {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} available
              </p>
            </div>

            {/* Content Tabs */}
            <div className="flex mb-6 border-b border-gray-200">
              <Link href="/search">
                <div className="flex items-center px-6 py-3 font-medium text-primary border-b-2 border-primary cursor-pointer">
                  <span className="material-icons mr-2">search</span>
                  Search
                </div>
              </Link>
              <Link href="/for-you">
                <div className="flex items-center px-6 py-3 font-medium text-text-medium hover:text-primary cursor-pointer">
                  <span className="material-icons mr-2">recommend</span>
                  For You
                </div>
              </Link>
              <Link href="/saved">
                <div className="flex items-center px-6 py-3 font-medium text-text-medium hover:text-primary cursor-pointer">
                  <span className="material-icons mr-2">bookmarks</span>
                  Saved
                </div>
              </Link>
              <Link href="/tools">
                <div className="flex items-center px-6 py-3 font-medium text-text-medium hover:text-primary cursor-pointer">
                  <span className="material-icons mr-2">view_list</span>
                  Tools
                </div>
              </Link>
            </div>

            {/* Search and Filter Bar */}
            <PropertyFilters 
              filters={filters} 
              onFilterChange={handleFilterChange} 
              onAIAssistantOpen={handleAIChatOpen}
            />

            {/* View Toggle Tabs */}
            <div className="flex mb-6 border-b border-gray-200">
              <Button 
                variant="ghost" 
                className={`flex items-center px-4 py-2 font-medium ${
                  viewMode === "list" ? "tab-active text-primary" : "text-text-medium hover:text-primary"
                }`}
                onClick={() => setViewMode("list")}
              >
                <span className="material-icons mr-1">dashboard</span>
                List View
              </Button>
              <Button 
                variant="ghost" 
                className={`flex items-center px-4 py-2 font-medium ${
                  viewMode === "map" ? "tab-active text-primary" : "text-text-medium hover:text-primary"
                }`}
                onClick={() => setViewMode("map")}
              >
                <span className="material-icons mr-1">map</span>
                Map View
              </Button>
            </div>

            {/* Property Grid or Map View */}
            {viewMode === "list" ? (
              <>
                <PropertyGrid 
                  properties={paginatedProperties}
                  savedProperties={savedProperties}
                  isLoading={isLoadingProperties}
                  onSelectProperty={handlePropertySelect}
                />
                {totalPages > 1 && (
                  <RentalPagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={handlePageChange} 
                  />
                )}
              </>
            ) : (
              <MapView 
                properties={filteredProperties} 
                selectedProperty={mapState.selectedProperty} 
                onSelectProperty={clearSelectedProperty}
              />
            )}
          </div>
        </main>
      </div>

      {/* AI Chat Assistant */}
      <AIChatAssistant 
        isOpen={isAIChatOpen} 
        onClose={handleAIChatClose} 
        onPropertySelect={handleAIPropertySelect}
      />

      <MobileNavigation />
    </div>
  );
}
