import { db, pool } from "./db";
import {
  users, departments, categories, teams, equipment, maintenanceRequests, activityLogs,
  type User, type InsertUser, type Equipment, type MaintenanceRequest, type InsertRequest, type InsertEquipment
} from "@shared/schema";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserResetToken(id: number, token: string | null, expiry: Date | null): Promise<void>;
  updateUserPassword(id: number, password: string): Promise<void>;

  getEquipment(): Promise<Equipment[]>;
  getEquipmentById(id: number): Promise<Equipment | undefined>;
  createEquipment(data: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: number, data: Partial<InsertEquipment>): Promise<Equipment>;

  getRequests(): Promise<MaintenanceRequest[]>;
  getRequest(id: number): Promise<MaintenanceRequest | undefined>;
  createRequest(data: InsertRequest): Promise<MaintenanceRequest>;
  updateRequest(id: number, data: Partial<InsertRequest>): Promise<MaintenanceRequest>;

  getDepartments(): Promise<any[]>;
  getCategories(): Promise<any[]>;
  getTeams(): Promise<any[]>;
  createDepartment(data: any): Promise<any>;
  createCategory(data: any): Promise<any>;
  createTeam(data: any): Promise<any>;

  getLogs(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserResetToken(id: number, token: string | null, expiry: Date | null): Promise<void> {
    await db.update(users).set({ resetToken: token, resetTokenExpiry: expiry }).where(eq(users.id, id));
  }

  async updateUserPassword(id: number, password: string): Promise<void> {
    await db.update(users).set({ password, resetToken: null, resetTokenExpiry: null }).where(eq(users.id, id));
  }

  async getEquipment(): Promise<Equipment[]> {
    return await db.select().from(equipment);
  }

  async getEquipmentById(id: number): Promise<Equipment | undefined> {
    const [item] = await db.select().from(equipment).where(eq(equipment.id, id));
    return item;
  }

  async createEquipment(data: InsertEquipment): Promise<Equipment> {
    const [item] = await db.insert(equipment).values(data).returning();
    return item;
  }

  async updateEquipment(id: number, data: Partial<InsertEquipment>): Promise<Equipment> {
    const [item] = await db.update(equipment).set(data).where(eq(equipment.id, id)).returning();
    return item;
  }

  async getRequests(): Promise<MaintenanceRequest[]> {
    return await db.select().from(maintenanceRequests);
  }

  async getRequest(id: number): Promise<MaintenanceRequest | undefined> {
    const [req] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, id));
    return req;
  }

  async createRequest(data: InsertRequest): Promise<MaintenanceRequest> {
    const [req] = await db.insert(maintenanceRequests).values(data).returning();
    return req;
  }

  async updateRequest(id: number, data: Partial<InsertRequest>): Promise<MaintenanceRequest> {
    const [req] = await db.update(maintenanceRequests).set(data).where(eq(maintenanceRequests.id, id)).returning();
    return req;
  }

  async getDepartments() { return await db.select().from(departments); }
  async getCategories() { return await db.select().from(categories); }
  async getTeams() { return await db.select().from(teams); }
  async getLogs() { return await db.select().from(activityLogs); }

  async createDepartment(data: any) { const [res] = await db.insert(departments).values(data).returning(); return res; }
  async createCategory(data: any) { const [res] = await db.insert(categories).values(data).returning(); return res; }
  async createTeam(data: any) { const [res] = await db.insert(teams).values(data).returning(); return res; }
}

export const storage = new DatabaseStorage();

