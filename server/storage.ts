import { db, pool } from "./db";
import {
  users, departments, categories, teams, equipment, maintenanceRequests, activityLogs, requestTechnicians, teamMembers,
  type User, type InsertUser, type Equipment, type MaintenanceRequest, type InsertRequest, type InsertEquipment
} from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUserResetToken(id: number, token: string | null, expiry: Date | null): Promise<void>;
  updateUserPassword(id: number, password: string): Promise<void>;

  getEquipment(): Promise<Equipment[]>;
  getEquipmentById(id: number): Promise<Equipment | undefined>;
  createEquipment(data: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: number, data: Partial<InsertEquipment>): Promise<Equipment>;

  getRequests(): Promise<(MaintenanceRequest & { technicianIds: number[] })[]>;
  getRequest(id: number): Promise<(MaintenanceRequest & { technicianIds: number[] }) | undefined>;
  createRequest(data: InsertRequest & { technicianIds?: number[] }): Promise<MaintenanceRequest>;
  updateRequest(id: number, data: Partial<InsertRequest> & { technicianIds?: number[] }): Promise<MaintenanceRequest>;

  getDepartments(): Promise<any[]>;
  getCategories(): Promise<any[]>;
  getTeam(id: number): Promise<(typeof teams.$inferSelect & { memberIds: number[] }) | undefined>;
  getTeams(): Promise<(typeof teams.$inferSelect & { memberIds: number[] })[]>;
  createTeam(data: any & { memberIds?: number[] }): Promise<any>;
  updateTeam(id: number, data: any & { memberIds?: number[] }): Promise<any>;

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

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
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

  async getRequests(): Promise<(MaintenanceRequest & { technicianIds: number[] })[]> {
    const requests = await db.select().from(maintenanceRequests);
    const techAssignments = await db.select().from(requestTechnicians);

    // Map Assignments to Requests
    return requests.map(req => ({
      ...req,
      technicianIds: techAssignments
        .filter(t => t.requestId === req.id)
        .map(t => t.technicianId)
    }));
  }

  async getRequest(id: number): Promise<(MaintenanceRequest & { technicianIds: number[] }) | undefined> {
    const [req] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, id));
    if (!req) return undefined;

    const techAssignments = await db.select().from(requestTechnicians).where(eq(requestTechnicians.requestId, id));
    return {
      ...req,
      technicianIds: techAssignments.map(t => t.technicianId)
    };
  }

  async createRequest(data: InsertRequest & { technicianIds?: number[] }): Promise<MaintenanceRequest> {
    const { technicianIds, ...requestData } = data;
    const [req] = await db.insert(maintenanceRequests).values(requestData).returning();

    if (technicianIds && technicianIds.length > 0) {
      await db.insert(requestTechnicians).values(
        technicianIds.map(techId => ({
          requestId: req.id,
          technicianId: techId
        }))
      );
    }
    return req;
  }

  async updateRequest(id: number, data: Partial<InsertRequest> & { technicianIds?: number[] }): Promise<MaintenanceRequest> {
    const { technicianIds, ...requestData } = data;

    const [req] = await db.update(maintenanceRequests)
      .set(requestData)
      .where(eq(maintenanceRequests.id, id))
      .returning();

    if (technicianIds !== undefined) {
      // Replace existing assignments
      await db.delete(requestTechnicians).where(eq(requestTechnicians.requestId, id));

      if (technicianIds.length > 0) {
        await db.insert(requestTechnicians).values(
          technicianIds.map(techId => ({
            requestId: id,
            technicianId: techId
          }))
        );
      }
    }

    return req;
  }

  async getDepartments() { return await db.select().from(departments); }
  async getCategories() { return await db.select().from(categories); }
  async getTeams() {
    const allTeams = await db.select().from(teams);
    const members = await db.select().from(teamMembers);
    return allTeams.map(t => ({
      ...t,
      memberIds: members.filter(m => m.teamId === t.id).map(m => m.userId)
    }));
  }

  async getTeam(id: number) {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    if (!team) return undefined;
    const members = await db.select().from(teamMembers).where(eq(teamMembers.teamId, id));
    return { ...team, memberIds: members.map(m => m.userId) };
  }

  async createTeam(data: any & { memberIds?: number[] }) {
    const { memberIds, ...teamData } = data;
    const [team] = await db.insert(teams).values(teamData).returning();

    if (memberIds && memberIds.length > 0) {
      await db.insert(teamMembers).values(
        memberIds.map((userId: number) => ({
          teamId: team.id,
          userId
        }))
      );
    }
    return team;
  }

  async updateTeam(id: number, data: any & { memberIds?: number[] }) {
    const { memberIds, ...teamData } = data;
    let team;
    if (Object.keys(teamData).length > 0) {
      [team] = await db.update(teams).set(teamData).where(eq(teams.id, id)).returning();
    } else {
      [team] = await db.select().from(teams).where(eq(teams.id, id));
    }

    if (!team) return undefined;

    if (memberIds !== undefined) {
      await db.delete(teamMembers).where(eq(teamMembers.teamId, id));
      if (memberIds.length > 0) {
        await db.insert(teamMembers).values(
          memberIds.map((userId: number) => ({
            teamId: id,
            userId
          }))
        );
      }
    }
    return team;
  }
  async getTeamMembers() { return await db.select().from(teamMembers); }
  async getLogs() { return await db.select().from(activityLogs); }

  async createDepartment(data: any) { const [res] = await db.insert(departments).values(data).returning(); return res; }
  async createCategory(data: any) { const [res] = await db.insert(categories).values(data).returning(); return res; }

}

export const storage = new DatabaseStorage();

