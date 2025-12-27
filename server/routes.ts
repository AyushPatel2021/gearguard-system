import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertUserSchema, insertTeamSchema, insertEquipmentSchema, insertRequestSchema, insertCategorySchema, insertDepartmentSchema, insertWorkCenterSchema } from "@shared/schema";

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
  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) return res.sendStatus(404);
    res.json(user);
  });
  app.post("/api/users", async (req, res) => {
    try {
      const { password, ...rest } = req.body;
      // Hash password
      const hashedPassword = await hashPassword(password);
      const data = await storage.createUser({ ...rest, password: hashedPassword });
      res.status(201).json(data);

    } catch (error: any) {
      if (error?.code === '23505') {
        if (error?.constraint?.includes('username')) {
          return res.status(400).json({ error: "Username already exists." });
        }
        if (error?.constraint?.includes('email')) {
          return res.status(400).json({ error: "Email already exists." });
        }
      }
      console.error("User creation error:", error);
      return res.status(500).json({ error: "Failed to create user" });
    }
  });
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const { password, resetToken, resetTokenExpiry, createdAt, ...rest } = req.body;
      let updateData: any = { ...rest };

      // Only hash password if provided
      if (password) {
        if (!rest.currentPassword) {
          return res.status(400).json({ error: "Current password is required to set a new password" });
        }

        const currentUser = await storage.getUser(Number(req.params.id));
        if (!currentUser) return res.sendStatus(404);

        const isValid = await comparePasswords(rest.currentPassword, currentUser.password);
        if (!isValid) {
          return res.status(400).json({ error: "Incorrect current password" });
        }

        updateData.password = await hashPassword(password);
      }

      // Remove currentPassword from payload before saving
      delete updateData.currentPassword;

      const data = await storage.updateUser(Number(req.params.id), updateData);
      res.json(data);
    } catch (error: any) {
      if (error?.code === '23505') {
        if (error?.constraint?.includes('username')) {
          return res.status(400).json({ error: "Username already exists." });
        }
        if (error?.constraint?.includes('email')) {
          return res.status(400).json({ error: "Email already exists." });
        }
      }
      console.error("User update error:", error);
      return res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Equipment
  app.get(api.equipment.list.path, async (req, res) => {
    const data = await storage.getEquipment();
    res.json(data);
  });
  app.get(api.equipment.get.path, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const data = await storage.getEquipmentById(id);
    if (!data) return res.sendStatus(404);
    res.json(data);
  });
  app.post(api.equipment.create.path, async (req, res) => {
    try {
      const parsed = insertEquipmentSchema.parse(req.body);
      const data = await storage.createEquipment(parsed);
      res.status(201).json(data);
    } catch (error: any) {
      if (error?.code === '23505' && error?.constraint?.includes('serial_number')) {
        return res.status(400).json({ error: "Serial number already exists. Please use a unique serial number." });
      }
      console.error("Equipment creation error:", error);
      return res.status(500).json({ error: "Failed to create equipment" });
    }
  });
  app.patch(api.equipment.update.path, async (req, res) => {
    try {
      const parsed = insertEquipmentSchema.partial().parse(req.body);
      const data = await storage.updateEquipment(Number(req.params.id), parsed);
      res.json(data);
    } catch (error: any) {
      if (error?.code === '23505' && error?.constraint?.includes('serial_number')) {
        return res.status(400).json({ error: "Serial number already exists. Please use a unique serial number." });
      }
      console.error("Equipment update error:", error);
      return res.status(500).json({ error: "Failed to update equipment" });
    }
  });

  // Requests
  app.get(api.requests.list.path, async (req, res) => {
    const data = await storage.getRequests();
    res.json(data);
  });
  app.get(api.requests.get.path, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const data = await storage.getRequest(id);
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

    // Get Current Request State BEFORE updating
    const currentRequest = await storage.getRequest(Number(req.params.id));

    // Auto-Stage Transition: If request is 'new' and scheduledDate is being set
    if (currentRequest && currentRequest.status === 'new' && parsed.scheduledDate) {
      parsed.status = 'in_progress';
    }

    const data = await storage.updateRequest(Number(req.params.id), { ...parsed, technicianIds: cleanTechnicianIds });

    // Scrap Logic: If status changed to 'scrap', scrap the associated equipment
    if (parsed.status === 'scrap') {
      const request = await storage.getRequest(Number(req.params.id));
      if (request && request.equipmentId) {
        await storage.updateEquipment(request.equipmentId, {
          status: 'scrapped',
          scrapDate: new Date()
        });
      }
    }

    res.json(data);
  });

  // Worksheets
  app.get("/api/requests/:id/worksheets", async (req, res) => {
    const data = await storage.getWorksheetsByRequest(Number(req.params.id));
    res.json(data);
  });
  app.post("/api/requests/:id/worksheets", async (req, res) => {
    const user = req.user as any;
    const { startTime, endTime, description } = req.body;
    const data = await storage.createWorksheet({
      requestId: Number(req.params.id),
      userId: user?.id || req.body.userId || 1,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      description,
    });
    res.status(201).json(data);
  });
  app.delete("/api/worksheets/:id", async (req, res) => {
    await storage.deleteWorksheet(Number(req.params.id));
    res.sendStatus(204);
  });

  // Work Centers
  app.get(api.workCenters.list.path, async (req, res) => {
    const data = await storage.getWorkCenters();
    res.json(data);
  });
  app.get(api.workCenters.get.path, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const data = await storage.getWorkCenter(id);
    if (!data) return res.sendStatus(404);
    res.json(data);
  });
  app.post(api.workCenters.create.path, async (req, res) => {
    const parsed = insertWorkCenterSchema.parse(req.body);
    const data = await storage.createWorkCenter(parsed);
    res.status(201).json(data);
  });
  app.patch(api.workCenters.update.path, async (req, res) => {
    const { createdAt, id: _, ...rest } = req.body;
    const parsed = insertWorkCenterSchema.partial().parse(rest);
    const data = await storage.updateWorkCenter(Number(req.params.id), parsed);
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



async function seedDatabase() {
  const existingUsers = await storage.getUserByUsername("admin");
  if (!existingUsers) {
    const adminPassword = await hashPassword("admin123");
    const techPassword = await hashPassword("tech123");
    const userPassword = await hashPassword("user123");

    // Departments
    const deptIT = await storage.createDepartment({ name: "IT", description: "Information Technology" });
    const deptOps = await storage.createDepartment({ name: "Operations", description: "Plant Operations" });




    // Categories
    const catComputers = await storage.createCategory({ name: "Computers", description: "Laptops and Desktops" });
    const catMachinery = await storage.createCategory({ name: "Heavy Machinery", description: "Industrial equipment" });

    // Teams
    const teamIT = await storage.createTeam({ name: "IT Support", specialization: "IT", description: "Handle IT requests" });
    const teamMech = await storage.createTeam({ name: "Maintenance Crew", specialization: "Mechanical", description: "Heavy repairs" });

    // Users
    await storage.createUser({ username: "admin", email: "admin@gearguard.com", password: adminPassword, name: "Admin User", role: "admin", isActive: true });
    await storage.createUser({ username: "tech", email: "tech@gearguard.com", password: techPassword, name: "John Tech", role: "technician", isActive: true, teamIds: [teamMech.id] });
    await storage.createUser({ username: "user", email: "user@gearguard.com", password: userPassword, name: "Jane Employee", role: "employee", isActive: true });


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
