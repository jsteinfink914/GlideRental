import { storage } from "./storage";
import { InsertProperty, InsertUser } from "@shared/schema";

async function seedDatabase() {
  console.log("Seeding database with sample data...");
  
  // Create landlord user if not exists
  let landlord = await storage.getUserByUsername("landlord");
  
  if (!landlord) {
    const landlordData: InsertUser = {
      username: "landlord",
      password: "password123", // This will be hashed by auth.ts
      email: "landlord@example.com",
      firstName: "Property",
      lastName: "Manager",
      userType: "landlord",
      onboardingCompleted: true,
      phoneNumber: "555-123-4567"
    };
    landlord = await storage.createUser(landlordData);
    console.log("Created landlord user");
  }
  
  // Check if properties already exist
  const existingProperties = await storage.getProperties();
  if (existingProperties.length > 0) {
    console.log(`${existingProperties.length} properties already exist, skipping property creation`);
    return;
  }
  
  // Sample property data
  const properties: InsertProperty[] = [
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
        "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
      ],
      amenities: ["Dishwasher", "In-Unit Laundry", "Doorman", "Central AC"],
      landlordId: landlord.id
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
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1564078516393-cf04bd966897?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2187&q=80"
      ],
      amenities: ["In-Unit Laundry", "Dishwasher", "Backyard", "Central AC", "Parking"],
      landlordId: landlord.id
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
        "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1560448205-4d9b3e6bb6db?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
      ],
      amenities: ["Doorman", "Dishwasher", "Roof Deck", "Gym", "Central AC"],
      landlordId: landlord.id
    },
    {
      title: "Cozy 1-Bedroom Apartment",
      description: "Charming 1-bedroom apartment with classic NYC details including brick walls and large windows. Great downtown location.",
      rent: 2400,
      address: "321 Thompson St",
      city: "New York",
      state: "NY",
      zipCode: "10012",
      neighborhood: "SoHo",
      propertyType: "Apartment",
      bedrooms: 1,
      bathrooms: 1,
      squareFeet: 650,
      hasInUnitLaundry: false,
      hasDishwasher: false,
      petFriendly: false,
      hasDoorman: false,
      hasVirtualTour: false,
      isPublished: true,
      noFee: true,
      availableDate: new Date().toISOString(),
      images: [
        "https://images.unsplash.com/photo-1499916078039-922301b0eb9b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2080&q=80",
        "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2187&q=80",
        "https://images.unsplash.com/photo-1574643156929-51fa098b0394?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2080&q=80"
      ],
      amenities: ["Central AC", "Pre-War Details", "Exposed Brick"],
      landlordId: landlord.id
    },
    {
      title: "Luxury 2-Bedroom Loft",
      description: "Stunning converted loft with high ceilings, exposed brick, and chef's kitchen. Building offers 24/7 doorman and fitness center.",
      rent: 4200,
      address: "55 Hudson St",
      city: "New York",
      state: "NY",
      zipCode: "10013",
      neighborhood: "Tribeca",
      propertyType: "Loft",
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1400,
      hasInUnitLaundry: true,
      hasDishwasher: true,
      petFriendly: true,
      hasDoorman: true,
      hasVirtualTour: true,
      isPublished: true,
      noFee: false,
      availableDate: new Date().toISOString(),
      images: [
        "https://images.unsplash.com/photo-1484101403633-562f891dc89a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
      ],
      amenities: ["In-Unit Laundry", "Dishwasher", "Doorman", "Central AC", "Gym", "High Ceilings", "Parking"],
      landlordId: landlord.id
    },
    {
      title: "Modern 3-Bedroom Brooklyn Brownstone",
      description: "Beautifully renovated brownstone unit with 3 bedrooms, 2 bathrooms, private garden, and premium finishes throughout.",
      rent: 3900,
      address: "123 Bedford Ave",
      city: "Brooklyn",
      state: "NY",
      zipCode: "11211",
      neighborhood: "Williamsburg",
      propertyType: "Brownstone",
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1600,
      hasInUnitLaundry: true,
      hasDishwasher: true,
      petFriendly: true,
      hasDoorman: false,
      hasVirtualTour: true,
      isPublished: true,
      noFee: true,
      availableDate: new Date().toISOString(),
      images: [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2158&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2080&q=80",
        "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2080&q=80"
      ],
      amenities: ["In-Unit Laundry", "Dishwasher", "Private Garden", "Central AC", "Renovated Kitchen", "Pet Friendly"],
      landlordId: landlord.id
    }
  ];
  
  // Create properties
  for (const propertyData of properties) {
    await storage.createProperty(propertyData);
  }
  
  console.log(`Created ${properties.length} sample properties`);
}

export { seedDatabase };