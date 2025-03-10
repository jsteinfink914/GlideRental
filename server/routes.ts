import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";

// Development mode toggle - set to true to bypass authentication for API endpoints
const DEVELOPMENT_MODE = true;

interface PropertyQuery {
  description: string;
  preferences?: {
    neighborhood?: string;
    priceRange?: { min?: number; max?: number };
    amenities?: string[];
    proximity?: string[];
  };
}

interface AIPropertySuggestion {
  propertyIds: number[];
  explanation: string;
  relevanceScores: { [propertyId: number]: number };
  highlightedAreas?: { 
    center: { lat: number; lng: number };
    radius: number;
    score: number;
  }[];
}

/**
 * Uses GPT-4o to analyze user preferences and return property recommendations
 */
async function getAIPropertyRecommendations(
  query: PropertyQuery,
): Promise<AIPropertySuggestion> {
  // Placeholder implementation that would call the OpenAI API
  return {
    propertyIds: [1, 2, 3],
    explanation: "These properties best match your criteria based on location, amenities, and price range.",
    relevanceScores: { 1: 0.95, 2: 0.87, 3: 0.82 },
    highlightedAreas: [
      { center: { lat: 40.737, lng: -73.992 }, radius: 1000, score: 0.9 }
    ]
  };
}

/**
 * Processes natural language location queries
 */
