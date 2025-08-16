import { 
  type User, 
  type InsertUser, 
  type Trip, 
  type InsertTrip,
  type Incident,
  type InsertIncident,
  type Report,
  type InsertReport
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Trip methods
  getTrip(id: string): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: string, updates: Partial<Trip>): Promise<Trip | undefined>;
  getTripsByUser(userId: string): Promise<Trip[]>;

  // Incident methods
  getIncident(id: string): Promise<Incident | undefined>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | undefined>;
  getIncidentsByUser(userId: string): Promise<Incident[]>;

  // Report methods
  getReport(id: string): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  getReports(filters?: {
    category?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }): Promise<Report[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private trips: Map<string, Trip>;
  private incidents: Map<string, Incident>;
  private reports: Map<string, Report>;

  constructor() {
    this.users = new Map();
    this.trips = new Map();
    this.incidents = new Map();
    this.reports = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phone === phone,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Trip methods
  async getTrip(id: string): Promise<Trip | undefined> {
    return this.trips.get(id);
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const id = randomUUID();
    const trip: Trip = {
      ...insertTrip,
      id,
      startedAt: new Date(),
      lastUpdateAt: null,
    };
    this.trips.set(id, trip);
    return trip;
  }

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip | undefined> {
    const trip = this.trips.get(id);
    if (!trip) return undefined;
    
    const updatedTrip = { 
      ...trip, 
      ...updates,
      lastUpdateAt: new Date(),
    };
    this.trips.set(id, updatedTrip);
    return updatedTrip;
  }

  async getTripsByUser(userId: string): Promise<Trip[]> {
    return Array.from(this.trips.values()).filter(
      (trip) => trip.ownerUid === userId
    );
  }

  // Incident methods
  async getIncident(id: string): Promise<Incident | undefined> {
    return this.incidents.get(id);
  }

  async createIncident(insertIncident: InsertIncident): Promise<Incident> {
    const id = randomUUID();
    const incident: Incident = {
      ...insertIncident,
      id,
      createdAt: new Date(),
    };
    this.incidents.set(id, incident);
    return incident;
  }

  async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | undefined> {
    const incident = this.incidents.get(id);
    if (!incident) return undefined;
    
    const updatedIncident = { ...incident, ...updates };
    this.incidents.set(id, updatedIncident);
    return updatedIncident;
  }

  async getIncidentsByUser(userId: string): Promise<Incident[]> {
    return Array.from(this.incidents.values()).filter(
      (incident) => incident.ownerUid === userId
    );
  }

  // Report methods
  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = randomUUID();
    const report: Report = {
      ...insertReport,
      id,
      createdAt: new Date(),
    };
    this.reports.set(id, report);
    return report;
  }

  async getReports(filters?: {
    category?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }): Promise<Report[]> {
    let reports = Array.from(this.reports.values());
    
    if (filters?.category) {
      reports = reports.filter(report => report.category === filters.category);
    }
    
    if (filters?.lat && filters?.lng && filters?.radius) {
      // Simple distance filtering (rough approximation)
      reports = reports.filter(report => {
        const distance = Math.sqrt(
          Math.pow(report.lat - filters.lat!, 2) + 
          Math.pow(report.lng - filters.lng!, 2)
        );
        return distance <= filters.radius! / 111000; // Convert meters to degrees (rough)
      });
    }
    
    return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();
