import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("commuter"), // "commuter" | "guardian" | "both"
  lang: text("lang").notNull().default("en"), // "en" | "hi"
  guardians: jsonb("guardians").default([]), // [{ name: string, phone: string }]
  pushTokens: jsonb("push_tokens").default([]), // string[]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerUid: text("owner_uid").notNull().references(() => users.id),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  etaMinutes: integer("eta_minutes").notNull(),
  active: boolean("active").notNull().default(true),
  lastLat: real("last_lat"),
  lastLng: real("last_lng"),
  lastUpdateAt: timestamp("last_update_at"),
});

export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: text("trip_id").notNull().references(() => trips.id),
  ownerUid: text("owner_uid").notNull().references(() => users.id),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "broadcasting" | "resolved"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  category: text("category").notNull(), // "harassment" | "poor_lighting" | "stray_dogs" | "other"
  text: text("text"),
  anonymous: boolean("anonymous").notNull().default(false),
  geohash: text("geohash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  startedAt: true,
  lastUpdateAt: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidents.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
