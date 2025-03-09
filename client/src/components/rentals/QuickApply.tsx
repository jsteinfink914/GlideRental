import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Property } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import DocumentsManager from "../documents/DocumentsManager";

interface QuickApplyProps {
  property: Property;
  onSuccess?: () => void;
}

export default function QuickApply({ property, onSuccess }: QuickApplyProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get landlord criteria to check required documents
  const { data: criteria } = useQuery({
    queryKey: ["/api/landlord-criteria", property.id],
    enabled: isOpen,
  });

  // Check if user has already applied to this property
  const { data: applications, isLoading: isLoadingApplications } = useQuery({
    queryKey: ["/api/applications"],
    enabled: isOpen,
  });

  const hasApplied = applications?.some(
    (app: any) => app.propertyId === property.id
  );

  // Quick apply mutation
  const { mutate: quickApply, isPending: isApplying } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/quick-apply/${property.id}`, {
        message
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Application Submitted",
        description: "Your application has been successfully submitted to the landlord.",
      });
      setIsOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Application Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleApply = () => {
    quickApply();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full">
          Quick Apply
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Quick Apply for {property.title}</DialogTitle>
          <DialogDescription>
            Submit your application quickly with your pre-uploaded documents.
          </DialogDescription>
        </DialogHeader>

        {hasApplied ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Check className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Already Applied</h3>
            <p className="text-muted-foreground">
              You've already submitted an application for this property.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6">
              <DocumentsManager 
                propertyId={property.id} 
                requiredDocuments={criteria?.requiredDocuments} 
              />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Message to Landlord (Optional)</h3>
                <Textarea
                  placeholder="Introduce yourself and tell the landlord why you're interested in this property..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setIsOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button 
                onClick={handleApply} 
                disabled={isApplying}
              >
                {isApplying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>Submit Application</>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}