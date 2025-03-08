import { users, properties, buildings, messages, savedProperties, maintenanceRequests, payments } from "@shared/schema";
import type { User, InsertUser, Property, InsertProperty, Building, InsertBuilding, Message, InsertMessage, SavedProperty, InsertSavedProperty, MaintenanceRequest, InsertMaintenanceRequest, Payment, InsertPayment } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
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
  sessionStore: session.Store;
  
  // ID counters
  private userId: number;
  private propertyId: number;
  private buildingId: number;
  private messageId: number;
  private savedPropertyId: number;
  private maintenanceRequestId: number;
  private paymentId: number;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.buildings = new Map();
    this.messages = new Map();
    this.savedProperties = new Map();
    this.maintenanceRequests = new Map();
    this.payments = new Map();
    
    this.userId = 1;
    this.propertyId = 1;
    this.buildingId = 1;
    this.messageId = 1;
    this.savedPropertyId = 1;
    this.maintenanceRequestId = 1;
    this.paymentId = 1;
    
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
}

export const storage = new MemStorage();
