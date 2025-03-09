import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { insertUserPreferencesSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Extend the insert schema with additional validations
const onboardingSchema = insertUserPreferencesSchema.extend({
  moveInDate: z.string().min(1, "Please select a move-in date"),
  budget: z.object({
    min: z.number().min(0, "Minimum rent must be at least 0"),
    max: z.number().min(0, "Maximum rent must be at least 0")
  }).refine(data => data.max >= data.min, {
    message: "Maximum rent must be greater than or equal to minimum rent",
    path: ["max"]
  }),
  bedroomsMin: z.number().min(0, "Minimum bedrooms must be at least 0"),
  bedroomsMax: z.number().min(0, "Maximum bedrooms must be at least 0"),
  bathroomsMin: z.number().min(0, "Minimum bathrooms must be at least 0"),
  neighborhoodPreferences: z.array(z.string()).default([]),
  propertyTypes: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  hasPets: z.boolean().default(false),
  isSmoker: z.boolean().default(false),
  income: z.union([z.number(), z.undefined()]).optional(),
  creditScore: z.union([
    z.number().min(300, "Credit score must be at least 300").max(850, "Credit score cannot exceed 850"),
    z.undefined()
  ]).optional(),
  isEmployed: z.boolean().default(false),
  employmentVerified: z.boolean().default(false),
  hasRentalHistory: z.boolean().default(false),
  rentalHistoryVerified: z.boolean().default(false),
  dealBreakers: z.array(z.string()).default([]),
  // Make lifestyle optional for now
  lifestyle: z.any().optional(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const NEIGHBORHOODS = [
  "Downtown",
  "Midtown",
  "Uptown",
  "West Side",
  "East Side",
  "North End",
  "South End",
  "Financial District",
  "Waterfront",
  "University District"
];

const PROPERTY_TYPES = [
  "Apartment",
  "House",
  "Condo",
  "Townhouse",
  "Studio",
  "Loft"
];

const AMENITIES = [
  "In-unit Laundry",
  "Dishwasher",
  "Balcony",
  "Pool",
  "Gym",
  "Pet Friendly",
  "Parking",
  "Doorman",
  "Elevator",
  "Air Conditioning"
];

const OnboardingForm = () => {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const defaultValues: Partial<OnboardingFormValues> = {
    budget: { min: 1000, max: 3000 },
    bedroomsMin: 1,
    bedroomsMax: 2,
    bathroomsMin: 1,
    moveInDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"), // 30 days from now
    hasPets: false,
    isSmoker: false,
    isEmployed: false,
    employmentVerified: false,
    hasRentalHistory: false,
    rentalHistoryVerified: false,
    neighborhoodPreferences: [],
    propertyTypes: [],
    amenities: [],
    dealBreakers: []
  };

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues,
    mode: "all", // Validate all fields on change, blur and submit
    reValidateMode: "onChange" // Re-validate on every change
  });

  const [location, setLocation] = useLocation();
  const onboardingMutation = useMutation({
    mutationFn: async (data: OnboardingFormValues) => {
      console.log("Making POST request to /api/user-preferences with data:", data);
      try {
        const res = await apiRequest("POST", "/api/user-preferences", data);
        const responseData = await res.json();
        console.log("Response from server:", responseData);
        return responseData;
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Mutation succeeded with data:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile completed!",
        description: "Your preferences have been saved.",
        variant: "default"
      });
      
      // Important: Force navigation to the search page
      console.log("Redirecting to search page...");
      window.location.href = "/search";
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving preferences",
        description: error.message,
        variant: "destructive"
      });
      console.error("Error submitting preferences:", error);
    }
  });

  const onSubmit = (data: OnboardingFormValues) => {
    console.log("Form submitted with data:", data);
    
    // Check for validation errors on the final step
    if (step === 3) {
      const errors = form.formState.errors;
      console.log("Form errors:", errors);
      
      // If there are errors, show them in a toast
      if (Object.keys(errors).length > 0) {
        const errorList = Object.entries(errors)
          .map(([field, error]) => `${field}: ${error.message}`)
          .join(', ');
        
        toast({
          title: "Please fix the following errors",
          description: errorList,
          variant: "destructive"
        });
        
        return;
      }
    }
    
    if (step < 3) {
      // Move to next step regardless of validation errors
      setStep(step + 1);
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to complete onboarding",
        variant: "destructive"
      });
      return;
    }
    
    // Add userId to the form data
    const completeData = {
      ...data,
      userId: user.id
    };
    
    // Log the final data for debugging
    console.log("Final submission data:", completeData);
    
    // Final submission
    onboardingMutation.mutate(completeData);
  };

  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const PropertyDetailsForm = () => (
    <>
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Property Details</h3>
        <p className="text-sm text-muted-foreground">Tell us about your ideal rental property.</p>
      </div>
      
      <FormField
        control={form.control}
        name="moveInDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Move-in Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(new Date(field.value), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormDescription>
              When are you planning to move in?
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="space-y-2">
        <FormLabel>Budget (Monthly Rent)</FormLabel>
        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="budget.min"
            render={({ field }) => (
              <FormItem className="w-[100px]">
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <span className="text-muted-foreground">to</span>
          <FormField
            control={form.control}
            name="budget.max"
            render={({ field }) => (
              <FormItem className="w-[100px]">
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <FormLabel>Bedrooms</FormLabel>
        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="bedroomsMin"
            render={({ field }) => (
              <FormItem className="w-[100px]">
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <span className="text-muted-foreground">to</span>
          <FormField
            control={form.control}
            name="bedroomsMax"
            render={({ field }) => (
              <FormItem className="w-[100px]">
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      
      <FormField
        control={form.control}
        name="bathroomsMin"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Minimum Bathrooms</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="propertyTypes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Property Types</FormLabel>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((type) => (
                <div
                  key={type}
                  className={`border rounded-md px-3 py-1 cursor-pointer ${
                    field.value?.includes(type) 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-background hover:bg-accent"
                  }`}
                  onClick={() => {
                    const current = field.value || [];
                    if (current.includes(type)) {
                      field.onChange(current.filter(t => t !== type));
                    } else {
                      field.onChange([...current, type]);
                    }
                  }}
                >
                  {type}
                </div>
              ))}
            </div>
            <FormDescription>Select all that you're interested in</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  const NeighborhoodAndAmenitiesForm = () => (
    <>
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Location and Amenities</h3>
        <p className="text-sm text-muted-foreground">Let us know your preferences in more detail.</p>
      </div>
      
      <FormField
        control={form.control}
        name="neighborhoodPreferences"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preferred Neighborhoods</FormLabel>
            <div className="flex flex-wrap gap-2">
              {NEIGHBORHOODS.map((neighborhood) => (
                <div
                  key={neighborhood}
                  className={`border rounded-md px-3 py-1 cursor-pointer ${
                    field.value?.includes(neighborhood) 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-background hover:bg-accent"
                  }`}
                  onClick={() => {
                    const current = field.value || [];
                    if (current.includes(neighborhood)) {
                      field.onChange(current.filter(n => n !== neighborhood));
                    } else {
                      field.onChange([...current, neighborhood]);
                    }
                  }}
                >
                  {neighborhood}
                </div>
              ))}
            </div>
            <FormDescription>Select neighborhoods you're interested in</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="amenities"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Desired Amenities</FormLabel>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((amenity) => (
                <div
                  key={amenity}
                  className={`border rounded-md px-3 py-1 cursor-pointer ${
                    field.value?.includes(amenity) 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-background hover:bg-accent"
                  }`}
                  onClick={() => {
                    const current = field.value || [];
                    if (current.includes(amenity)) {
                      field.onChange(current.filter(a => a !== amenity));
                    } else {
                      field.onChange([...current, amenity]);
                    }
                  }}
                >
                  {amenity}
                </div>
              ))}
            </div>
            <FormDescription>Select amenities that are important to you</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="hasPets"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Pets</FormLabel>
                <FormDescription>
                  Do you have any pets?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isSmoker"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Smoker</FormLabel>
                <FormDescription>
                  Are you a smoker?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </>
  );

  const QualificationForm = () => (
    <>
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Qualification Information</h3>
        <p className="text-sm text-muted-foreground">
          This information helps match you with properties you qualify for.
          It's optional but can improve your experience.
        </p>
      </div>
      
      <FormField
        control={form.control}
        name="income"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Annual Income</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                step={1000}
                placeholder="Annual income (optional)"
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              This helps match you with affordable options
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="creditScore"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Credit Score</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={300}
                max={850}
                placeholder="Credit score (optional)"
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </FormControl>
            <FormDescription>
              Range: 300-850
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="isEmployed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Employment</FormLabel>
                <FormDescription>
                  Are you currently employed?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="hasRentalHistory"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Rental History</FormLabel>
                <FormDescription>
                  Do you have prior rental history?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {form.watch("isEmployed") && (
          <FormField
            control={form.control}
            name="employmentVerified"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Employment Verified</FormLabel>
                  <FormDescription>
                    Can your employment be verified?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        
        {form.watch("hasRentalHistory") && (
          <FormField
            control={form.control}
            name="rentalHistoryVerified"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Rental History Verified</FormLabel>
                  <FormDescription>
                    Can your rental history be verified?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>
    </>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>
          Tell us about your preferences to help us find the perfect home for you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              1
            </div>
            <Separator className="w-12" />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              2
            </div>
            <Separator className="w-12" />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              3
            </div>
          </div>
          <div className="text-sm font-medium">
            Step {step} of 3
          </div>
        </div>
        
        <Form {...form}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              console.log('Form submitted');
              form.handleSubmit(onSubmit)(e);
            }} 
            className="space-y-6"
          >
            {step === 1 && <PropertyDetailsForm />}
            {step === 2 && <NeighborhoodAndAmenitiesForm />}
            {step === 3 && <QualificationForm />}
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={goToPreviousStep}
          disabled={step === 1}
        >
          Back
        </Button>
        <Button 
          type="button"
          onClick={() => {
            console.log('Button clicked');
            if (step < 3) {
              // For steps 1 and 2, just advance to the next step without full validation
              setStep(step + 1);
            } else {
              // For final submission, do full validation
              console.log("Final step submission!");
              // Use the existing form submission handler which includes validation
              form.handleSubmit(onSubmit)();
            }
          }}
          disabled={onboardingMutation.isPending}
        >
          {onboardingMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : step < 3 ? (
            <>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            "Complete Setup"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OnboardingForm;