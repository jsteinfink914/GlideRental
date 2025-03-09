import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import DocumentsManager from "@/components/documents/DocumentsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RentalApplication } from "@shared/schema";
import Navigation from "@/components/layout/Navigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import RentalTabs from "@/components/layout/RentalTabs";

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

export default function DocumentsPage() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to auth page if user is not logged in
  useEffect(() => {
    if (!isLoadingAuth && !user) {
      setLocation("/auth");
    }
  }, [user, isLoadingAuth, setLocation]);

  // Fetch user's documents
  const { data: userDocuments, isLoading: isLoadingDocuments } = useQuery<UserDocuments>({
    queryKey: ["/api/documents"],
  });

  // Fetch user's applications
  const { data: applications, isLoading: isLoadingApplications } = useQuery<RentalApplication[]>({
    queryKey: ["/api/applications"],
  });

  // Loading state
  if (isLoadingAuth || isLoadingDocuments || isLoadingApplications) {
    return (
      <div className="container py-10">
        <Skeleton className="h-10 w-60 mb-6" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  // Count documents
  const uploadedDocumentCount = userDocuments?.documentsUploaded
    ? Object.keys(userDocuments.documentsUploaded).length
    : 0;

  const verifiedDocumentCount = userDocuments?.documentVerificationStatus
    ? Object.keys(userDocuments.documentVerificationStatus).filter(
        key => userDocuments.documentVerificationStatus && userDocuments.documentVerificationStatus[key]
      ).length
    : 0;

  // Get property applications
  const applicationCount = applications?.length || 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 lg:pl-64 pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-6">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-heading font-bold text-text-dark">Documents & Applications</h1>
              <p className="text-text-medium mt-2">
                Manage your documents and view your rental applications
              </p>
            </div>

            {/* Content Tabs */}
            <RentalTabs />

            <Tabs defaultValue="documents" className="space-y-6 mt-6">
              <TabsList>
                <TabsTrigger value="documents">My Documents</TabsTrigger>
                <TabsTrigger value="applications">Applications</TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Document Summary</CardTitle>
                      <CardDescription>
                        Status of your uploaded documents
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <span>Uploaded Documents</span>
                          </div>
                          <span className="font-medium">{uploadedDocumentCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span>Verified Documents</span>
                          </div>
                          <span className="font-medium">{verifiedDocumentCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <InfoIcon className="h-5 w-5 text-amber-500" />
                            <span>Pending Verification</span>
                          </div>
                          <span className="font-medium">{uploadedDocumentCount - verifiedDocumentCount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <DocumentsManager 
                  requiredDocuments={[
                    'w2',
                    'bankStatements',
                    'payStubs',
                    'identificationDocument',
                    'proofOfInsurance'
                  ]} 
                />
              </TabsContent>

              <TabsContent value="applications" className="space-y-6">
                {applicationCount === 0 ? (
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>No Applications</AlertTitle>
                    <AlertDescription>
                      You haven't submitted any rental applications yet.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {applications?.map((application: RentalApplication) => (
                      <Card key={application.id}>
                        <CardHeader>
                          <CardTitle>Application #{application.id}</CardTitle>
                          <div className="flex justify-between items-center">
                            <CardDescription>
                              Submitted on {new Date(application.createdAt).toLocaleDateString()}
                            </CardDescription>
                            <Badge variant={
                              application.status === 'approved' ? 'default' : 
                              application.status === 'rejected' ? 'destructive' : 
                              'outline'
                            }>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium">Property</h3>
                            <p>Property #{application.propertyId}</p>
                          </div>
                          
                          {application.message && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-medium">Your Message</h3>
                              <p className="text-sm text-muted-foreground">{application.message}</p>
                            </div>
                          )}
                          
                          {application.landlordNotes && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-medium">Landlord Notes</h3>
                              <p className="text-sm text-muted-foreground">{application.landlordNotes}</p>
                            </div>
                          )}
                          
                          <Button variant="outline" size="sm">View Details</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}