async function processLocationQuery(
  locationQuery: string
): Promise<{lat: number, lng: number, neighborhood: string}> {
  // Placeholder implementation
  return {
    lat: 40.737,
    lng: -73.992,
    neighborhood: "Greenwich Village"
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  setupAuth(app);
  
  // Properties endpoints - No authentication required to view properties
  app.get("/api/properties", async (req, res) => {
    try {
      console.log("Fetching properties");
      const properties = await storage.getProperties();
      console.log(`Returning ${properties.length} properties`);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Error fetching properties" });
    }
  });
  
  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getProperty(parseInt(req.params.id));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Error fetching property" });
    }
  });
  
  // Saved properties endpoints
  app.get("/api/saved-properties", async (req, res) => {
    // In development mode, use a default user ID (1) for saved properties
    // Using the conditional operator to ensure userId is always a number
    
    if (!DEVELOPMENT_MODE && !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Default to user ID 1 in development mode or if not authenticated
    const userId = DEVELOPMENT_MODE ? 1 : (req.isAuthenticated() ? req.user.id : 1);
    
    try {
      const savedProperties = await storage.getUserSavedProperties(userId);
      const result = await Promise.all(
        savedProperties.map(async (saved) => {
          const property = await storage.getProperty(saved.propertyId);
          return { savedId: saved.id, property };
        })
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Error fetching saved properties" });
    }
  });
  
  app.post("/api/saved-properties", async (req, res) => {
    // In development mode, use a default user ID (1) for saved properties
    
    if (!DEVELOPMENT_MODE && !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Default to user ID 1 in development mode or if not authenticated
    const userId = DEVELOPMENT_MODE ? 1 : (req.isAuthenticated() ? req.user.id : 1);
    
    try {
      const savedProperty = await storage.createSavedProperty({
        userId: userId,
        propertyId: req.body.propertyId
      });
      res.status(201).json(savedProperty);
    } catch (error) {
      console.error("Error saving property:", error);
      res.status(500).json({ message: "Error saving property" });
    }
  });
  
  app.delete("/api/saved-properties/:id", async (req, res) => {
    if (!DEVELOPMENT_MODE && !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const success = await storage.deleteSavedProperty(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Saved property not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting saved property" });
    }
  });

  // Maps API key route
  app.get("/api/maps-key", (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || "";
    if (!apiKey) {
      console.warn("Google Maps API key not found in environment variables");
    }
    console.log("Returning Google Maps API key:", apiKey);
    res.json({ key: apiKey });
  });

  // Places API route for finding nearby amenities
  app.get("/api/nearby-places", async (req, res) => {
    const { lat, lng, type, keyword, radius = 1000 } = req.query;
    
    try {
      console.log(`Searching for nearby ${type} (${keyword}) near ${lat},${lng}`);
      
      // Since we don't have direct access to Google Places API in our test environment,
      // we'll return realistic data based on the input parameters
      const placesData = [
        { 
          name: keyword === "Whole Foods" ? "Whole Foods Market" : 
                keyword === "Trader Joe's" ? "Trader Joe's" :
                type === "gym" ? "Equinox Fitness" : 
                type === "supermarket" ? "Grocery Store" :
                type === "restaurant" ? "Local Restaurant" :
                type === "school" ? "Public School" :
                type === "cafe" ? "Coffee Shop" :
                "Local Business", 
          lat: Number(lat) + 0.002, 
          lng: Number(lng) + 0.003,
          distance: "0.3 miles",
          rating: 4.5
        },
        { 
          name: keyword === "Whole Foods" ? "Whole Foods Express" : 
                keyword === "Trader Joe's" ? "Trader Joe's Market" :
                type === "gym" ? "Planet Fitness" : 
                type === "supermarket" ? "Local Market" :
                type === "restaurant" ? "Fine Dining" :
                type === "school" ? "Private Academy" :
                type === "cafe" ? "Specialty Coffee" :
                "Neighborhood Shop", 
          lat: Number(lat) - 0.001, 
          lng: Number(lng) + 0.002,
          distance: "0.5 miles",
          rating: 4.2
        }
      ];
      
      // Sort places by distance (we're using random realistic data but in production this would be real distance)
      const sortedPlaces = placesData.sort((a, b) => {
        // Psuedo distance calculation for demo purposes
        const distA = Math.hypot(Number(lat) - a.lat, Number(lng) - a.lng);
        const distB = Math.hypot(Number(lat) - b.lat, Number(lng) - b.lng);
        return distA - distB;
      });
      
      res.json({ places: sortedPlaces });
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      res.status(500).json({ error: "Failed to fetch nearby places" });
    }
  });

  // Natural language property search
  app.post("/api/properties/ai-recommendations", async (req, res) => {
    const query: PropertyQuery = req.body;
    
    try {
      const recommendations = await getAIPropertyRecommendations(query);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate AI recommendations" });
    }
  });

  // Route processing
  app.post("/api/routes", async (req, res) => {
    const { origin, destination, mode = "WALKING" } = req.body;
    
    if (!origin || !destination || !origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      return res.status(400).json({ error: "Missing required coordinates" });
    }
    
    try {
      console.log(`Calculating route from ${origin.lat},${origin.lng} to ${destination.lat},${destination.lng}, mode: ${mode}`);
      
      // Generate points along a straight line with a slight curve
      const numPoints = 10;
      const route = [];
      
      // Add origin
      route.push({ lat: origin.lat, lng: origin.lng });
      
      // Linear interpolation with a slight vertical curve
      for (let i = 1; i < numPoints - 1; i++) {
        const t = i / numPoints;
        // Linear interpolation
        const lat = origin.lat + t * (destination.lat - origin.lat);
        const lng = origin.lng + t * (destination.lng - origin.lng);
        
        // Add some randomness to create a more realistic route
        const latOffset = (Math.random() - 0.5) * 0.0005;
        const lngOffset = (Math.random() - 0.5) * 0.0005;
        
        route.push({ lat: lat + latOffset, lng: lng + lngOffset });
      }
      
      // Add destination
      route.push({ lat: destination.lat, lng: destination.lng });
      
      // Calculate straight-line distance in miles
      const R = 3958.8; // Earth radius in miles
      const dLat = (destination.lat - origin.lat) * (Math.PI / 180);
      const dLng = (destination.lng - origin.lng) * (Math.PI / 180);
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(origin.lat * (Math.PI / 180)) * 
        Math.cos(destination.lat * (Math.PI / 180)) * 
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      // Distance in miles with 2 decimal places
      const distanceStr = `${distance.toFixed(2)} mi`;
      
      // Assuming walking speed of 3 mph
      const walkingSpeed = 3.0; // mph
      const timeHours = distance / walkingSpeed;
      const timeMinutes = Math.round(timeHours * 60);
      
      // Format duration
      let durationStr;
      if (timeMinutes < 1) {
        durationStr = "Less than 1 min";
      } else if (timeMinutes < 60) {
        durationStr = `${timeMinutes} ${timeMinutes === 1 ? 'min' : 'mins'}`;
      } else {
        const hours = Math.floor(timeMinutes / 60);
        const mins = timeMinutes % 60;
        durationStr = `${hours} ${hours === 1 ? 'hr' : 'hrs'}${mins > 0 ? ` ${mins} ${mins === 1 ? 'min' : 'mins'}` : ''}`;
      }
      
      console.log(`Route calculated: ${distanceStr}, ${durationStr}`);
      
      res.json({
        distance: distanceStr,
        duration: durationStr,
        route: route
      });
    } catch (error) {
      console.error("Failed to calculate route:", error);
      res.status(500).json({ error: "Failed to calculate route" });
    }
  });

  // User preferences endpoint
  app.get("/api/user/preferences", async (req, res) => {
    // In development mode, use a default user ID (1) for preferences
    
    if (!DEVELOPMENT_MODE && !req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Default to user ID 1 in development mode or if not authenticated
    const userId = DEVELOPMENT_MODE ? 1 : (req.isAuthenticated() ? req.user.id : 1);
    
    try {
      const userPreferences = await storage.getUserPreferences(userId);
      
      if (!userPreferences) {
        return res.json({ gym: "", grocery: "", poiTypes: [] });
      }
      
      res.json(userPreferences);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user preferences" });
    }
  });
  
  app.post("/api/user/preferences", async (req, res) => {
    // In development mode, use a default user ID (1) for preferences
    
    if (!DEVELOPMENT_MODE && !req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Default to user ID 1 in development mode or if not authenticated
    const userId = DEVELOPMENT_MODE ? 1 : (req.isAuthenticated() ? req.user.id : 1);
    
    try {
      const { gym, grocery, poiTypes } = req.body;
      
      const existingPreferences = await storage.getUserPreferences(userId);
      
      let preferences;
      if (existingPreferences) {
        preferences = await storage.updateUserPreferences(userId, {
          ...req.body,
          userId
        });
      } else {
        // Create new preferences with required fields and POI preferences
        preferences = await storage.createUserPreferences({
          userId,
          budget: { min: 0, max: 5000 },
          moveInDate: new Date().toISOString(),
          bedroomsMin: 0,
          bedroomsMax: 5,
          bathroomsMin: 1,
          gym: gym || '',
          grocery: grocery || '',
          poiTypes: poiTypes || []
        });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Failed to save user preferences:", error);
      res.status(500).json({ error: "Failed to save user preferences" });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected');
    
    ws.on('message', (message) => {
      console.log('Received: %s', message);
      // Process WebSocket messages here
    });
    
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  return httpServer;
}