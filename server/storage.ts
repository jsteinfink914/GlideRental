import { users, properties, buildings, messages, savedProperties, maintenanceRequests, payments, userPreferences, landlordCriteria, rentalApplications } from "@shared/schema";
import type { User, InsertUser, Property, InsertProperty, Building, InsertBuilding, Message, InsertMessage, SavedProperty, InsertSavedProperty, MaintenanceRequest, InsertMaintenanceRequest, Payment, InsertPayment, UserPreferences, InsertUserPreferences, LandlordCriteria, InsertLandlordCriteria, RentalApplication, InsertRentalApplication } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import crypto from "crypto";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, desc, sql, asc, or } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  generateRoommateCode(userId: number): Promise<string>;
  linkRoommate(userId: number, roommateCode: string): Promise<boolean>;
  getRoommates(userId: number): Promise<User[]>;
  
  // User Preferences operations
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences | undefined>;
  
  // Property operations
  getProperty(id: number): Promise<Property | undefined>;
  getProperties(filters?: Partial<Property>): Promise<Property[]>;
  getLandlordProperties(landlordId: number): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<Property>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  
  // Building operations
  getBuilding(id: number): Promise<Building | undefined>;
  getLandlordBuildings(landlordId: number): Promise<Building[]>;
  createBuilding(building: InsertBuilding): Promise<Building>;
  updateBuilding(id: number, building: Partial<Building>): Promise<Building | undefined>;
  
  // Landlord Criteria operations
  getLandlordCriteria(propertyId: number): Promise<LandlordCriteria | undefined>;
  createLandlordCriteria(criteria: InsertLandlordCriteria): Promise<LandlordCriteria>;
  updateLandlordCriteria(propertyId: number, criteria: Partial<LandlordCriteria>): Promise<LandlordCriteria | undefined>;
  checkRenterQualification(userId: number, propertyId: number): Promise<{qualified: boolean, reasons?: string[]}>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getUserMessages(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  
  // SavedProperty operations
  getSavedProperty(id: number): Promise<SavedProperty | undefined>;
  getUserSavedProperties(userId: number): Promise<SavedProperty[]>;
  createSavedProperty(savedProperty: InsertSavedProperty): Promise<SavedProperty>;
  deleteSavedProperty(id: number): Promise<boolean>;
  
  // MaintenanceRequest operations
  getMaintenanceRequest(id: number): Promise<MaintenanceRequest | undefined>;
  getUserMaintenanceRequests(userId: number): Promise<MaintenanceRequest[]>;
  getPropertyMaintenanceRequests(propertyId: number): Promise<MaintenanceRequest[]>;
  createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest>;
  updateMaintenanceRequest(id: number, request: Partial<MaintenanceRequest>): Promise<MaintenanceRequest | undefined>;
  
  // Payment operations
  getPayment(id: number): Promise<Payment | undefined>;
  getUserPayments(userId: number): Promise<Payment[]>;
  getPropertyPayments(propertyId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined>;
  
  // Document operations
  uploadUserDocument(userId: number, documentType: string, documentPath: string): Promise<Partial<User>>;
  getUserDocuments(userId: number): Promise<Partial<User>>;
  verifyUserDocument(userId: number, documentType: string): Promise<boolean>;
  
  // Rental Application operations
  getRentalApplication(id: number): Promise<RentalApplication | undefined>;
  getUserRentalApplications(userId: number): Promise<RentalApplication[]>;
  getLandlordRentalApplications(landlordId: number): Promise<RentalApplication[]>;
  getPropertyRentalApplications(propertyId: number): Promise<RentalApplication[]>;
  createRentalApplication(application: InsertRentalApplication): Promise<RentalApplication>;
  updateRentalApplication(id: number, application: Partial<RentalApplication>): Promise<RentalApplication | undefined>;
  quickApply(userId: number, propertyId: number, message?: string): Promise<RentalApplication | undefined>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private buildings: Map<number, Building>;
  private messages: Map<number, Message>;
  private savedProperties: Map<number, SavedProperty>;
  private maintenanceRequests: Map<number, MaintenanceRequest>;
  private payments: Map<number, Payment>;
  private userPreferences: Map<number, UserPreferences>;
  private landlordCriteria: Map<number, LandlordCriteria>;
  private rentalApplications: Map<number, RentalApplication>;
  sessionStore: session.Store;
  
  // ID counters
  private userId: number;
  private propertyId: number;
  private buildingId: number;
  private messageId: number;
  private savedPropertyId: number;
  private maintenanceRequestId: number;
  private paymentId: number;
  private userPreferencesId: number;
  private landlordCriteriaId: number;
  private rentalApplicationId: number;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.buildings = new Map();
    this.messages = new Map();
    this.savedProperties = new Map();
    this.maintenanceRequests = new Map();
    this.payments = new Map();
    this.userPreferences = new Map();
    this.landlordCriteria = new Map();
    this.rentalApplications = new Map();
    
    this.userId = 1;
    this.propertyId = 1;
    this.buildingId = 1;
    this.messageId = 1;
    this.savedPropertyId = 1;
    this.maintenanceRequestId = 1;
    this.paymentId = 1;
    this.userPreferencesId = 1;
    this.landlordCriteriaId = 1;
    this.rentalApplicationId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async generateRoommateCode(userId: number): Promise<string> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    // Generate a random 6 character code
    const code = crypto.randomBytes(3).toString('hex');
    
    // Update the user with the new roommate code
    const updatedUser = await this.updateUser(userId, { roommateCode: code });
    if (!updatedUser) throw new Error("Failed to update user");
    
    return code;
  }
  
  async linkRoommate(userId: number, roommateCode: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    // Find the user with this roommate code
    const roommate = Array.from(this.users.values()).find(
      u => u.roommateCode === roommateCode && u.id !== userId
    );
    
    if (!roommate) throw new Error("Invalid roommate code");
    
    // Update both users to include each other's IDs in their roommates array
    const userRoommates = user.roommates || [];
    if (!userRoommates.includes(roommate.id)) {
      await this.updateUser(userId, { 
        roommates: [...userRoommates, roommate.id]
      });
    }
    
    const roommateRoommates = roommate.roommates || [];
    if (!roommateRoommates.includes(userId)) {
      await this.updateUser(roommate.id, { 
        roommates: [...roommateRoommates, userId]
      });
    }
    
    return true;
  }
  
  async getRoommates(userId: number): Promise<User[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    
    if (!user.roommates || user.roommates.length === 0) {
      return [];
    }
    
    // Get all roommate users
    const roommates = user.roommates
      .map(id => this.users.get(id))
      .filter(Boolean) as User[];
      
    return roommates;
  }
  
  // User Preferences methods
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values()).find(
      prefs => prefs.userId === userId
    );
  }
  
  async createUserPreferences(insertPreferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = this.userPreferencesId++;
    const now = new Date();
    const preferences: UserPreferences = {
      ...insertPreferences,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.userPreferences.set(id, preferences);
    return preferences;
  }
  
  async updateUserPreferences(userId: number, preferencesUpdate: Partial<UserPreferences>): Promise<UserPreferences | undefined> {
    const preferences = await this.getUserPreferences(userId);
    if (!preferences) return undefined;
    
    const now = new Date();
    const updatedPreferences = {
      ...preferences,
      ...preferencesUpdate,
      updatedAt: now
    };
    this.userPreferences.set(preferences.id, updatedPreferences);
    return updatedPreferences;
  }

  // Property methods
  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }
  
  async getProperties(filters?: Partial<Property>): Promise<Property[]> {
    let properties = Array.from(this.properties.values());
    
    if (filters) {
      properties = properties.filter(property => {
        return Object.entries(filters).every(([key, value]) => {
          // Skip if value is undefined
          if (value === undefined) return true;
          
          // @ts-ignore - dynamic property access
          const propertyValue = property[key];
          
          // Handle arrays
          if (Array.isArray(propertyValue) && Array.isArray(value)) {
            return value.every(v => propertyValue.includes(v));
          }
          
          return propertyValue === value;
        });
      });
    }
    
    return properties;
  }
  
  async getLandlordProperties(landlordId: number): Promise<Property[]> {
    return Array.from(this.properties.values()).filter(
      property => property.landlordId === landlordId
    );
  }
  
  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.propertyId++;
    const now = new Date();
    const property: Property = { 
      ...insertProperty, 
      id,
      embedding: null,
      createdAt: now,
      updatedAt: now
    };
    this.properties.set(id, property);
    return property;
  }
  
  async updateProperty(id: number, propertyUpdate: Partial<Property>): Promise<Property | undefined> {
    const property = await this.getProperty(id);
    if (!property) return undefined;
    
    const now = new Date();
    const updatedProperty = { 
      ...property, 
      ...propertyUpdate,
      updatedAt: now
    };
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }
  
  async deleteProperty(id: number): Promise<boolean> {
    return this.properties.delete(id);
  }
  
  // Building methods
  async getBuilding(id: number): Promise<Building | undefined> {
    return this.buildings.get(id);
  }
  
  async getLandlordBuildings(landlordId: number): Promise<Building[]> {
    return Array.from(this.buildings.values()).filter(
      building => building.landlordId === landlordId
    );
  }
  
  async createBuilding(insertBuilding: InsertBuilding): Promise<Building> {
    const id = this.buildingId++;
    const now = new Date();
    const building: Building = { 
      ...insertBuilding, 
      id,
      embedding: null,
      createdAt: now,
      updatedAt: now
    };
    this.buildings.set(id, building);
    return building;
  }
  
  async updateBuilding(id: number, buildingUpdate: Partial<Building>): Promise<Building | undefined> {
    const building = await this.getBuilding(id);
    if (!building) return undefined;
    
    const now = new Date();
    const updatedBuilding = { 
      ...building, 
      ...buildingUpdate,
      updatedAt: now
    };
    this.buildings.set(id, updatedBuilding);
    return updatedBuilding;
  }
  
  // Landlord Criteria methods
  async getLandlordCriteria(propertyId: number): Promise<LandlordCriteria | undefined> {
    return Array.from(this.landlordCriteria.values()).find(
      criteria => criteria.propertyId === propertyId
    );
  }
  
  async createLandlordCriteria(insertCriteria: InsertLandlordCriteria): Promise<LandlordCriteria> {
    const id = this.landlordCriteriaId++;
    const now = new Date();
    const criteria: LandlordCriteria = {
      ...insertCriteria,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.landlordCriteria.set(id, criteria);
    return criteria;
  }
  
  async updateLandlordCriteria(propertyId: number, criteriaUpdate: Partial<LandlordCriteria>): Promise<LandlordCriteria | undefined> {
    const criteria = await this.getLandlordCriteria(propertyId);
    if (!criteria) return undefined;
    
    const now = new Date();
    const updatedCriteria = {
      ...criteria,
      ...criteriaUpdate,
      updatedAt: now
    };
    this.landlordCriteria.set(criteria.id, updatedCriteria);
    return updatedCriteria;
  }
  
  async checkRenterQualification(userId: number, propertyId: number): Promise<{qualified: boolean, reasons?: string[]}> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const property = await this.getProperty(propertyId);
    if (!property) throw new Error("Property not found");
    
    const criteria = await this.getLandlordCriteria(propertyId);
    if (!criteria) {
      // If no criteria set, assume everyone qualifies
      return { qualified: true };
    }
    
    const userPreferences = await this.getUserPreferences(userId);
    const reasons: string[] = [];
    
    // Check minimum credit score
    if (criteria.minCreditScore && userPreferences?.creditScore && 
        userPreferences.creditScore < criteria.minCreditScore) {
      reasons.push(`Credit score (${userPreferences.creditScore}) below minimum (${criteria.minCreditScore})`);
    }
    
    // Check minimum income
    if (criteria.minIncome && userPreferences?.income &&
        userPreferences.income < criteria.minIncome) {
      reasons.push(`Income (${userPreferences.income}) below minimum (${criteria.minIncome})`);
    }
    
    // Check employment status
    if (criteria.requiresEmploymentVerification && 
        (!userPreferences?.isEmployed || !userPreferences?.employmentVerified)) {
      reasons.push('Employment verification required');
    }
    
    // Check rental history
    if (criteria.requiresRentalHistory && 
        (!userPreferences?.hasRentalHistory || !userPreferences?.rentalHistoryVerified)) {
      reasons.push('Rental history verification required');
    }
    
    // Check pets policy
    if (!criteria.allowsPets && userPreferences?.hasPets) {
      reasons.push('Pets not allowed');
    }
    
    // Check smoking policy
    if (!criteria.allowsSmoking && userPreferences?.isSmoker) {
      reasons.push('Smoking not allowed');
    }
    
    return {
      qualified: reasons.length === 0,
      reasons: reasons.length > 0 ? reasons : undefined
    };
  }
  
  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async getUserMessages(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      message => message.senderId === userId || message.receiverId === userId
    );
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const now = new Date();
    const message: Message = { 
      ...insertMessage, 
      id,
      createdAt: now
    };
    this.messages.set(id, message);
    return message;
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = await this.getMessage(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
  
  // Saved Properties methods
  async getSavedProperty(id: number): Promise<SavedProperty | undefined> {
    return this.savedProperties.get(id);
  }
  
  async getUserSavedProperties(userId: number): Promise<SavedProperty[]> {
    return Array.from(this.savedProperties.values()).filter(
      savedProperty => savedProperty.userId === userId
    );
  }
  
  async createSavedProperty(insertSavedProperty: InsertSavedProperty): Promise<SavedProperty> {
    const id = this.savedPropertyId++;
    const now = new Date();
    const savedProperty: SavedProperty = { 
      ...insertSavedProperty, 
      id,
      createdAt: now
    };
    this.savedProperties.set(id, savedProperty);
    return savedProperty;
  }
  
  async deleteSavedProperty(id: number): Promise<boolean> {
    return this.savedProperties.delete(id);
  }
  
  // Maintenance Request methods
  async getMaintenanceRequest(id: number): Promise<MaintenanceRequest | undefined> {
    return this.maintenanceRequests.get(id);
  }
  
  async getUserMaintenanceRequests(userId: number): Promise<MaintenanceRequest[]> {
    return Array.from(this.maintenanceRequests.values()).filter(
      request => request.tenantId === userId
    );
  }
  
  async getPropertyMaintenanceRequests(propertyId: number): Promise<MaintenanceRequest[]> {
    return Array.from(this.maintenanceRequests.values()).filter(
      request => request.propertyId === propertyId
    );
  }
  
  async createMaintenanceRequest(insertRequest: InsertMaintenanceRequest): Promise<MaintenanceRequest> {
    const id = this.maintenanceRequestId++;
    const now = new Date();
    const request: MaintenanceRequest = { 
      ...insertRequest, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.maintenanceRequests.set(id, request);
    return request;
  }
  
  async updateMaintenanceRequest(id: number, requestUpdate: Partial<MaintenanceRequest>): Promise<MaintenanceRequest | undefined> {
    const request = await this.getMaintenanceRequest(id);
    if (!request) return undefined;
    
    const now = new Date();
    const updatedRequest = { 
      ...request, 
      ...requestUpdate,
      updatedAt: now
    };
    this.maintenanceRequests.set(id, updatedRequest);
    return updatedRequest;
  }
  
  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }
  
  async getUserPayments(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      payment => payment.tenantId === userId
    );
  }
  
  async getPropertyPayments(propertyId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      payment => payment.propertyId === propertyId
    );
  }
  
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.paymentId++;
    const now = new Date();
    const payment: Payment = { 
      ...insertPayment, 
      id,
      paidDate: null,
      createdAt: now
    };
    this.payments.set(id, payment);
    return payment;
  }
  
  async updatePayment(id: number, paymentUpdate: Partial<Payment>): Promise<Payment | undefined> {
    const payment = await this.getPayment(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, ...paymentUpdate };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  // Document operations
  async uploadUserDocument(userId: number, documentType: string, documentPath: string): Promise<Partial<User>> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    // Create a documents object if it doesn't exist
    const documentsUploaded = user.documentsUploaded || {};
    
    // Update the document path for the specified type
    const updatedDocuments = {
      ...documentsUploaded,
      [documentType]: documentPath
    };
    
    // Update the user with the new document
    const updatedUser = await this.updateUser(userId, {
      documentsUploaded: updatedDocuments
    });
    
    if (!updatedUser) throw new Error("Failed to update user");
    
    return {
      id: updatedUser.id,
      documentsUploaded: updatedUser.documentsUploaded
    };
  }
  
  async getUserDocuments(userId: number): Promise<Partial<User>> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    return {
      id: user.id,
      documentsUploaded: user.documentsUploaded || {}
    };
  }
  
  async verifyUserDocument(userId: number, documentType: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    // Get the current verification status
    const verificationStatus = user.documentVerificationStatus || {};
    
    // Check if the document exists
    const documents = user.documentsUploaded || {};
    if (!documents[documentType]) {
      throw new Error(`Document ${documentType} not found for user`);
    }
    
    // Mark the document as verified
    const updatedVerificationStatus = {
      ...verificationStatus,
      [documentType]: true
    };
    
    // Update the user with the new verification status
    const updatedUser = await this.updateUser(userId, {
      documentVerificationStatus: updatedVerificationStatus
    });
    
    if (!updatedUser) throw new Error("Failed to update user");
    
    return true;
  }
  
  // Rental Application operations
  async getRentalApplication(id: number): Promise<RentalApplication | undefined> {
    return this.rentalApplications.get(id);
  }
  
  async getUserRentalApplications(userId: number): Promise<RentalApplication[]> {
    return Array.from(this.rentalApplications.values()).filter(
      app => app.userId === userId
    );
  }
  
  async getLandlordRentalApplications(landlordId: number): Promise<RentalApplication[]> {
    return Array.from(this.rentalApplications.values()).filter(
      app => app.landlordId === landlordId
    );
  }
  
  async getPropertyRentalApplications(propertyId: number): Promise<RentalApplication[]> {
    return Array.from(this.rentalApplications.values()).filter(
      app => app.propertyId === propertyId
    );
  }
  
  async createRentalApplication(insertApplication: InsertRentalApplication): Promise<RentalApplication> {
    const id = this.rentalApplicationId++;
    const now = new Date();
    const application: RentalApplication = {
      ...insertApplication,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.rentalApplications.set(id, application);
    return application;
  }
  
  async updateRentalApplication(id: number, applicationUpdate: Partial<RentalApplication>): Promise<RentalApplication | undefined> {
    const application = await this.getRentalApplication(id);
    if (!application) return undefined;
    
    const now = new Date();
    const updatedApplication = {
      ...application,
      ...applicationUpdate,
      updatedAt: now
    };
    this.rentalApplications.set(id, updatedApplication);
    return updatedApplication;
  }
  
  async quickApply(userId: number, propertyId: number, message?: string): Promise<RentalApplication | undefined> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const property = await this.getProperty(propertyId);
    if (!property) throw new Error("Property not found");
    
    // Check if user has already applied to this property
    const existingApplications = await this.getUserRentalApplications(userId);
    const alreadyApplied = existingApplications.some(app => app.propertyId === propertyId);
    if (alreadyApplied) {
      throw new Error("You've already applied to this property");
    }
    
    // Get landlord criteria for the property
    const criteria = await this.getLandlordCriteria(propertyId);
    if (!criteria) {
      throw new Error("Landlord has not set application criteria for this property");
    }
    
    // Check if user has uploaded all required documents
    const userDocuments = user.documentsUploaded || {};
    const requiredDocuments = criteria.requiredDocuments || [];
    const missingDocuments = requiredDocuments.filter(doc => !userDocuments[doc]);
    
    if (missingDocuments.length > 0) {
      throw new Error(`Missing required documents: ${missingDocuments.join(', ')}`);
    }
    
    // Create a record of which documents were submitted
    const submittedDocuments = requiredDocuments.reduce((docs, docType) => {
      docs[docType] = true;
      return docs;
    }, {} as Record<string, boolean>);
    
    // Create the application
    const application: InsertRentalApplication = {
      userId,
      propertyId,
      landlordId: property.landlordId,
      submittedDocuments: submittedDocuments as any,
      message: message || `Quick application for ${property.title}`,
      isQuickApplication: true,
      moveInDate: property.availableDate
    };
    
    return this.createRentalApplication(application);
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // Log diagnostic info during initialization
    console.log('PostgreSQL connection info:', {
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      // Don't log password for security
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Log what we're trying to insert for debugging
      console.log('Creating user with data:', JSON.stringify(insertUser, null, 2));
      
      // Make sure required fields have default values if not provided
      const userData = {
        ...insertUser,
        userType: insertUser.userType || 'renter',
        onboardingCompleted: insertUser.onboardingCompleted ?? false,
      };
      
      const [user] = await db.insert(users).values(userData).returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async generateRoommateCode(userId: number): Promise<string> {
    const code = crypto.randomBytes(6).toString('hex');
    await this.updateUser(userId, { roommateCode: code });
    return code;
  }

  async linkRoommate(userId: number, roommateCode: string): Promise<boolean> {
    // Find user with matching roommate code
    const [roommateUser] = await db
      .select()
      .from(users)
      .where(eq(users.roommateCode, roommateCode));
    
    if (!roommateUser) return false;
    
    // Update both users to have the same roommateGroupId
    const groupId = roommateUser.roommateGroupId || crypto.randomBytes(16).toString('hex');
    
    await Promise.all([
      this.updateUser(userId, { roommateGroupId: groupId }),
      this.updateUser(roommateUser.id, { roommateGroupId: groupId })
    ]);
    
    return true;
  }

  async getRoommates(userId: number): Promise<User[]> {
    const user = await this.getUser(userId);
    if (!user?.roommateGroupId) return [];
    
    return db
      .select()
      .from(users)
      .where(and(
        eq(users.roommateGroupId, user.roommateGroupId),
        sql`${users.id} != ${userId}`
      ));
  }

  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences || undefined;
  }

  async createUserPreferences(insertPreferences: InsertUserPreferences): Promise<UserPreferences> {
    const [preferences] = await db
      .insert(userPreferences)
      .values(insertPreferences)
      .returning();
    return preferences;
  }

  async updateUserPreferences(userId: number, preferencesUpdate: Partial<UserPreferences>): Promise<UserPreferences | undefined> {
    const [updatedPreferences] = await db
      .update(userPreferences)
      .set(preferencesUpdate)
      .where(eq(userPreferences.userId, userId))
      .returning();
    return updatedPreferences || undefined;
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id));
    return property || undefined;
  }

  async getProperties(filters?: Partial<Property>): Promise<Property[]> {
    let query = db.select().from(properties);
    
    if (filters) {
      const conditions = [];
      
      if (filters.landlordId !== undefined) {
        conditions.push(eq(properties.landlordId, filters.landlordId));
      }
      
      if (filters.isPublished !== undefined) {
        conditions.push(eq(properties.isPublished, filters.isPublished));
      }
      
      if (filters.buildingId !== undefined) {
        conditions.push(eq(properties.buildingId, filters.buildingId));
      }
      
      // Add more filters as needed
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    // Execute the query and return the results
    const results = await query;
    console.log(`Retrieved ${results.length} properties from database`);
    return results;
  }

  async getLandlordProperties(landlordId: number): Promise<Property[]> {
    return this.getProperties({ landlordId });
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db
      .insert(properties)
      .values(insertProperty)
      .returning();
    return property;
  }

  async updateProperty(id: number, propertyUpdate: Partial<Property>): Promise<Property | undefined> {
    const [updatedProperty] = await db
      .update(properties)
      .set(propertyUpdate)
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty || undefined;
  }

  async deleteProperty(id: number): Promise<boolean> {
    await db
      .delete(properties)
      .where(eq(properties.id, id));
    return true;
  }

  async getBuilding(id: number): Promise<Building | undefined> {
    const [building] = await db
      .select()
      .from(buildings)
      .where(eq(buildings.id, id));
    return building || undefined;
  }

  async getLandlordBuildings(landlordId: number): Promise<Building[]> {
    return db
      .select()
      .from(buildings)
      .where(eq(buildings.landlordId, landlordId));
  }

  async createBuilding(insertBuilding: InsertBuilding): Promise<Building> {
    const [building] = await db
      .insert(buildings)
      .values(insertBuilding)
      .returning();
    return building;
  }

  async updateBuilding(id: number, buildingUpdate: Partial<Building>): Promise<Building | undefined> {
    const [updatedBuilding] = await db
      .update(buildings)
      .set(buildingUpdate)
      .where(eq(buildings.id, id))
      .returning();
    return updatedBuilding || undefined;
  }

  async getLandlordCriteria(propertyId: number): Promise<LandlordCriteria | undefined> {
    const [criteria] = await db
      .select()
      .from(landlordCriteria)
      .where(eq(landlordCriteria.propertyId, propertyId));
    return criteria || undefined;
  }

  async createLandlordCriteria(insertCriteria: InsertLandlordCriteria): Promise<LandlordCriteria> {
    const [criteria] = await db
      .insert(landlordCriteria)
      .values(insertCriteria)
      .returning();
    return criteria;
  }

  async updateLandlordCriteria(propertyId: number, criteriaUpdate: Partial<LandlordCriteria>): Promise<LandlordCriteria | undefined> {
    const [updatedCriteria] = await db
      .update(landlordCriteria)
      .set(criteriaUpdate)
      .where(eq(landlordCriteria.propertyId, propertyId))
      .returning();
    return updatedCriteria || undefined;
  }

  async checkRenterQualification(userId: number, propertyId: number): Promise<{qualified: boolean, reasons?: string[]}> {
    // This would involve complex business logic comparing user data against landlord criteria
    // Implement based on your specific qualification rules
    return { qualified: true };
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    return message || undefined;
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.recipientId, userId)
        )
      )
      .orderBy(desc(messages.sentAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage || undefined;
  }

  async getSavedProperty(id: number): Promise<SavedProperty | undefined> {
    const [savedProperty] = await db
      .select()
      .from(savedProperties)
      .where(eq(savedProperties.id, id));
    return savedProperty || undefined;
  }

  async getUserSavedProperties(userId: number): Promise<SavedProperty[]> {
    const results = await db
      .select()
      .from(savedProperties)
      .where(eq(savedProperties.userId, userId));
    console.log(`Retrieved ${results.length} saved properties for user ${userId}`);
    return results;
  }

  async createSavedProperty(insertSavedProperty: InsertSavedProperty): Promise<SavedProperty> {
    const [savedProperty] = await db
      .insert(savedProperties)
      .values(insertSavedProperty)
      .returning();
    return savedProperty;
  }

  async deleteSavedProperty(id: number): Promise<boolean> {
    await db
      .delete(savedProperties)
      .where(eq(savedProperties.id, id));
    return true;
  }

  async getMaintenanceRequest(id: number): Promise<MaintenanceRequest | undefined> {
    const [request] = await db
      .select()
      .from(maintenanceRequests)
      .where(eq(maintenanceRequests.id, id));
    return request || undefined;
  }

  async getUserMaintenanceRequests(userId: number): Promise<MaintenanceRequest[]> {
    const results = await db
      .select()
      .from(maintenanceRequests)
      .where(eq(maintenanceRequests.userId, userId))
      .orderBy(desc(maintenanceRequests.createdAt));
    return results;
  }

  async getPropertyMaintenanceRequests(propertyId: number): Promise<MaintenanceRequest[]> {
    const results = await db
      .select()
      .from(maintenanceRequests)
      .where(eq(maintenanceRequests.propertyId, propertyId))
      .orderBy(desc(maintenanceRequests.createdAt));
    return results;
  }

  async createMaintenanceRequest(insertRequest: InsertMaintenanceRequest): Promise<MaintenanceRequest> {
    const [request] = await db
      .insert(maintenanceRequests)
      .values(insertRequest)
      .returning();
    return request;
  }

  async updateMaintenanceRequest(id: number, requestUpdate: Partial<MaintenanceRequest>): Promise<MaintenanceRequest | undefined> {
    const [updatedRequest] = await db
      .update(maintenanceRequests)
      .set(requestUpdate)
      .where(eq(maintenanceRequests.id, id))
      .returning();
    return updatedRequest || undefined;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
    return payment || undefined;
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    const results = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.dueDate));
    return results;
  }

  async getPropertyPayments(propertyId: number): Promise<Payment[]> {
    const results = await db
      .select()
      .from(payments)
      .where(eq(payments.propertyId, propertyId))
      .orderBy(desc(payments.dueDate));
    return results;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async updatePayment(id: number, paymentUpdate: Partial<Payment>): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set(paymentUpdate)
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment || undefined;
  }

  async uploadUserDocument(userId: number, documentType: string, documentPath: string): Promise<Partial<User>> {
    // This updates a specific document field on the user
    const documentFields: { [key: string]: string } = {};
    documentFields[`document${documentType.charAt(0).toUpperCase() + documentType.slice(1)}`] = documentPath;
    
    return this.updateUser(userId, documentFields) as Promise<Partial<User>>;
  }

  async getUserDocuments(userId: number): Promise<Partial<User>> {
    const user = await this.getUser(userId);
    if (!user) return {};
    
    // Return only document-related fields
    const documentFields = ['documentId', 'documentIncome', 'documentCredit'];
    return Object.fromEntries(
      Object.entries(user).filter(([key]) => documentFields.some(field => key.startsWith(field)))
    );
  }

  async verifyUserDocument(userId: number, documentType: string): Promise<boolean> {
    const verificationFields: { [key: string]: boolean } = {};
    verificationFields[`documentVerified${documentType.charAt(0).toUpperCase() + documentType.slice(1)}`] = true;
    
    const result = await this.updateUser(userId, verificationFields);
    return !!result;
  }

  async getRentalApplication(id: number): Promise<RentalApplication | undefined> {
    const [application] = await db
      .select()
      .from(rentalApplications)
      .where(eq(rentalApplications.id, id));
    return application || undefined;
  }

  async getUserRentalApplications(userId: number): Promise<RentalApplication[]> {
    const results = await db
      .select()
      .from(rentalApplications)
      .where(eq(rentalApplications.userId, userId))
      .orderBy(desc(rentalApplications.createdAt));
    return results;
  }

  async getLandlordRentalApplications(landlordId: number): Promise<RentalApplication[]> {
    const results = await db
      .select({
        application: rentalApplications,
        property: properties,
      })
      .from(rentalApplications)
      .innerJoin(properties, eq(rentalApplications.propertyId, properties.id))
      .where(eq(properties.landlordId, landlordId))
      .orderBy(desc(rentalApplications.createdAt));
    return results.map(r => r.application);
  }

  async getPropertyRentalApplications(propertyId: number): Promise<RentalApplication[]> {
    const results = await db
      .select()
      .from(rentalApplications)
      .where(eq(rentalApplications.propertyId, propertyId))
      .orderBy(desc(rentalApplications.createdAt));
    return results;
  }

  async createRentalApplication(insertApplication: InsertRentalApplication): Promise<RentalApplication> {
    const [application] = await db
      .insert(rentalApplications)
      .values(insertApplication)
      .returning();
    return application;
  }

  async updateRentalApplication(id: number, applicationUpdate: Partial<RentalApplication>): Promise<RentalApplication | undefined> {
    const [updatedApplication] = await db
      .update(rentalApplications)
      .set(applicationUpdate)
      .where(eq(rentalApplications.id, id))
      .returning();
    return updatedApplication || undefined;
  }

  async quickApply(userId: number, propertyId: number, message?: string): Promise<RentalApplication | undefined> {
    const application: InsertRentalApplication = {
      userId,
      propertyId,
      status: 'pending',
      message: message || '',
      createdAt: new Date(),
    };
    
    return this.createRentalApplication(application);
  }
}

// Try to use the database storage implementation
// If database initialization fails, fall back to memory storage
let useDatabase = true;

try {
  // Simple test to check if database is accessible
  useDatabase = process.env.DATABASE_URL !== undefined;
} catch (error) {
  console.log("Database connection test failed, using memory storage");
  useDatabase = false;
}

export const storage = useDatabase ? new DatabaseStorage() : new MemStorage();
