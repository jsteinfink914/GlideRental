CREATE TABLE "buildings" (
	"id" serial PRIMARY KEY NOT NULL,
	"landlord_id" integer NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"neighborhood" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"number_of_units" integer NOT NULL,
	"amenities" text[],
	"embedding" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landlord_criteria" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"min_income" integer,
	"min_credit_score" integer,
	"requires_employment_verification" boolean DEFAULT true,
	"requires_rental_history" boolean DEFAULT true,
	"allows_pets" boolean DEFAULT false,
	"allows_smoking" boolean DEFAULT false,
	"lease_length" integer NOT NULL,
	"required_documents" text[],
	"additional_requirements" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "landlord_criteria_property_id_unique" UNIQUE("property_id")
);
--> statement-breakpoint
CREATE TABLE "maintenance_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"property_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"type" text NOT NULL,
	"due_date" date,
	"paid_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"landlord_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"address" text NOT NULL,
	"neighborhood" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"rent" integer NOT NULL,
	"bedrooms" integer NOT NULL,
	"bathrooms" real NOT NULL,
	"square_feet" integer,
	"property_type" text NOT NULL,
	"available_date" date NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"has_virtual_tour" boolean DEFAULT false,
	"has_doorman" boolean DEFAULT false,
	"has_in_unit_laundry" boolean DEFAULT false,
	"has_dishwasher" boolean DEFAULT false,
	"pet_friendly" boolean DEFAULT false,
	"rating" real,
	"no_fee" boolean DEFAULT false,
	"latitude" real,
	"longitude" real,
	"images" text[],
	"amenities" text[],
	"embedding" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"landlord_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"submitted_documents" json DEFAULT '{}'::json,
	"message" text,
	"landlord_notes" text,
	"move_in_date" date,
	"is_quick_application" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"budget" json NOT NULL,
	"move_in_date" date NOT NULL,
	"neighborhood_preferences" text[],
	"bedrooms_min" integer NOT NULL,
	"bedrooms_max" integer NOT NULL,
	"bathrooms_min" real NOT NULL,
	"property_types" text[],
	"amenities" text[],
	"has_pets" boolean DEFAULT false,
	"is_smoker" boolean DEFAULT false,
	"income" integer,
	"credit_score" integer,
	"is_employed" boolean DEFAULT false,
	"employment_verified" boolean DEFAULT false,
	"has_rental_history" boolean DEFAULT false,
	"rental_history_verified" boolean DEFAULT false,
	"lifestyle" json,
	"deal_breakers" text[],
	"gym" text DEFAULT '',
	"grocery" text DEFAULT '',
	"poi_types" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"user_type" text DEFAULT 'renter' NOT NULL,
	"phone_number" text,
	"profile_image" text,
	"onboarding_completed" boolean DEFAULT false,
	"roommate_code" text,
	"roommates" json,
	"documents_uploaded" json DEFAULT '{}'::json,
	"document_verification_status" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
