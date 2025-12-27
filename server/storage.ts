import { db, pool } from "./db";

import {
  users, departments, categories, teams, equipment, maintenanceRequests, activityLogs, requestTechnicians, teamMembers, worksheets, workCenters,
  type User, type InsertUser, type Equipment, type MaintenanceRequest, type InsertRequest, type InsertEquipment, type WorkCenter, type InsertWorkCenter, type InsertWorksheet
} from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  getUser(id: number): Promise<User & { teamIds: number[] } | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { teamIds?: number[] }): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUserResetToken(id: number, token: string | null, expiry: Date | null): Promise<void>;
  updateUserPassword(id: number, password: string): Promise<void>;
  updateUser(id: number, data: Partial<InsertUser> & { teamIds?: number[] }): Promise<User>;


  getEquipment(): Promise<Equipment[]>;
  getEquipmentById(id: number): Promise<Equipment | undefined>;
  createEquipment(data: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: number, data: Partial<InsertEquipment>): Promise<Equipment>;

  getWorkCenters(): Promise<WorkCenter[]>;
  getWorkCenter(id: number): Promise<WorkCenter | undefined>;
  createWorkCenter(data: InsertWorkCenter): Promise<WorkCenter>;
  updateWorkCenter(id: number, data: Partial<InsertWorkCenter>): Promise<WorkCenter>;

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

  async getUser(id: number): Promise<User & { teamIds: number[] } | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;
    const members = await db.select().from(teamMembers).where(eq(teamMembers.userId, id));
    return { ...user, teamIds: members.map(m => m.teamId) };
  }


  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(data: InsertUser & { teamIds?: number[] }): Promise<User> {
    const { teamIds, ...userData } = data;
    const [user] = await db.insert(users).values(userData).returning();

    if (teamIds && teamIds.length > 0) {
      await db.insert(teamMembers).values(
        teamIds.map(teamId => ({
          userId: user.id,
          teamId
        }))
      );
    }
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

  async updateUser(id: number, data: Partial<InsertUser> & { teamIds?: number[] }): Promise<User> {
    const { teamIds, ...userData } = data;
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();

    if (teamIds !== undefined) {
      await db.delete(teamMembers).where(eq(teamMembers.userId, id));
      if (teamIds.length > 0) {
        await db.insert(teamMembers).values(
          teamIds.map(teamId => ({
            userId: id,
            teamId
          }))
        );
      }
    }
    return user;
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

  // Worksheets
  async getWorksheetsByRequest(requestId: number) {
    return await db.select().from(worksheets).where(eq(worksheets.requestId, requestId));
  }
  async createWorksheet(data: any) {
    const [res] = await db.insert(worksheets).values(data).returning();
    return res;
  }
  async deleteWorksheet(id: number) {
    await db.delete(worksheets).where(eq(worksheets.id, id));
  }

  async createDepartment(data: any) { const [res] = await db.insert(departments).values(data).returning(); return res; }
  async createCategory(data: any) { const [res] = await db.insert(categories).values(data).returning(); return res; }

  // Work Centers
  async getWorkCenters() { return await db.select().from(workCenters); }
  async getWorkCenter(id: number) {
    const [wc] = await db.select().from(workCenters).where(eq(workCenters.id, id));
    return wc;
  }
  async createWorkCenter(data: InsertWorkCenter) {
    const [res] = await db.insert(workCenters).values(data as any).returning();
    return res;
  }
  async updateWorkCenter(id: number, data: Partial<InsertWorkCenter>) {
    const [res] = await db.update(workCenters).set(data as any).where(eq(workCenters.id, id)).returning();
    return res;
  }

}

export const storage = new DatabaseStorage();

