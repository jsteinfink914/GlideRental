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
