import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export const users = pgTable("users", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").notNull().default("admin"),
});
export const series = pgTable("series", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    name: text("name").notNull(),
    minValue: doublePrecision("min_value").notNull(),
    maxValue: doublePrecision("max_value").notNull(),
    color: text("color").notNull(),
    icon: text("icon").notNull(),
    createdById: varchar("created_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const measurements = pgTable("measurements", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    value: doublePrecision("value").notNull(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    seriesId: varchar("series_id").notNull().references(() => series.id, { onDelete: "cascade" }),
    createdById: varchar("created_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const usersRelations = relations(users, ({ many }) => ({
    series: many(series),
    measurements: many(measurements),
}));
export const seriesRelations = relations(series, ({ one, many }) => ({
    createdBy: one(users, {
        fields: [series.createdById],
        references: [users.id],
    }),
    measurements: many(measurements),
}));
export const measurementsRelations = relations(measurements, ({ one }) => ({
    series: one(series, {
        fields: [measurements.seriesId],
        references: [series.id],
    }),
    createdBy: one(users, {
        fields: [measurements.createdById],
        references: [users.id],
    }),
}));
export const insertUserSchema = createInsertSchema(users).omit({
    id: true,
});
export const loginSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
});
export const insertSeriesSchema = createInsertSchema(series).omit({
    id: true,
    createdById: true,
    createdAt: true,
}).extend({
    minValue: z.number().finite(),
    maxValue: z.number().finite(),
}).refine((data) => data.maxValue > data.minValue, {
    message: "Max value must be greater than min value",
    path: ["maxValue"],
});
export const updateSeriesSchema = z.object({
    name: z.string().optional(),
    minValue: z.number().finite().optional(),
    maxValue: z.number().finite().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
});
export const insertMeasurementSchema = createInsertSchema(measurements).omit({
    id: true,
    createdById: true,
    createdAt: true,
    timestamp: true,
}).extend({
    value: z.number().finite(),
    timestamp: z.string().datetime().optional(),
});
export const updateMeasurementSchema = z.object({
    value: z.number().finite().optional(),
    timestamp: z.string().datetime().optional(),
});
