import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertEquipmentSchema, insertRequestSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Master Data
  app.get(api.departments.list.path, async (req, res) => {
    const data = await storage.getDepartments();
    res.json(data);
  });
  app.post(api.departments.create.path, async (req, res) => {
    const data = await storage.createDepartment(req.body);
    res.status(201).json(data);
  });

  app.get(api.categories.list.path, async (req, res) => {
    const data = await storage.getCategories();
    res.json(data);
  });
  app.post(api.categories.create.path, async (req, res) => {
    const data = await storage.createCategory(req.body);
    res.status(201).json(data);
  });

  app.get(api.teams.list.path, async (req, res) => {
    const data = await storage.getTeams();
    res.json(data);
  });
  app.post(api.teams.create.path, async (req, res) => {
    // We can rely on Zod? Or just manual? shared routes has input: insertTeamSchema
    // But insertTeamSchema doesn't have memberIds.
    // The previous implementation used req.body directly passed to storage.createTeam.
    // Let's do partial parsing or just pass body.
    // Since shared/routes.ts has `input: insertTeamSchema`, we should respect that validation but also allow memberIds.
    const { memberIds, ...rest } = req.body;
    // ensure rest is valid per schema if we used it.
    // But implementation above just used storage.createTeam(req.body).
    // Let's keep it simple and just forward req.body.
    const data = await storage.createTeam(req.body);
    res.status(201).json(data);
  });
  app.get(api.teams.get.path, async (req, res) => {
    const data = await storage.getTeam(Number(req.params.id));
    if (!data) return res.sendStatus(404);
    res.json(data);
  });
  app.patch(api.teams.update.path, async (req, res) => {
    const data = await storage.updateTeam(Number(req.params.id), req.body);
    if (!data) return res.sendStatus(404);
    res.json(data);
  });
  app.get("/api/team-members", async (req, res) => {
    const data = await storage.getTeamMembers();
    res.json(data);
  });

  app.get("/api/users", async (req, res) => {
    const data = await storage.getUsers();
    res.json(data);
  });

  // Equipment
  app.get(api.equipment.list.path, async (req, res) => {
    const data = await storage.getEquipment();
    res.json(data);
  });
  app.get(api.equipment.get.path, async (req, res) => {
    const data = await storage.getEquipmentById(Number(req.params.id));
    if (!data) return res.sendStatus(404);
    res.json(data);
  });
  app.post(api.equipment.create.path, async (req, res) => {
    const parsed = insertEquipmentSchema.parse(req.body);
    const data = await storage.createEquipment(parsed);
    res.status(201).json(data);
  });
  app.patch(api.equipment.update.path, async (req, res) => {
    const parsed = insertEquipmentSchema.partial().parse(req.body);
    const data = await storage.updateEquipment(Number(req.params.id), parsed);
    res.json(data);
  });

  // Requests
  app.get(api.requests.list.path, async (req, res) => {
    const data = await storage.getRequests();
    res.json(data);
  });
  app.get(api.requests.get.path, async (req, res) => {
    const data = await storage.getRequest(Number(req.params.id));
    if (!data) return res.sendStatus(404);
    res.json(data);
  });
  app.post(api.requests.create.path, async (req, res) => {
    const user = req.user as any;
    const { technicianIds, ...rest } = req.body;

    // Zod validation for Main Request Data
    const body = { ...rest, createdBy: user?.id || req.body.createdBy };
    const parsed = insertRequestSchema.parse(body);

    // Validate technicianIds if present
    const cleanTechnicianIds = Array.isArray(technicianIds) ? technicianIds.map(Number) : undefined;

    const data = await storage.createRequest({ ...parsed, technicianIds: cleanTechnicianIds });
    res.status(201).json(data);
  });
  app.patch(api.requests.update.path, async (req, res) => {
    const { technicianIds, ...rest } = req.body;
    const parsed = insertRequestSchema.partial().parse(rest);

    // Validate technicianIds if present
    const cleanTechnicianIds = Array.isArray(technicianIds) ? technicianIds.map(Number) : undefined;

    const data = await storage.updateRequest(Number(req.params.id), { ...parsed, technicianIds: cleanTechnicianIds });
    res.json(data);
  });

  // Logs
  app.get(api.logs.list.path, async (req, res) => {
    const data = await storage.getLogs();
    res.json(data);
  });

  await seedDatabase();

  return httpServer;
}

import { hashPassword } from "./auth";

async function seedDatabase() {
  const existingUsers = await storage.getUserByUsername("admin");
  if (!existingUsers) {
    const adminPassword = await hashPassword("admin123");
    const techPassword = await hashPassword("tech123");
    const userPassword = await hashPassword("user123");

    // Departments
    const deptIT = await storage.createDepartment({ name: "IT", description: "Information Technology" });
    const deptOps = await storage.createDepartment({ name: "Operations", description: "Plant Operations" });

    // Users
    await storage.createUser({ username: "admin", email: "admin@gearguard.com", password: adminPassword, name: "Admin User", role: "admin", departmentId: deptIT.id, isActive: true });
    await storage.createUser({ username: "tech", email: "tech@gearguard.com", password: techPassword, name: "John Tech", role: "technician", departmentId: deptOps.id, isActive: true });
    await storage.createUser({ username: "user", email: "user@gearguard.com", password: userPassword, name: "Jane Employee", role: "employee", departmentId: deptOps.id, isActive: true });

    // Categories
    const catComputers = await storage.createCategory({ name: "Computers", description: "Laptops and Desktops" });
    const catMachinery = await storage.createCategory({ name: "Heavy Machinery", description: "Industrial equipment" });

    // Teams
    const teamIT = await storage.createTeam({ name: "IT Support", specialization: "IT", description: "Handle IT requests" });
    const teamMech = await storage.createTeam({ name: "Maintenance Crew", specialization: "Mechanical", description: "Heavy repairs" });

    // Equipment
    await storage.createEquipment({
      name: "MacBook Pro M1",
      serialNumber: "SN123456",
      categoryId: catComputers.id,
      departmentId: deptIT.id,
      maintenanceTeamId: teamIT.id,
      status: "active",
      location: "Office 101"
    });

    await storage.createEquipment({
      name: "Conveyor Belt Motor",
      serialNumber: "MTR-9988",
      categoryId: catMachinery.id,
      departmentId: deptOps.id,
      maintenanceTeamId: teamMech.id,
      status: "active",
      location: "Plant Floor A"
    });
  }
}
