import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Slider
} from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export interface FilterValues {
  searchTerm?: string;
  neighborhood?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  hasInUnitLaundry?: boolean;
  hasDishwasher?: boolean;
  petFriendly?: boolean;
  hasDoorman?: boolean;
  hasVirtualTour?: boolean;
  noFee?: boolean;
  sortBy?: string;
}

interface PropertyFiltersProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  onAIAssistantOpen: () => void;
}

export default function PropertyFilters({ filters, onFilterChange, onAIAssistantOpen }: PropertyFiltersProps) {
  const isMobile = useIsMobile();
  const [tempFilters, setTempFilters] = useState<FilterValues>(filters);
  const [tempMinRent, setTempMinRent] = useState<string>(filters.minRent?.toString() || "");
  const [tempMaxRent, setTempMaxRent] = useState<string>(filters.maxRent?.toString() || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      setTempFilters((prev) => ({
        ...prev,
        minRent: tempMinRent ? parseInt(tempMinRent) : undefined,
        maxRent: tempMaxRent ? parseInt(tempMaxRent) : undefined,
      }));
    }, 500); // Adjust the delay as needed (500ms is common)
  
    return () => clearTimeout(timer); // Clear timeout if user types again
  }, [tempMinRent, tempMaxRent]);
  

  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchTerm: e.target.value });
  };
  
  const handleNeighborhoodChange = (value: string) => {
    setTempFilters({ ...tempFilters, neighborhood: value });
  };
  
  const handlePriceRangeChange = (values: number[]) => {
    setTempFilters({ 
      ...tempFilters, 
      minRent: values[0], 
      maxRent: values[1] 
    });
  };
  
  const handleBedroomsChange = (value: string) => {
    setTempFilters({ 
      ...tempFilters, 
      bedrooms: value === "studio" ? 0 : parseInt(value, 10) 
    });
  };
  
  const handleBathroomsChange = (value: string) => {
    setTempFilters({ 
      ...tempFilters, 
      bathrooms: parseFloat(value) 
    });
  };
  
  const handlePropertyTypeChange = (value: string) => {
    setTempFilters({ ...tempFilters, propertyType: value });
  };
  
  const handleCheckboxChange = (name: keyof FilterValues) => (checked: boolean) => {
    setTempFilters({ ...tempFilters, [name]: checked });
  };
  
  const handleSortChange = (value: string) => {
    onFilterChange({ ...filters, sortBy: value });
  };
  
  const applyFilters = () => {
    onFilterChange(tempFilters);
  };
  
  const clearFilters = () => {
    const clearedFilters: FilterValues = {
      searchTerm: filters.searchTerm,
      sortBy: filters.sortBy
    };
    setTempFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };
  
  // Neighborhoods (example data)
  const neighborhoods = [
    { value: "soho", label: "SoHo" },
    { value: "chelsea", label: "Chelsea" },
    { value: "west-village", label: "West Village" },
    { value: "upper-west-side", label: "Upper West Side" },
    { value: "upper-east-side", label: "Upper East Side" },
    { value: "tribeca", label: "Tribeca" },
    { value: "east-village", label: "East Village" },
    { value: "financial-district", label: "Financial District" },
    { value: "williamsburg", label: "Williamsburg" },
    { value: "brooklyn-heights", label: "Brooklyn Heights" },
  ];

  // Responsive filter components
  const FilterUI = () => (
    <>
      {/* Price Range Filter */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Price Range</h3>
        <div className="space-y-4">
          <Slider
            value={[tempFilters.minRent || 0, tempFilters.maxRent || 10000]}
            min={0}
            max={10000}
            step={100}
            onValueChange={handlePriceRangeChange}
          />
          <div className="flex justify-between">
            <div className="w-[48%]">
              <Label htmlFor="min-price">Min Price</Label>
              <Input
                    id="min-price"
                    value={tempMinRent}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^\d+$/.test(value)) {
                        setTempMinRent(value); // Update local state first
                      }
                    }}
                    placeholder="$0"
                />
            </div>
            <div className="w-[48%]">
              <Label htmlFor="max-price">Max Price</Label>
              <Input
                id="max-price"
                value={tempMaxRent}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^\d+$/.test(value)) {
                    setTempMaxRent(value); // Update local state first
                  }
                }}
                placeholder="No max"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bedrooms Filter */}
      <div className="mb-6">
        <Label htmlFor="bedrooms" className="font-medium">Bedrooms</Label>
        <Select
          value={tempFilters.bedrooms === 0 ? "studio" : tempFilters.bedrooms?.toString() || "any"}
          onValueChange={handleBedroomsChange}
        >
          <SelectTrigger id="bedrooms">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="studio">Studio</SelectItem>
            <SelectItem value="1">1 Bedroom</SelectItem>
            <SelectItem value="2">2 Bedrooms</SelectItem>
            <SelectItem value="3">3 Bedrooms</SelectItem>
            <SelectItem value="4">4+ Bedrooms</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bathrooms Filter */}
      <div className="mb-6">
        <Label htmlFor="bathrooms" className="font-medium">Bathrooms</Label>
        <Select
          value={tempFilters.bathrooms?.toString() || "any"}
          onValueChange={handleBathroomsChange}
        >
          <SelectTrigger id="bathrooms">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="1">1 Bathroom</SelectItem>
            <SelectItem value="1.5">1.5 Bathrooms</SelectItem>
            <SelectItem value="2">2 Bathrooms</SelectItem>
            <SelectItem value="2.5">2.5 Bathrooms</SelectItem>
            <SelectItem value="3">3+ Bathrooms</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Property Type Filter */}
      <div className="mb-6">
        <Label htmlFor="property-type" className="font-medium">Property Type</Label>
        <Select
          value={tempFilters.propertyType || "any"}
          onValueChange={handlePropertyTypeChange}
        >
          <SelectTrigger id="property-type">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="condo">Condo</SelectItem>
            <SelectItem value="house">House</SelectItem>
            <SelectItem value="townhouse">Townhouse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Neighborhood Filter */}
      <div className="mb-6">
        <Label htmlFor="neighborhood" className="font-medium">Neighborhood</Label>
        <Select
          value={tempFilters.neighborhood || "any"}
          onValueChange={handleNeighborhoodChange}
        >
          <SelectTrigger id="neighborhood">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            {neighborhoods.map((neighborhood) => (
              <SelectItem key={neighborhood.value} value={neighborhood.value}>
                {neighborhood.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amenities Checkboxes */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Amenities</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="in-unit-laundry" 
              checked={tempFilters.hasInUnitLaundry || false}
              onCheckedChange={handleCheckboxChange('hasInUnitLaundry')}
            />
            <Label htmlFor="in-unit-laundry">In-unit laundry</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="dishwasher" 
              checked={tempFilters.hasDishwasher || false}
              onCheckedChange={handleCheckboxChange('hasDishwasher')}
            />
            <Label htmlFor="dishwasher">Dishwasher</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="pet-friendly" 
              checked={tempFilters.petFriendly || false}
              onCheckedChange={handleCheckboxChange('petFriendly')}
            />
            <Label htmlFor="pet-friendly">Pet friendly</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="doorman" 
              checked={tempFilters.hasDoorman || false}
              onCheckedChange={handleCheckboxChange('hasDoorman')}
            />
            <Label htmlFor="doorman">Doorman</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="virtual-tour" 
              checked={tempFilters.hasVirtualTour || false}
              onCheckedChange={handleCheckboxChange('hasVirtualTour')}
            />
            <Label htmlFor="virtual-tour">Virtual tour available</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="no-fee" 
              checked={tempFilters.noFee || false}
              onCheckedChange={handleCheckboxChange('noFee')}
            />
            <Label htmlFor="no-fee">No fee</Label>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Search input */}
        <div className="flex-grow relative">
          <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-text-medium">search</span>
          <Input
            placeholder="Search by neighborhood, address, or building"
            className="w-full pl-10 pr-4 py-3"
            value={filters.searchTerm || ""}
            onChange={handleSearchChange}
          />
        </div>
        
        {/* Filter and sort buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isMobile ? (
            // Mobile: Sheet for filters
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <span className="material-icons text-text-medium text-sm">filter_list</span>
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Refine your property search
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <FilterUI />
                </div>
                <SheetFooter>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <SheetClose asChild>
                    <Button onClick={applyFilters}>
                      Apply Filters
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          ) : (
            // Desktop: Popover for filters
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <span className="material-icons text-text-medium text-sm">filter_list</span>
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <FilterUI />
                <div className="flex justify-between mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <Button size="sm" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {/* Sort dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <span className="material-icons text-text-medium text-sm">sort</span>
                Sort
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-2">
                <Button 
                  variant={filters.sortBy === "price-asc" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => handleSortChange("price-asc")}
                >
                  Price: Low to High
                </Button>
                <Button 
                  variant={filters.sortBy === "price-desc" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => handleSortChange("price-desc")}
                >
                  Price: High to Low
                </Button>
                <Button 
                  variant={filters.sortBy === "newest" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => handleSortChange("newest")}
                >
                  Newest
                </Button>
                <Button 
                  variant={filters.sortBy === "rating" ? "default" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => handleSortChange("rating")}
                >
                  Highest Rated
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Map View button */}
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <span className="material-icons text-text-medium text-sm">map</span>
            Map View
          </Button>
        </div>
        
        {/* AI Assistant Button */}
        <Button 
          className="md:ml-2 flex items-center justify-center gap-2 bg-primary text-white"
          onClick={onAIAssistantOpen}
        >
          <span className="material-icons">smart_toy</span>
          <span>AI Assistant</span>
        </Button>
      </div>
    </div>
  );
}
