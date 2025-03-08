import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPropertySchema, insertSavedPropertySchema, insertMessageSchema, insertMaintenanceRequestSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Middleware to ensure user is authenticated
  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to ensure user is a landlord
  const ensureLandlord = (req, res, next) => {
    if (req.isAuthenticated() && req.user.userType === "landlord") {
      return next();
    }
    res.status(403).json({ message: "Forbidden: Landlord access required" });
  };

  // Properties API
  app.get("/api/properties", async (req, res, next) => {
    try {
      // Parse query parameters for filtering
      const querySchema = z.object({
        neighborhood: z.string().optional(),
        minRent: z.string().transform(val => parseInt(val, 10)).optional(),
        maxRent: z.string().transform(val => parseInt(val, 10)).optional(),
        bedrooms: z.string().transform(val => parseInt(val, 10)).optional(),
        bathrooms: z.string().transform(val => parseFloat(val)).optional(),
        propertyType: z.string().optional(),
        hasInUnitLaundry: z.string().transform(val => val === "true").optional(),
        hasDishwasher: z.string().transform(val => val === "true").optional(),
        petFriendly: z.string().transform(val => val === "true").optional(),
        hasDoorman: z.string().transform(val => val === "true").optional(),
        hasVirtualTour: z.string().transform(val => val === "true").optional(),
        noFee: z.string().transform(val => val === "true").optional(),
      });

      const query = querySchema.parse(req.query);
      
      // Convert query parameters to filters
      const filters: Record<string, any> = {};
      
      if (query.neighborhood) filters.neighborhood = query.neighborhood;
      if (query.bedrooms) filters.bedrooms = query.bedrooms;
      if (query.bathrooms) filters.bathrooms = query.bathrooms;
      if (query.propertyType) filters.propertyType = query.propertyType;
      if (query.hasInUnitLaundry !== undefined) filters.hasInUnitLaundry = query.hasInUnitLaundry;
      if (query.hasDishwasher !== undefined) filters.hasDishwasher = query.hasDishwasher;
      if (query.petFriendly !== undefined) filters.petFriendly = query.petFriendly;
      if (query.hasDoorman !== undefined) filters.hasDoorman = query.hasDoorman;
      if (query.hasVirtualTour !== undefined) filters.hasVirtualTour = query.hasVirtualTour;
      if (query.noFee !== undefined) filters.noFee = query.noFee;
      
      let properties = await storage.getProperties(filters);
      
      // Apply rent range filtering
      if (query.minRent) {
        properties = properties.filter(p => p.rent >= query.minRent!);
      }
      
      if (query.maxRent) {
        properties = properties.filter(p => p.rent <= query.maxRent!);
      }
      
      // Only return published properties
      properties = properties.filter(p => p.isPublished);
      
      res.json(properties);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.get("/api/properties/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/properties", ensureLandlord, async (req, res, next) => {
    try {
      const propertyData = insertPropertySchema.parse(req.body);
      
      // Set landlordId to current user
      propertyData.landlordId = req.user.id;
      
      const property = await storage.createProperty(propertyData);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  app.put("/api/properties/:id", ensureLandlord, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Check if user is the landlord of this property
      if (property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: You don't own this property" });
      }
      
      const propertyUpdate = req.body;
      const updatedProperty = await storage.updateProperty(id, propertyUpdate);
      res.json(updatedProperty);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/properties/:id", ensureLandlord, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Check if user is the landlord of this property
      if (property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: You don't own this property" });
      }
      
      await storage.deleteProperty(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Saved Properties API
  app.get("/api/saved-properties", ensureAuthenticated, async (req, res, next) => {
    try {
      const savedProperties = await storage.getUserSavedProperties(req.user.id);
      
      // Get the full property details for each saved property
      const propertyDetails = await Promise.all(
        savedProperties.map(async (saved) => {
          const property = await storage.getProperty(saved.propertyId);
          return {
            savedId: saved.id,
            savedAt: saved.createdAt,
            property
          };
        })
      );
      
      res.json(propertyDetails);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/saved-properties", ensureAuthenticated, async (req, res, next) => {
    try {
      const savedPropertyData = insertSavedPropertySchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if property exists
      const property = await storage.getProperty(savedPropertyData.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Check if already saved
      const userSaved = await storage.getUserSavedProperties(req.user.id);
      const alreadySaved = userSaved.some(saved => saved.propertyId === savedPropertyData.propertyId);
      
      if (alreadySaved) {
        return res.status(400).json({ message: "Property already saved" });
      }
      
      const savedProperty = await storage.createSavedProperty(savedPropertyData);
      res.status(201).json(savedProperty);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });
  
  app.delete("/api/saved-properties/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const savedProperty = await storage.getSavedProperty(id);
      
      if (!savedProperty) {
        return res.status(404).json({ message: "Saved property not found" });
      }
      
      // Check if user owns this saved property
      if (savedProperty.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: You don't own this saved property" });
      }
      
      await storage.deleteSavedProperty(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Messages API
  app.get("/api/messages", ensureAuthenticated, async (req, res, next) => {
    try {
      const messages = await storage.getUserMessages(req.user.id);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/messages", ensureAuthenticated, async (req, res, next) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id
      });
      
      // Check if receiver exists
      const receiver = await storage.getUser(messageData.receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      // If propertyId is provided, check if it exists
      if (messageData.propertyId) {
        const property = await storage.getProperty(messageData.propertyId);
        if (!property) {
          return res.status(404).json({ message: "Property not found" });
        }
      }
      
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });
  
  app.put("/api/messages/:id/read", ensureAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const message = await storage.getMessage(id);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Check if user is the recipient
      if (message.receiverId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: You are not the recipient of this message" });
      }
      
      const updatedMessage = await storage.markMessageAsRead(id);
      res.json(updatedMessage);
    } catch (error) {
      next(error);
    }
  });
  
  // Maintenance Requests API
  app.get("/api/maintenance-requests", ensureAuthenticated, async (req, res, next) => {
    try {
      // Different behavior based on user type
      if (req.user.userType === "landlord") {
        // Get properties owned by landlord
        const properties = await storage.getLandlordProperties(req.user.id);
        const propertyIds = properties.map(p => p.id);
        
        // Get maintenance requests for all properties
        let allRequests = [];
        for (const propertyId of propertyIds) {
          const requests = await storage.getPropertyMaintenanceRequests(propertyId);
          allRequests = [...allRequests, ...requests];
        }
        
        res.json(allRequests);
      } else {
        // For renters, just get their own requests
        const requests = await storage.getUserMaintenanceRequests(req.user.id);
        res.json(requests);
      }
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/maintenance-requests", ensureAuthenticated, async (req, res, next) => {
    try {
      const requestData = insertMaintenanceRequestSchema.parse({
        ...req.body,
        tenantId: req.user.id
      });
      
      // Check if property exists
      const property = await storage.getProperty(requestData.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const request = await storage.createMaintenanceRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });
  
  app.put("/api/maintenance-requests/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const request = await storage.getMaintenanceRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Maintenance request not found" });
      }
      
      // Check authorization
      if (req.user.userType === "landlord") {
        // Landlord can only update status
        const property = await storage.getProperty(request.propertyId);
        
        if (property?.landlordId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: You don't own this property" });
        }
        
        // Landlords can only update status and priority
        const allowedUpdates = ["status", "priority"];
        const requestUpdate = Object.fromEntries(
          Object.entries(req.body).filter(([key]) => allowedUpdates.includes(key))
        );
        
        const updatedRequest = await storage.updateMaintenanceRequest(id, requestUpdate);
        res.json(updatedRequest);
      } else {
        // Tenant can only update their own requests
        if (request.tenantId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: This is not your maintenance request" });
        }
        
        // Tenants can only update title and description
        const allowedUpdates = ["title", "description"];
        const requestUpdate = Object.fromEntries(
          Object.entries(req.body).filter(([key]) => allowedUpdates.includes(key))
        );
        
        const updatedRequest = await storage.updateMaintenanceRequest(id, requestUpdate);
        res.json(updatedRequest);
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Payments API
  app.get("/api/payments", ensureAuthenticated, async (req, res, next) => {
    try {
      // Different behavior based on user type
      if (req.user.userType === "landlord") {
        // Get properties owned by landlord
        const properties = await storage.getLandlordProperties(req.user.id);
        const propertyIds = properties.map(p => p.id);
        
        // Get payments for all properties
        let allPayments = [];
        for (const propertyId of propertyIds) {
          const payments = await storage.getPropertyPayments(propertyId);
          allPayments = [...allPayments, ...payments];
        }
        
        res.json(allPayments);
      } else {
        // For renters, just get their own payments
        const payments = await storage.getUserPayments(req.user.id);
        res.json(payments);
      }
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/payments", ensureAuthenticated, async (req, res, next) => {
    try {
      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        tenantId: req.user.id
      });
      
      // Check if property exists
      const property = await storage.getProperty(paymentData.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });
  
  app.put("/api/payments/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const payment = await storage.getPayment(id);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Only the person who made the payment can update it
      if (payment.tenantId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: This is not your payment" });
      }
      
      // Can only update status to "completed"
      if (req.body.status && req.body.status === "completed") {
        const now = new Date();
        const updatedPayment = await storage.updatePayment(id, { 
          status: "completed",
          paidDate: now
        });
        res.json(updatedPayment);
      } else {
        res.status(400).json({ message: "Invalid payment update" });
      }
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
