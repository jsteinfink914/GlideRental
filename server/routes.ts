import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";

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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const savedProperties = await storage.getUserSavedProperties(req.user.id);
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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const savedProperty = await storage.createSavedProperty({
        userId: req.user.id,
        propertyId: req.body.propertyId
      });
      res.status(201).json(savedProperty);
    } catch (error) {
      res.status(500).json({ message: "Error saving property" });
    }
  });
  
  app.delete("/api/saved-properties/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
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
  app.post("/api/nearby-places", async (req, res) => {
    const { lat, lng, type, radius = 1000 } = req.body;
    
    try {
      // In a real implementation, we would call Google Places API here
      // This is just a placeholder to match the expected response structure
      const mockPlaces = [
        { 
          name: type === "gym" ? "Fitness Center" : "Local Grocery", 
          lat: lat + 0.002, 
          lng: lng + 0.003,
          distance: "0.3 miles",
          rating: 4.5
        }
      ];
      
      res.json({ places: mockPlaces });
    } catch (error) {
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
    
    try {
      // In a real implementation, we'd call the Google Directions API
      // This is just a placeholder
      res.json({
        distance: "0.5 miles",
        duration: "10 mins",
        route: [
          { lat: origin.lat, lng: origin.lng },
          { lat: (origin.lat + destination.lat) / 2, lng: (origin.lng + destination.lng) / 2 },
          { lat: destination.lat, lng: destination.lng }
        ]
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate route" });
    }
  });

  // User preferences endpoint
  app.get("/api/user/preferences", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const userId = req.user.id;
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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const userId = req.user.id;
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