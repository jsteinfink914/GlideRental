import { pgTable, text, serial, integer, boolean, json, date, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  userType: text("user_type").notNull().default("renter"), // "renter" or "landlord"
  phoneNumber: text("phone_number"),
  profileImage: text("profile_image"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  roommateCode: text("roommate_code"),
  roommates: json("roommates").$type<number[]>(),
  documentsUploaded: json("documents_uploaded").$type<{
    w2?: string | null,
    bankStatements?: string | null,
    payStubs?: string | null,
    identificationDocument?: string | null,
    proofOfInsurance?: string | null,
    employmentVerification?: string | null,
    creditReport?: string | null,
    rentalHistory?: string | null,
    references?: string | null,
    additionalDocuments?: string[] | null
  }>().default({} as any),
  documentVerificationStatus: json("document_verification_status").$type<{
    w2?: boolean,
    bankStatements?: boolean,
    payStubs?: boolean,
    identificationDocument?: boolean,
    proofOfInsurance?: boolean,
    employmentVerification?: boolean,
    creditReport?: boolean,
    rentalHistory?: boolean,
    references?: boolean
  }>().default({} as any),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Property schema
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  landlordId: integer("landlord_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  neighborhood: text("neighborhood").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  rent: integer("rent").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: real("bathrooms").notNull(),
  squareFeet: integer("square_feet"),
  propertyType: text("property_type").notNull(), // apartment, house, condo, etc.
  availableDate: date("available_date").notNull(),
  isPublished: boolean("is_published").notNull().default(true),
  hasVirtualTour: boolean("has_virtual_tour").default(false),
  hasDoorman: boolean("has_doorman").default(false),
  hasInUnitLaundry: boolean("has_in_unit_laundry").default(false),
  hasDishwasher: boolean("has_dishwasher").default(false),
  petFriendly: boolean("pet_friendly").default(false),
  rating: real("rating"),
  noFee: boolean("no_fee").default(false),
  latitude: real("latitude"),
  longitude: real("longitude"),
  images: text("images").array(),
  amenities: text("amenities").array(),
  embedding: json("embedding").$type<number[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  embedding: true,
});

// Buildings schema
export const buildings = pgTable("buildings", {
  id: serial("id").primaryKey(),
  landlordId: integer("landlord_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  neighborhood: text("neighborhood").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  numberOfUnits: integer("number_of_units").notNull(),
  amenities: text("amenities").array(),
  embedding: json("embedding").$type<number[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBuildingSchema = createInsertSchema(buildings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  embedding: true,
});

// Messages schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  propertyId: integer("property_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Saved Properties / Likes schema
export const savedProperties = pgTable("saved_properties", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  propertyId: integer("property_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSavedPropertySchema = createInsertSchema(savedProperties).omit({
  id: true,
  createdAt: true,
});

// Maintenance Requests schema
export const maintenanceRequests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  propertyId: integer("property_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // pending, in-progress, completed
  priority: text("priority").notNull().default("medium"), // low, medium, high
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Payments schema
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  propertyId: integer("property_id").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  type: text("type").notNull(), // rent, security deposit, application fee
  dueDate: date("due_date"),
  paidDate: timestamp("paid_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  paidDate: true,
  createdAt: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

export type InsertBuilding = z.infer<typeof insertBuildingSchema>;
export type Building = typeof buildings.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertSavedProperty = z.infer<typeof insertSavedPropertySchema>;
export type SavedProperty = typeof savedProperties.$inferSelect;

export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;
export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// User Preferences schema
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  budget: json("budget").$type<{min: number, max: number}>().notNull(),
  moveInDate: date("move_in_date").notNull(),
  neighborhoodPreferences: text("neighborhood_preferences").array(),
  bedroomsMin: integer("bedrooms_min").notNull(),
  bedroomsMax: integer("bedrooms_max").notNull(),
  bathroomsMin: real("bathrooms_min").notNull(),
  propertyTypes: text("property_types").array(),
  amenities: text("amenities").array(),
  hasPets: boolean("has_pets").default(false),
  isSmoker: boolean("is_smoker").default(false),
  income: integer("income"),
  creditScore: integer("credit_score"),
  isEmployed: boolean("is_employed").default(false),
  employmentVerified: boolean("employment_verified").default(false),
  hasRentalHistory: boolean("has_rental_history").default(false),
  rentalHistoryVerified: boolean("rental_history_verified").default(false),
  lifestyle: json("lifestyle").$type<{
    noiseLevel: string, // quiet, moderate, lively
    cleanliness: string, // very clean, generally clean, relaxed
    guestPreference: string, // rarely, occasionally, frequently
    workSchedule: string, // daytime, nighttime, varies
    personality: string, // introverted, extroverted, mixed
  }>(),
  dealBreakers: text("deal_breakers").array(),
  // POI preferences
  gym: text("gym").default(''),
  grocery: text("grocery").default(''),
  poiTypes: text("poi_types").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Landlord Renter Criteria schema
export const landlordCriteria = pgTable("landlord_criteria", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().unique(),
  minIncome: integer("min_income"),
  minCreditScore: integer("min_credit_score"),
  requiresEmploymentVerification: boolean("requires_employment_verification").default(true),
  requiresRentalHistory: boolean("requires_rental_history").default(true),
  allowsPets: boolean("allows_pets").default(false),
  allowsSmoking: boolean("allows_smoking").default(false),
  leaseLength: integer("lease_length").notNull(), // in months
  requiredDocuments: text("required_documents").array(),
  additionalRequirements: text("additional_requirements"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLandlordCriteriaSchema = createInsertSchema(landlordCriteria).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Rental Application schema
export const rentalApplications = pgTable("rental_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  propertyId: integer("property_id").notNull(),
  landlordId: integer("landlord_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, denied, withdrawn
  submittedDocuments: json("submitted_documents").$type<{
    w2?: boolean,
    bankStatements?: boolean,
    payStubs?: boolean,
    identificationDocument?: boolean,
    proofOfInsurance?: boolean,
    employmentVerification?: boolean,
    creditReport?: boolean,
    rentalHistory?: boolean,
    references?: boolean,
    additionalDocuments?: string[]
  }>().default({} as any),
  message: text("message"),
  landlordNotes: text("landlord_notes"),
  moveInDate: date("move_in_date"),
  isQuickApplication: boolean("is_quick_application").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRentalApplicationSchema = createInsertSchema(rentalApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Additional type exports
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

export type InsertLandlordCriteria = z.infer<typeof insertLandlordCriteriaSchema>;
export type LandlordCriteria = typeof landlordCriteria.$inferSelect;

export type InsertRentalApplication = z.infer<typeof insertRentalApplicationSchema>;
export type RentalApplication = typeof rentalApplications.$inferSelect;
