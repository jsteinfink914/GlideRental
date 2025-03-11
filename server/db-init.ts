import { db } from "./db";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import { log } from "./vite";

export async function initializeDatabase() {
  try {
    log("Initializing database...", "db");
    
    // Test the connection
    await db.execute(sql`SELECT 1`);
    log("Database connection successful", "db");
    
    // Try to create all tables if they don't exist
    try {
      log("Creating database tables...", "db");
      
      // Execute the SQL to create each table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" SERIAL PRIMARY KEY,
          "username" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "firstName" TEXT NOT NULL,
          "lastName" TEXT NOT NULL,
          "userType" TEXT NOT NULL,
          "phoneNumber" TEXT,
          "profileImage" TEXT,
          "onboardingCompleted" BOOLEAN,
          "creditScore" INTEGER,
          "income" INTEGER,
          "documentsUploaded" JSONB,
          "documentVerificationStatus" JSONB,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "user_preferences" (
          "id" SERIAL PRIMARY KEY,
          "userId" INTEGER NOT NULL,
          "budget" JSONB NOT NULL,
          "moveInDate" TEXT NOT NULL,
          "bedroomsMin" INTEGER NOT NULL,
          "bedroomsMax" INTEGER NOT NULL,
          "bathroomsMin" INTEGER NOT NULL,
          "bathroomsMax" INTEGER NOT NULL,
          "neighborhoodPreferences" TEXT[],
          "amenities" TEXT[],
          "propertyTypes" TEXT[],
          "petFriendly" BOOLEAN,
          "furnished" BOOLEAN,
          "utilitiesIncluded" BOOLEAN,
          "accessibility" BOOLEAN,
          "gym" TEXT,
          "grocery" TEXT,
          "commute" JSONB,
          "nightlife" BOOLEAN,
          "safety" INTEGER,
          "schools" BOOLEAN,
          "parks" BOOLEAN,
          "publicTransport" BOOLEAN,
          "poiTypes" TEXT[],
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "properties" (
          "id" SERIAL PRIMARY KEY,
          "landlordId" INTEGER NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "address" TEXT NOT NULL,
          "neighborhood" TEXT NOT NULL,
          "city" TEXT NOT NULL,
          "state" TEXT NOT NULL,
          "zipCode" TEXT NOT NULL,
          "rent" INTEGER NOT NULL,
          "bedrooms" INTEGER NOT NULL,
          "bathrooms" INTEGER NOT NULL,
          "squareFeet" INTEGER,
          "lat" DOUBLE PRECISION,
          "lon" DOUBLE PRECISION,
          "propertyType" TEXT NOT NULL,
          "isPublished" BOOLEAN,
          "availableDate" TEXT,
          "leaseLength" INTEGER,
          "hasInUnitLaundry" BOOLEAN,
          "hasDishwasher" BOOLEAN,
          "petFriendly" BOOLEAN,
          "hasDoorman" BOOLEAN,
          "hasElevator" BOOLEAN,
          "hasGym" BOOLEAN,
          "hasParking" BOOLEAN,
          "utilitiesIncluded" BOOLEAN,
          "furnished" BOOLEAN,
          "amenities" TEXT[],
          "embedding" DOUBLE PRECISION[],
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "buildings" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "landlordId" INTEGER NOT NULL,
          "address" TEXT NOT NULL,
          "neighborhood" TEXT NOT NULL,
          "city" TEXT NOT NULL,
          "state" TEXT NOT NULL,
          "zipCode" TEXT NOT NULL,
          "amenities" TEXT[],
          "embedding" DOUBLE PRECISION[],
          "numberOfUnits" INTEGER NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "landlord_criteria" (
          "id" SERIAL PRIMARY KEY,
          "propertyId" INTEGER NOT NULL,
          "minIncome" INTEGER,
          "minCreditScore" INTEGER,
          "requiresEmploymentVerification" BOOLEAN,
          "requiresRentalHistory" BOOLEAN,
          "requiresBackgroundCheck" BOOLEAN,
          "petsAllowed" BOOLEAN,
          "smokingAllowed" BOOLEAN,
          "maxOccupants" INTEGER,
          "preferredMoveInDate" TEXT,
          "leaseLength" INTEGER NOT NULL,
          "additionalRequirements" TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "messages" (
          "id" SERIAL PRIMARY KEY,
          "senderId" INTEGER NOT NULL,
          "receiverId" INTEGER NOT NULL,
          "content" TEXT NOT NULL,
          "isRead" BOOLEAN NOT NULL,
          "propertyId" INTEGER,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "saved_properties" (
          "id" SERIAL PRIMARY KEY,
          "userId" INTEGER NOT NULL,
          "propertyId" INTEGER NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "maintenance_requests" (
          "id" SERIAL PRIMARY KEY,
          "title" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "propertyId" INTEGER NOT NULL,
          "tenantId" INTEGER NOT NULL,
          "status" TEXT NOT NULL,
          "priority" TEXT NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "payments" (
          "id" SERIAL PRIMARY KEY,
          "type" TEXT NOT NULL,
          "propertyId" INTEGER NOT NULL,
          "tenantId" INTEGER NOT NULL,
          "amount" INTEGER NOT NULL,
          "status" TEXT NOT NULL,
          "dueDate" TEXT,
          "paidDate" TIMESTAMP,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "rental_applications" (
          "id" SERIAL PRIMARY KEY,
          "landlordId" INTEGER NOT NULL,
          "propertyId" INTEGER NOT NULL,
          "userId" INTEGER NOT NULL,
          "message" TEXT,
          "status" TEXT NOT NULL,
          "moveInDate" TEXT,
          "submittedDocuments" JSONB,
          "landlordNotes" TEXT,
          "isQuickApplication" BOOLEAN,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      log("Database tables created successfully", "db");
      return true;
    } catch (error) {
      log(`Error creating database tables: ${error}`, "db");
      throw error;
    }
  } catch (error) {
    log(`Database initialization failed: ${error}`, "db");
    throw error;
  }
}