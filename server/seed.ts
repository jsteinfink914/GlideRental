import { storage } from "./storage";
import { InsertProperty } from "@shared/schema";
import { log } from "./vite";
import { db } from "./db";
import { sql } from "drizzle-orm";

async function seedDatabase() {
  log("Seeding database with sample data...", "seed");
  
  try {
    // Step 1: Get or create landlord user
    let landlord = await storage.getUserByUsername("landlord");
    let landlordId = 1; // Default value
    
    if (landlord) {
      landlordId = landlord.id;
      log(`Using existing landlord with ID ${landlordId}`, "seed");
    } else {
      // Using camelCase column names as discovered in database inspection
      log("Creating landlord user with camelCase column names", "seed");
      try {
        const result = await db.execute(sql`
          INSERT INTO users (
            username, 
            password, 
            email, 
            first_name, 
            last_name, 
            user_type, 
            onboarding_completed, 
            phone_number
          ) 
          VALUES (
            'landlord', 
            'password123', 
            'landlord@example.com', 
            'Property', 
            'Manager', 
            'landlord', 
            true, 
            '555-123-4567'
          )
          RETURNING *;
        `);
        
        if (result && result.rows && result.rows.length > 0) {
          const newLandlord = result.rows[0] as any;
          landlordId = newLandlord.id;
          log(`Created landlord user with ID ${landlordId}`, "seed");
        } else {
          log("Failed to create landlord user, using default ID 1", "seed");
        }
      } catch (error) {
        log(`Error creating landlord: ${error}, using default ID 1`, "seed");
      }
    }
  
    // Step 2: Check if properties already exist
    const existingProperties = await storage.getProperties();
    if (existingProperties.length > 0) {
      log(`${existingProperties.length} properties already exist, skipping property creation`, "seed");
      return;
    }
    
    // Step 3: Prepare property data
    const propertyTemplates = [
      {
        title: "Modern 2-Bedroom Apartment",
        description: "Bright and spacious 2-bedroom apartment with hardwood floors, stainless steel appliances, and in-unit laundry.",
        rent: 2800,
        address: "123 Main St",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        neighborhood: "Chelsea",
        propertyType: "Apartment",
        bedrooms: 2,
        bathrooms: 1,
        squareFeet: 950,
        hasInUnitLaundry: true,
        hasDishwasher: true,
        petFriendly: true,
        hasDoorman: true,
        hasVirtualTour: true,
        isPublished: true,
        noFee: false,
        availableDate: new Date().toISOString(),
        images: [
          "https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
          "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
        ],
        amenities: ["Dishwasher", "In-Unit Laundry", "Doorman", "Central AC"],
        latitude: 40.7431,
        longitude: -73.9923
      },
      {
        title: "Spacious 3-Bedroom Townhouse",
        description: "Beautiful townhouse with 3 bedrooms, 2.5 bathrooms, a private backyard, and modern finishes throughout.",
        rent: 3500,
        address: "456 Park Ave",
        city: "New York",
        state: "NY",
        zipCode: "10022",
        neighborhood: "Upper East Side",
        propertyType: "Townhouse",
        bedrooms: 3,
        bathrooms: 2.5,
        squareFeet: 1800,
        hasInUnitLaundry: true,
        hasDishwasher: true,
        petFriendly: false,
        hasDoorman: false,
        hasVirtualTour: false,
        isPublished: true,
        noFee: true,
        availableDate: new Date().toISOString(),
        images: [
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2053&q=80",
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
        ],
        amenities: ["In-Unit Laundry", "Dishwasher", "Backyard", "Central AC", "Parking"],
        latitude: 40.7735,
        longitude: -73.9565
      },
      {
        title: "Luxury Studio Apartment",
        description: "High-end studio apartment with floor-to-ceiling windows, premium finishes, and building amenities including gym and roof deck.",
        rent: 2200,
        address: "789 Broadway",
        city: "New York",
        state: "NY",
        zipCode: "10003",
        neighborhood: "Greenwich Village",
        propertyType: "Studio",
        bedrooms: 0,
        bathrooms: 1,
        squareFeet: 550,
        hasInUnitLaundry: false,
        hasDishwasher: true,
        petFriendly: true,
        hasDoorman: true,
        hasVirtualTour: true,
        isPublished: true,
        noFee: false,
        availableDate: new Date().toISOString(),
        images: [
          "https://images.unsplash.com/photo-1489171078254-c3365d6e359f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2031&q=80",
          "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
        ],
        amenities: ["Doorman", "Dishwasher", "Roof Deck", "Gym", "Central AC"],
        latitude: 40.7326,
        longitude: -73.9935
      }
    ];
    
    // Step 4: Create properties with landlordId
    const properties: InsertProperty[] = propertyTemplates.map(template => ({
      ...template,
      landlordId
    }));
    
    // Step 5: Insert properties using database-specific column names
    let createdPropertyCount = 0;
    for (const propertyData of properties) {
      try {
        await db.execute(sql`
          INSERT INTO properties (
            landlord_id,
            title,
            description,
            address,
            neighborhood,
            city,
            state,
            zip_code,
            rent,
            bedrooms,
            bathrooms,
            square_feet,
            property_type,
            available_date,
            is_published,
            has_virtual_tour,
            has_doorman,
            has_in_unit_laundry,
            has_dishwasher,
            pet_friendly,
            no_fee,
            latitude,
            longitude,
            images,
            amenities
          ) 
          VALUES (
            ${landlordId}, 
            ${propertyData.title},
            ${propertyData.description},
            ${propertyData.address},
            ${propertyData.neighborhood},
            ${propertyData.city},
            ${propertyData.state},
            ${propertyData.zipCode},
            ${propertyData.rent},
            ${propertyData.bedrooms},
            ${propertyData.bathrooms},
            ${propertyData.squareFeet},
            ${propertyData.propertyType},
            ${propertyData.availableDate},
            ${propertyData.isPublished},
            ${propertyData.hasVirtualTour},
            ${propertyData.hasDoorman},
            ${propertyData.hasInUnitLaundry},
            ${propertyData.hasDishwasher},
            ${propertyData.petFriendly},
            ${propertyData.noFee},
            ${propertyData.latitude},
            ${propertyData.longitude},
            ${propertyData.images},
            ${propertyData.amenities}
          )
        `);
        createdPropertyCount++;
      } catch (error) {
        log(`Error creating property: ${error}`, "seed");
      }
    }
    
    log(`Created ${createdPropertyCount} sample properties`, "seed");
  } catch (error) {
    log(`Error seeding database: ${error}`, "seed");
    throw error;
  }
}

export { seedDatabase };