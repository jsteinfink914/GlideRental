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
          "first_name" TEXT NOT NULL,
          "last_name" TEXT NOT NULL,
          "user_type" TEXT NOT NULL,
          "phone_number" TEXT,
          "profile_image" TEXT,
          "onboarding_completed" BOOLEAN,
          "roommate_code" TEXT,
          "roommate_group_id" TEXT,
          "roommates" JSONB,
          "credit_score" INTEGER,
          "income" INTEGER,
          "documents_uploaded" JSONB,
          "document_verification_status" JSONB,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "user_preferences" (
          "id" SERIAL PRIMARY KEY,
          "user_id" INTEGER NOT NULL,
          "budget" JSONB NOT NULL,
          "move_in_date" TEXT NOT NULL,
          "bedrooms_min" INTEGER NOT NULL,
          "bedrooms_max" INTEGER NOT NULL,
          "bathrooms_min" INTEGER NOT NULL,
          "bathrooms_max" INTEGER NOT NULL,
          "neighborhood_preferences" TEXT[],
          "amenities" TEXT[],
          "property_types" TEXT[],
          "pet_friendly" BOOLEAN,
          "furnished" BOOLEAN,
          "utilities_included" BOOLEAN,
          "accessibility" BOOLEAN,
          "gym" TEXT,
          "grocery" TEXT,
          "commute" JSONB,
          "nightlife" BOOLEAN,
          "safety" INTEGER,
          "schools" BOOLEAN,
          "parks" BOOLEAN,
          "public_transport" BOOLEAN,
          "poi_types" TEXT[],
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "properties" (
          "id" SERIAL PRIMARY KEY,
          "landlord_id" INTEGER NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "address" TEXT NOT NULL,
          "neighborhood" TEXT NOT NULL,
          "city" TEXT NOT NULL,
          "state" TEXT NOT NULL,
          "zip_code" TEXT NOT NULL,
          "rent" INTEGER NOT NULL,
          "bedrooms" INTEGER NOT NULL,
          "bathrooms" INTEGER NOT NULL,
          "square_feet" INTEGER,
          "lat" DOUBLE PRECISION,
          "lon" DOUBLE PRECISION,
          "property_type" TEXT NOT NULL,
          "is_published" BOOLEAN,
          "available_date" TEXT,
          "lease_length" INTEGER,
          "has_in_unit_laundry" BOOLEAN,
          "has_dishwasher" BOOLEAN,
          "pet_friendly" BOOLEAN,
          "has_doorman" BOOLEAN,
          "has_elevator" BOOLEAN,
          "has_gym" BOOLEAN,
          "has_parking" BOOLEAN,
          "utilities_included" BOOLEAN,
          "furnished" BOOLEAN,
          "amenities" TEXT[],
          "embedding" DOUBLE PRECISION[],
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "buildings" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "landlord_id" INTEGER NOT NULL,
          "address" TEXT NOT NULL,
          "neighborhood" TEXT NOT NULL,
          "city" TEXT NOT NULL,
          "state" TEXT NOT NULL,
          "zip_code" TEXT NOT NULL,
          "amenities" TEXT[],
          "embedding" DOUBLE PRECISION[],
          "number_of_units" INTEGER NOT NULL,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "landlord_criteria" (
          "id" SERIAL PRIMARY KEY,
          "property_id" INTEGER NOT NULL,
          "min_income" INTEGER,
          "min_credit_score" INTEGER,
          "requires_employment_verification" BOOLEAN,
          "requires_rental_history" BOOLEAN,
          "requires_background_check" BOOLEAN,
          "pets_allowed" BOOLEAN,
          "smoking_allowed" BOOLEAN,
          "max_occupants" INTEGER,
          "preferred_move_in_date" TEXT,
          "lease_length" INTEGER NOT NULL,
          "additional_requirements" TEXT,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "messages" (
          "id" SERIAL PRIMARY KEY,
          "sender_id" INTEGER NOT NULL,
          "receiver_id" INTEGER NOT NULL,
          "content" TEXT NOT NULL,
          "is_read" BOOLEAN NOT NULL,
          "property_id" INTEGER,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "saved_properties" (
          "id" SERIAL PRIMARY KEY,
          "user_id" INTEGER NOT NULL,
          "property_id" INTEGER NOT NULL,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "maintenance_requests" (
          "id" SERIAL PRIMARY KEY,
          "title" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "property_id" INTEGER NOT NULL,
          "tenant_id" INTEGER NOT NULL,
          "status" TEXT NOT NULL,
          "priority" TEXT NOT NULL,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "payments" (
          "id" SERIAL PRIMARY KEY,
          "type" TEXT NOT NULL,
          "property_id" INTEGER NOT NULL,
          "tenant_id" INTEGER NOT NULL,
          "amount" INTEGER NOT NULL,
          "status" TEXT NOT NULL,
          "due_date" TEXT,
          "paid_date" TIMESTAMP,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS "rental_applications" (
          "id" SERIAL PRIMARY KEY,
          "landlord_id" INTEGER NOT NULL,
          "property_id" INTEGER NOT NULL,
          "user_id" INTEGER NOT NULL,
          "message" TEXT,
          "status" TEXT NOT NULL,
          "move_in_date" TEXT,
          "submitted_documents" JSONB,
          "landlord_notes" TEXT,
          "is_quick_application" BOOLEAN,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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