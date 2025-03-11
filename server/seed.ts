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
      // Using snake_case column names from db-init.ts
      log("Creating landlord user with snake_case column names", "seed");
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
    
    // Step 3: Create a sample building
    let buildingId = null;
    try {
      const buildingResult = await db.execute(sql`
        INSERT INTO buildings (
          name,
          landlord_id,
          address,
          neighborhood,
          city,
          state,
          zip_code,
          number_of_units,
          amenities
        ) 
        VALUES (
          'Riverfront Apartments',
          ${landlordId},
          '100 River Street',
          'Downtown',
          'New York',
          'NY',
          '10001',
          24,
          ARRAY['Gym', 'Pool', 'Doorman', 'Elevator']
        )
        RETURNING id;
      `);
      
      if (buildingResult && buildingResult.rows && buildingResult.rows.length > 0) {
        buildingId = buildingResult.rows[0].id;
        log(`Created building with ID ${buildingId}`, "seed");
      }
    } catch (error) {
      log(`Error creating building: ${error}`, "seed");
      // Continue without building id
    }
    
    // Step 4: Prepare property data
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
        isPublished: true,
        availableDate: new Date().toISOString(),
        images: [
          "https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
          "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
        ],
        amenities: ["Dishwasher", "In-Unit Laundry", "Doorman", "Central AC"],
        lat: 40.7431,
        lon: -73.9923,
        buildingId: buildingId // First property is in the building
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
        isPublished: true,
        availableDate: new Date().toISOString(),
        images: [
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2053&q=80",
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
        ],
        amenities: ["In-Unit Laundry", "Dishwasher", "Backyard", "Central AC", "Parking"],
        lat: 40.7735,
        lon: -73.9565,
        buildingId: null // This is a standalone property
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
        isPublished: true,
        availableDate: new Date().toISOString(),
        images: [
          "https://images.unsplash.com/photo-1489171078254-c3365d6e359f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2031&q=80",
          "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
        ],
        amenities: ["Doorman", "Dishwasher", "Roof Deck", "Gym", "Central AC"],
        lat: 40.7326,
        lon: -73.9935,
        buildingId: buildingId // Second property in the building
      }
    ];
    
    // Step 5: Create properties with landlordId
    const properties = propertyTemplates.map(template => ({
      ...template,
      landlordId
    }));
    
    // Step 6: Insert properties using database-specific column names
    let createdPropertyCount = 0;
    for (const propertyData of properties) {
      try {
        await db.execute(sql`
          INSERT INTO properties (
            landlord_id,
            building_id,
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
            has_in_unit_laundry,
            has_dishwasher,
            pet_friendly,
            has_doorman,
            lat,
            lon,
            amenities,
            images
          ) 
          VALUES (
            ${landlordId}, 
            ${propertyData.buildingId},
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
            ${propertyData.hasInUnitLaundry},
            ${propertyData.hasDishwasher},
            ${propertyData.petFriendly},
            ${propertyData.hasDoorman},
            ${propertyData.lat},
            ${propertyData.lon},
            ARRAY[${propertyData.amenities.map(a => `'${a}'`).join(', ')}]::TEXT[],
            ARRAY[${propertyData.images.map(img => `'${img}'`).join(', ')}]::TEXT[]
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