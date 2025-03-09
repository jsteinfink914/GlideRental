import { useQuery } from "@tanstack/react-query";
import DocumentUpload from "./DocumentUpload";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, CheckCircle } from "lucide-react";
import { LandlordCriteria } from "@shared/schema";

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

interface DocumentsManagerProps {
  requiredDocuments?: string[];
  propertyId?: number;
}

export default function DocumentsManager({ requiredDocuments, propertyId }: DocumentsManagerProps) {
  // Fetch landlord criteria if propertyId is provided
  const { data: criteria, isLoading: isLoadingCriteria } = useQuery<LandlordCriteria>({
    queryKey: ["/api/landlord-criteria", propertyId],
    enabled: !!propertyId,
  });

  // Combine required documents from props and landlord criteria
  const allRequiredDocuments = [
    ...(requiredDocuments || []),
    ...(criteria?.requiredDocuments || [])
  ];

  // Fetch user documents
  const { data: userDocuments, isLoading: isLoadingDocuments } = useQuery<UserDocuments>({
    queryKey: ["/api/documents"],
  });

  if (isLoadingCriteria || isLoadingDocuments) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Check if all required documents are uploaded
  const areAllDocumentsUploaded = allRequiredDocuments.length > 0 &&
    allRequiredDocuments.every(docType => userDocuments?.documentsUploaded?.[docType]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Required Documents</CardTitle>
        <CardDescription>
          Upload the necessary documents for your rental application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {allRequiredDocuments.length === 0 ? (
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>No Documents Required</AlertTitle>
            <AlertDescription>
              There are no required documents for this application.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {allRequiredDocuments.includes('w2') && (
              <DocumentUpload
                documentType="w2"
                label="W-2 Form"
                description="Most recent W-2 form showing your annual income"
                required
              />
            )}
            
            {allRequiredDocuments.includes('payStubs') && (
              <DocumentUpload
                documentType="payStubs"
                label="Pay Stubs"
                description="Last 3 months of pay stubs from your employer"
                required
              />
            )}
            
            {allRequiredDocuments.includes('bankStatements') && (
              <DocumentUpload
                documentType="bankStatements"
                label="Bank Statements"
                description="Last 3 months of bank statements"
                required
              />
            )}
            
            {allRequiredDocuments.includes('identificationDocument') && (
              <DocumentUpload
                documentType="identificationDocument"
                label="ID Document"
                description="Government-issued ID (driver's license, passport)"
                required
              />
            )}
            
            {allRequiredDocuments.includes('proofOfInsurance') && (
              <DocumentUpload
                documentType="proofOfInsurance"
                label="Proof of Insurance"
                description="Current renter's insurance policy"
                required
              />
            )}
            
            {allRequiredDocuments.includes('creditReport') && (
              <DocumentUpload
                documentType="creditReport"
                label="Credit Report"
                description="Recent credit report (within the last 30 days)"
                required
              />
            )}
            
            {allRequiredDocuments.includes('employmentVerification') && (
              <DocumentUpload
                documentType="employmentVerification"
                label="Employment Verification"
                description="Letter from employer confirming employment and salary"
                required
              />
            )}
            
            {allRequiredDocuments.includes('referenceLetters') && (
              <DocumentUpload
                documentType="referenceLetters"
                label="Reference Letters"
                description="Reference letters from previous landlords"
                required
              />
            )}
          </>
        )}
      </CardContent>
      <CardFooter>
        {areAllDocumentsUploaded ? (
          <Alert className="w-full">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>All Documents Uploaded</AlertTitle>
            <AlertDescription>
              You have uploaded all required documents. They will be reviewed by the landlord.
            </AlertDescription>
          </Alert>
        ) : allRequiredDocuments.length > 0 && (
          <Alert className="w-full">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Documents Required</AlertTitle>
            <AlertDescription>
              Please upload all required documents to complete your application.
            </AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
}