import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/layout/Navigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "@shared/schema";

export default function AccountPage() {
  const [, params] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Parse URL params for default tab
  useEffect(() => {
    const searchParams = new URLSearchParams(params);
    const tabParam = searchParams.get("tab");
    if (tabParam && ["profile", "settings", "documents", "preferences", "security"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [params]);

  // Profile update schema
  const profileSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email"),
    phoneNumber: z.string().optional(),
  });

  type ProfileFormValues = z.infer<typeof profileSchema>;

  // Profile update form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user, profileForm]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      if (!user) throw new Error("User not authenticated");
      const res = await apiRequest("PUT", `/api/users/${user.id}`, data);
      return await res.json();
    },
    onSuccess: (updatedUser: User) => {
      // Update the user in the global state
      queryClient.setQueryData(["/api/user"], updatedUser);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
      
      setIsEditingProfile(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  // Password change schema
  const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  type PasswordFormValues = z.infer<typeof passwordSchema>;

  // Password change form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      if (!user) throw new Error("User not authenticated");
      const res = await apiRequest("PUT", `/api/users/${user.id}/password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully."
      });
      
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Password change failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onPasswordSubmit = (data: PasswordFormValues) => {
    changePasswordMutation.mutate(data);
  };

  // Notification preferences schema
  const notificationSchema = z.object({
    emailNotifications: z.boolean().default(true),
    smsNotifications: z.boolean().default(false),
    paymentReminders: z.boolean().default(true),
    maintenanceUpdates: z.boolean().default(true),
    propertyAlerts: z.boolean().default(true),
    marketingEmails: z.boolean().default(false),
  });

  type NotificationFormValues = z.infer<typeof notificationSchema>;

  // Notification preferences form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      smsNotifications: false,
      paymentReminders: true,
      maintenanceUpdates: true,
      propertyAlerts: true,
      marketingEmails: false,
    },
  });

  // Update notification preferences mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      if (!user) throw new Error("User not authenticated");
      const res = await apiRequest("PUT", `/api/users/${user.id}/preferences`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been updated."
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

  const onNotificationsSubmit = (data: NotificationFormValues) => {
    updateNotificationsMutation.mutate(data);
  };

  // Mock documents data
  const documents = [
    {
      id: 1,
      name: "Proof of Income.pdf",
      type: "Income Verification",
      dateUploaded: "2023-05-15",
      status: "Verified"
    },
    {
      id: 2,
      name: "Rental History.pdf",
      type: "Rental History",
      dateUploaded: "2023-05-15",
      status: "Pending Review"
    },
    {
      id: 3,
      name: "ID Document.pdf",
      type: "Identification",
      dateUploaded: "2023-05-14",
      status: "Verified"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 lg:pl-64 pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-6">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-heading font-bold text-text-dark">Account</h1>
              <p className="text-text-medium mt-2">
                Manage your profile, preferences, and account settings
              </p>
            </div>

            {/* Account Tabs */}
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="profile" className="px-6">Profile</TabsTrigger>
                <TabsTrigger value="settings" className="px-6">Settings</TabsTrigger>
                <TabsTrigger value="documents" className="px-6">Documents</TabsTrigger>
                <TabsTrigger value="preferences" className="px-6">Preferences</TabsTrigger>
                <TabsTrigger value="security" className="px-6">Security</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl font-heading">Profile Information</CardTitle>
                      <Button 
                        variant={isEditingProfile ? "outline" : "default"}
                        className={isEditingProfile ? "border-primary text-primary" : "bg-primary hover:bg-primary-light"}
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        disabled={updateProfileMutation.isPending}
                      >
                        {isEditingProfile ? "Cancel" : "Edit Profile"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!user ? (
                      <div className="space-y-4">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ) : (
                      isEditingProfile ? (
                        <Form {...profileForm}>
                          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={profileForm.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={profileForm.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={profileForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={profileForm.control}
                              name="phoneNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end">
                              <Button 
                                type="submit" 
                                className="bg-primary hover:bg-primary-light"
                                disabled={updateProfileMutation.isPending}
                              >
                                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center mb-6">
                            <div className="w-24 h-24 rounded-full bg-accent text-white flex items-center justify-center mr-6">
                              {user.profileImage ? (
                                <img
                                  src={user.profileImage}
                                  alt={`${user.firstName} ${user.lastName}`}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="material-icons text-4xl">person</span>
                              )}
                            </div>
                            <div>
                              <h2 className="text-2xl font-heading font-medium mb-1">
                                {user.firstName} {user.lastName}
                              </h2>
                              <p className="text-text-medium">
                                {user.userType === "landlord" ? "Landlord" : "Renter"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-sm font-medium text-text-medium mb-1">Username</h3>
                              <p>{user.username}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-text-medium mb-1">Email</h3>
                              <p>{user.email}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-text-medium mb-1">Phone</h3>
                              <p>{user.phoneNumber || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-text-medium mb-1">Member Since</h3>
                              <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-heading">Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="border-b pb-6">
                        <h3 className="font-medium text-lg mb-2">Email Preferences</h3>
                        <p className="text-text-medium mb-4">Manage how you receive email communications</p>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Transaction Receipts</h4>
                              <p className="text-sm text-text-medium">Receive receipts for all transactions</p>
                            </div>
                            <div className="relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out border-2 border-transparent rounded-full cursor-pointer bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                              <span className="inline-block w-5 h-5 transition duration-200 ease-in-out transform translate-x-6 bg-white rounded-full shadow" />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Account Alerts</h4>
                              <p className="text-sm text-text-medium">Notifications about your account activity</p>
                            </div>
                            <div className="relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out border-2 border-transparent rounded-full cursor-pointer bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                              <span className="inline-block w-5 h-5 transition duration-200 ease-in-out transform translate-x-6 bg-white rounded-full shadow" />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Marketing Emails</h4>
                              <p className="text-sm text-text-medium">Receive promotional offers and updates</p>
                            </div>
                            <div className="relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out border-2 border-transparent rounded-full cursor-pointer bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                              <span className="inline-block w-5 h-5 transition duration-200 ease-in-out transform translate-x-0 bg-white rounded-full shadow" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-b pb-6">
                        <h3 className="font-medium text-lg mb-2">Language & Region</h3>
                        <p className="text-text-medium mb-4">Set your language and regional preferences</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="language">Language</Label>
                            <Input id="language" value="English (US)" disabled />
                          </div>
                          <div>
                            <Label htmlFor="timezone">Timezone</Label>
                            <Input id="timezone" value="Eastern Time (US & Canada)" disabled />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg mb-2">Data & Privacy</h3>
                        <p className="text-text-medium mb-4">Manage your data and privacy settings</p>
                        
                        <div className="space-y-4">
                          <Button variant="outline" className="border-primary text-primary">
                            Download Your Data
                          </Button>
                          <Button variant="outline" className="text-destructive border-destructive">
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl font-heading">Documents</CardTitle>
                      <Button className="bg-primary hover:bg-primary-light">
                        <span className="material-icons mr-1">upload</span>
                        Upload Document
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left py-3 px-4">Document Name</th>
                            <th className="text-left py-3 px-4">Type</th>
                            <th className="text-left py-3 px-4">Date Uploaded</th>
                            <th className="text-left py-3 px-4">Status</th>
                            <th className="text-right py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.map((doc) => (
                            <tr key={doc.id} className="border-b">
                              <td className="py-3 px-4">
                                <div className="flex items-center">
                                  <span className="material-icons text-primary mr-2">description</span>
                                  {doc.name}
                                </div>
                              </td>
                              <td className="py-3 px-4">{doc.type}</td>
                              <td className="py-3 px-4">{doc.dateUploaded}</td>
                              <td className="py-3 px-4">
                                {doc.status === "Verified" ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                    Verified
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Button variant="ghost" size="sm">
                                  <span className="material-icons text-sm">download</span>
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <span className="material-icons text-sm">delete</span>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-medium text-lg mb-4">Required Documents</h3>
                      <div className="space-y-2">
                        <div className="flex items-center p-3 border rounded-lg">
                          <span className="material-icons text-text-medium mr-3">add_circle_outline</span>
                          <div>
                            <p className="font-medium">Proof of Employment</p>
                            <p className="text-sm text-text-medium">Upload a letter of employment or recent pay stubs</p>
                          </div>
                        </div>
                        <div className="flex items-center p-3 border rounded-lg">
                          <span className="material-icons text-text-medium mr-3">add_circle_outline</span>
                          <div>
                            <p className="font-medium">Credit Report</p>
                            <p className="text-sm text-text-medium">Upload a recent credit report</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-heading">Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...notificationForm}>
                      <form onSubmit={notificationForm.handleSubmit(onNotificationsSubmit)} className="space-y-6">
                        <div className="border-b pb-6">
                          <h3 className="font-medium text-lg mb-4">Communication Channels</h3>
                          
                          <div className="space-y-4">
                            <FormField
                              control={notificationForm.control}
                              name="emailNotifications"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                  <div>
                                    <FormLabel className="font-medium text-base">Email Notifications</FormLabel>
                                    <FormDescription>
                                      Receive notifications via email
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <div className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out border-2 border-transparent rounded-full cursor-pointer ${field.value ? 'bg-primary' : 'bg-gray-200'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}>
                                      <span className={`inline-block w-5 h-5 transition duration-200 ease-in-out transform ${field.value ? 'translate-x-6' : 'translate-x-0'} bg-white rounded-full shadow`} />
                                      <input
                                        type="checkbox"
                                        className="sr-only"
                                        {...field}
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                      />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={notificationForm.control}
                              name="smsNotifications"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                  <div>
                                    <FormLabel className="font-medium text-base">SMS Notifications</FormLabel>
                                    <FormDescription>
                                      Receive notifications via text message
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <div className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out border-2 border-transparent rounded-full cursor-pointer ${field.value ? 'bg-primary' : 'bg-gray-200'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}>
                                      <span className={`inline-block w-5 h-5 transition duration-200 ease-in-out transform ${field.value ? 'translate-x-6' : 'translate-x-0'} bg-white rounded-full shadow`} />
                                      <input
                                        type="checkbox"
                                        className="sr-only"
                                        {...field}
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                      />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <div className="border-b pb-6">
                          <h3 className="font-medium text-lg mb-4">Notification Types</h3>
                          
                          <div className="space-y-4">
                            <FormField
                              control={notificationForm.control}
                              name="paymentReminders"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                  <div>
                                    <FormLabel className="font-medium text-base">Payment Reminders</FormLabel>
                                    <FormDescription>
                                      Receive reminders about upcoming rent payments
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <div className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out border-2 border-transparent rounded-full cursor-pointer ${field.value ? 'bg-primary' : 'bg-gray-200'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}>
                                      <span className={`inline-block w-5 h-5 transition duration-200 ease-in-out transform ${field.value ? 'translate-x-6' : 'translate-x-0'} bg-white rounded-full shadow`} />
                                      <input
                                        type="checkbox"
                                        className="sr-only"
                                        {...field}
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                      />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={notificationForm.control}
                              name="maintenanceUpdates"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                  <div>
                                    <FormLabel className="font-medium text-base">Maintenance Updates</FormLabel>
                                    <FormDescription>
                                      Receive updates about maintenance requests
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <div className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out border-2 border-transparent rounded-full cursor-pointer ${field.value ? 'bg-primary' : 'bg-gray-200'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}>
                                      <span className={`inline-block w-5 h-5 transition duration-200 ease-in-out transform ${field.value ? 'translate-x-6' : 'translate-x-0'} bg-white rounded-full shadow`} />
                                      <input
                                        type="checkbox"
                                        className="sr-only"
                                        {...field}
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                      />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={notificationForm.control}
                              name="propertyAlerts"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                  <div>
                                    <FormLabel className="font-medium text-base">Property Alerts</FormLabel>
                                    <FormDescription>
                                      Receive alerts about new property listings
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <div className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out border-2 border-transparent rounded-full cursor-pointer ${field.value ? 'bg-primary' : 'bg-gray-200'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}>
                                      <span className={`inline-block w-5 h-5 transition duration-200 ease-in-out transform ${field.value ? 'translate-x-6' : 'translate-x-0'} bg-white rounded-full shadow`} />
                                      <input
                                        type="checkbox"
                                        className="sr-only"
                                        {...field}
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                      />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={notificationForm.control}
                              name="marketingEmails"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                  <div>
                                    <FormLabel className="font-medium text-base">Marketing Emails</FormLabel>
                                    <FormDescription>
                                      Receive promotional offers and updates
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <div className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out border-2 border-transparent rounded-full cursor-pointer ${field.value ? 'bg-primary' : 'bg-gray-200'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}>
                                      <span className={`inline-block w-5 h-5 transition duration-200 ease-in-out transform ${field.value ? 'translate-x-6' : 'translate-x-0'} bg-white rounded-full shadow`} />
                                      <input
                                        type="checkbox"
                                        className="sr-only"
                                        {...field}
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                      />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            className="bg-primary hover:bg-primary-light"
                            disabled={updateNotificationsMutation.isPending}
                          >
                            {updateNotificationsMutation.isPending ? "Saving..." : "Save Preferences"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-heading">Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="border-b pb-6">
                        <h3 className="font-medium text-lg mb-4">Change Password</h3>
                        
                        <Form {...passwordForm}>
                          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <FormField
                              control={passwordForm.control}
                              name="currentPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Current Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={passwordForm.control}
                              name="newPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>New Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={passwordForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirm New Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="flex justify-end">
                              <Button 
                                type="submit" 
                                className="bg-primary hover:bg-primary-light"
                                disabled={changePasswordMutation.isPending}
                              >
                                {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </div>
                      
                      <div className="border-b pb-6">
                        <h3 className="font-medium text-lg mb-4">Two-Factor Authentication</h3>
                        <p className="text-text-medium mb-4">
                          Add an extra layer of security to your account by enabling two-factor authentication
                        </p>
                        
                        <Button className="bg-primary hover:bg-primary-light">
                          Set Up Two-Factor Authentication
                        </Button>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg mb-4">Device Activity</h3>
                        <p className="text-text-medium mb-4">
                          These devices have logged into your account recently
                        </p>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-center border-b pb-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mr-3">
                                <span className="material-icons text-primary">laptop</span>
                              </div>
                              <div>
                                <p className="font-medium">MacBook Pro</p>
                                <p className="text-sm text-text-medium">New York, USA · Current Session</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-text-medium">
                              <span className="material-icons text-sm mr-1">logout</span>
                              Log Out
                            </Button>
                          </div>
                          
                          <div className="flex justify-between items-center border-b pb-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mr-3">
                                <span className="material-icons text-primary">smartphone</span>
                              </div>
                              <div>
                                <p className="font-medium">iPhone 13</p>
                                <p className="text-sm text-text-medium">New York, USA · 2 days ago</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-text-medium">
                              <span className="material-icons text-sm mr-1">logout</span>
                              Log Out
                            </Button>
                          </div>
                        </div>
                      </div>
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
