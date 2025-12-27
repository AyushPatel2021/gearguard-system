import { pgTable, text, serial, integer, boolean, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum('role', ['admin', 'technician', 'employee']);
export const statusEnum = pgEnum('status', ['active', 'scrapped']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);
export const requestStatusEnum = pgEnum('request_status', ['new', 'in_progress', 'repaired', 'scrap']);
export const requestTypeEnum = pgEnum('request_type', ['corrective', 'preventive']);

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").default('employee').notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialization: text("specialization"), // IT, Electrical, Mechanical
  description: text("description"),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
});

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  serialNumber: text("serial_number").notNull().unique(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  assignedEmployeeId: integer("assigned_employee_id").references(() => users.id),
  location: text("location"),
  purchaseDate: date("purchase_date"),
  warrantyExpiryDate: date("warranty_expiry_date"),
  maintenanceTeamId: integer("maintenance_team_id").references(() => teams.id),
  defaultTechnicianId: integer("default_technician_id").references(() => users.id),
  status: statusEnum("status").default('active').notNull(),
  assignedDate: timestamp("assigned_date"),
  scrapDate: timestamp("scrap_date"),
  employeeId: integer("employee_id").references(() => users.id),
  notes: text("notes"),
});

export const maintenanceRequests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  requestType: requestTypeEnum("request_type").notNull(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  maintenanceTeamId: integer("maintenance_team_id").references(() => teams.id),
  assignedTechnicianId: integer("assigned_technician_id").references(() => users.id),
  scheduledDate: timestamp("scheduled_date"),
  actualStartDate: timestamp("actual_start_date"),
  completedDate: timestamp("completed_date"),
  durationHours: integer("duration_hours"),
  priority: priorityEnum("priority").default('medium').notNull(),
  status: requestStatusEnum("status").default('new').notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  referenceType: text("reference_type").notNull(), // 'equipment' | 'request'
  referenceId: integer("reference_id").notNull(),
  action: text("action").notNull(),
  performedBy: integer("performed_by").references(() => users.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, { fields: [users.departmentId], references: [departments.id] }),
  teamMemberships: many(teamMembers),
  assignedEquipment: many(equipment, { relationName: "assignedEmployee" }),
  defaultForEquipment: many(equipment, { relationName: "defaultTechnician" }),
  assignedRequests: many(maintenanceRequests, { relationName: "assignedTechnician" }),
  createdRequests: many(maintenanceRequests, { relationName: "requestCreator" }),
}));

export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  category: one(categories, { fields: [equipment.categoryId], references: [categories.id] }),
  department: one(departments, { fields: [equipment.departmentId], references: [departments.id] }),
  assignedEmployee: one(users, { fields: [equipment.assignedEmployeeId], references: [users.id], relationName: "assignedEmployee" }),
  maintenanceTeam: one(teams, { fields: [equipment.maintenanceTeamId], references: [teams.id] }),
  defaultTechnician: one(users, { fields: [equipment.defaultTechnicianId], references: [users.id], relationName: "defaultTechnician" }),
  requests: many(maintenanceRequests),
}));

export const maintenanceRequestsRelations = relations(maintenanceRequests, ({ one }) => ({
  equipment: one(equipment, { fields: [maintenanceRequests.equipmentId], references: [equipment.id] }),
  maintenanceTeam: one(teams, { fields: [maintenanceRequests.maintenanceTeamId], references: [teams.id] }),
  assignedTechnician: one(users, { fields: [maintenanceRequests.assignedTechnicianId], references: [users.id], relationName: "assignedTechnician" }),
  creator: one(users, { fields: [maintenanceRequests.createdBy], references: [users.id], relationName: "requestCreator" }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
  equipment: many(equipment),
  requests: many(maintenanceRequests),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamMembers.userId], references: [users.id] }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true });
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true });

// Helper for coercing timestamp strings to Date objects
const zTimestamp = z.preprocess((arg) => {
  if (typeof arg === "string" && arg.length > 0) return new Date(arg);
  if (arg === "" || arg === null) return null;
  return arg;
}, z.date().nullable().optional());

export const insertEquipmentSchema = createInsertSchema(equipment, {
  assignedDate: zTimestamp,
  scrapDate: zTimestamp,
}).omit({ id: true });

export const insertRequestSchema = createInsertSchema(maintenanceRequests, {
  scheduledDate: zTimestamp,
  actualStartDate: zTimestamp,
  completedDate: zTimestamp,
}).omit({ id: true, createdAt: true });

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, timestamp: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Department = typeof departments.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

