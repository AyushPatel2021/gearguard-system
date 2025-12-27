import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

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
    const data = await storage.createTeam(req.body);
    res.status(201).json(data);
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
    const data = await storage.createEquipment(req.body);
    res.status(201).json(data);
  });
  app.put(api.equipment.update.path, async (req, res) => {
    const data = await storage.updateEquipment(Number(req.params.id), req.body);
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
    // Override createdBy with current user if not provided (though schema might require it)
    const body = { ...req.body, createdBy: req.user?.id || req.body.createdBy };
    const data = await storage.createRequest(body);
    res.status(201).json(data);
  });
  app.put(api.requests.update.path, async (req, res) => {
    const data = await storage.updateRequest(Number(req.params.id), req.body);
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
    await storage.createUser({ username: "admin", password: adminPassword, name: "Admin User", role: "admin", departmentId: deptIT.id, isActive: true });
    await storage.createUser({ username: "tech", password: techPassword, name: "John Tech", role: "technician", departmentId: deptOps.id, isActive: true });
    await storage.createUser({ username: "user", password: userPassword, name: "Jane Employee", role: "employee", departmentId: deptOps.id, isActive: true });

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
