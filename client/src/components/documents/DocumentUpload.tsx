import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Check, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// Define the type for user document response
interface UserDocuments {
  id: number;
  documentsUploaded: {
    [key: string]: string | null;
  };
  documentVerificationStatus?: {
    [key: string]: boolean;
  };
}

interface DocumentUploadProps {
  documentType: string;
  label: string;
  description: string;
  required?: boolean;
  onUploadComplete?: (documentPath: string) => void;
}

export default function DocumentUpload({
  documentType,
  label,
  description,
  required = false,
  onUploadComplete
}: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's documents
  const { data: userDocuments, isLoading: isLoadingDocuments } = useQuery<UserDocuments>({
    queryKey: ["/api/documents"],
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Check if this document is already uploaded
  const isDocumentUploaded = userDocuments?.documentsUploaded?.[documentType];
  
  // Check if this document is verified
  const isDocumentVerified = userDocuments?.documentVerificationStatus?.[documentType];

  // Upload document mutation
  const { mutate: uploadDocument, isPending: isUploading } = useMutation({
    mutationFn: async (documentPath: string) => {
      const response = await apiRequest("POST", `/api/documents/${documentType}`, {
        documentPath
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document Uploaded",
        description: `Your ${label.toLowerCase()} has been successfully uploaded.`,
      });
      if (onUploadComplete) {
        onUploadComplete(data.documentsUploaded[documentType]);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // For real implementation, this would upload to a storage service
  // For this demo, we'll simulate by creating an object URL
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    // In a real implementation, this would upload to a storage service (S3, Firebase, etc.)
    // For this demo, we'll simulate by creating a path string
    const documentPath = `documents/${documentType}/${file.name}`;
    
    // Upload the document
    uploadDocument(documentPath);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium">{label}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          {required && <span className="text-xs text-red-500">Required</span>}
        </div>
        {isDocumentUploaded && (
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm">Uploaded</span>
            {isDocumentVerified ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <span className="text-xs text-muted-foreground">Pending verification</span>
            )}
          </div>
        )}
      </div>

      {isDocumentUploaded ? (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>Document Uploaded</AlertTitle>
          <AlertDescription>
            {isDocumentVerified 
              ? "This document has been verified." 
              : "This document is pending verification."}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor={`${documentType}-upload`}>Select File</Label>
            <Input
              id={`${documentType}-upload`}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
          
          {file && (
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm">{file.name}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setFile(null)}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>Upload Document</>
            )}
          </Button>
        </>
      )}
    </div>
  );
}