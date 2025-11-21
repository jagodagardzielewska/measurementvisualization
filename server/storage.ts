import { users, series, measurements, type User, type InsertUser, type Series, type InsertSeries, type Measurement, type InsertMeasurement } from "../shared/schema.js";
import { db } from "./db.js";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;
  getAllSeries(): Promise<Series[]>;
  getSeriesById(id: string): Promise<Series | undefined>;
  createSeries(series: InsertSeries, userId: string): Promise<Series>;
  updateSeries(id: string, series: Partial<InsertSeries>): Promise<Series | undefined>;
  deleteSeries(id: string): Promise<void>;

  getAllMeasurements(): Promise<Measurement[]>;
  getMeasurementById(id: string): Promise<Measurement | undefined>;
  getMeasurementsBySeries(seriesId: string): Promise<Measurement[]>;
  createMeasurement(measurement: InsertMeasurement, userId: string): Promise<Measurement>;
  updateMeasurement(id: string, measurement: Partial<InsertMeasurement>): Promise<Measurement | undefined>;
  deleteMeasurement(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, role: "admin" })
      .returning();
  
    return user;
  }  

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id));
  }

  async getAllSeries(): Promise<Series[]> {
    return await db.select().from(series).orderBy(desc(series.createdAt));
  }

  async getSeriesById(id: string): Promise<Series | undefined> {
    const [result] = await db.select().from(series).where(eq(series.id, id));
    return result || undefined;
  }

  async createSeries(insertSeries: InsertSeries, userId: string): Promise<Series> {
    const [newSeries] = await db
      .insert(series)
      .values({ ...insertSeries, createdById: userId })
      .returning();
    return newSeries;
  }

  async updateSeries(id: string, updateData: Partial<InsertSeries>): Promise<Series | undefined> {
    const [updated] = await db
      .update(series)
      .set(updateData)
      .where(eq(series.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSeries(id: string): Promise<void> {
    await db.delete(series).where(eq(series.id, id));
  }

  async getAllMeasurements(): Promise<Measurement[]> {
    return await db.select().from(measurements).orderBy(desc(measurements.timestamp));
  }

  async getMeasurementById(id: string): Promise<Measurement | undefined> {
    const [result] = await db.select().from(measurements).where(eq(measurements.id, id));
    return result || undefined;
  }

  async getMeasurementsBySeries(seriesId: string): Promise<Measurement[]> {
    return await db
      .select()
      .from(measurements)
      .where(eq(measurements.seriesId, seriesId))
      .orderBy(desc(measurements.timestamp));
  }

  async createMeasurement(
    insertMeasurement: InsertMeasurement,
    userId: string,
  ): Promise<Measurement> {
    const timestamp = insertMeasurement.timestamp
      ? new Date(insertMeasurement.timestamp)
      : new Date();

    const [newMeasurement] = await db
      .insert(measurements)
      .values({
        value: insertMeasurement.value,
        seriesId: insertMeasurement.seriesId,
        timestamp,
        createdById: userId,
      })
      .returning();
    return newMeasurement;
  }

  async updateMeasurement(
    id: string,
    updateData: Partial<InsertMeasurement>,
  ): Promise<Measurement | undefined> {
    const updates: any = {};
    if (updateData.value !== undefined) updates.value = updateData.value;
    if (updateData.timestamp) updates.timestamp = new Date(updateData.timestamp);

    const [updated] = await db
      .update(measurements)
      .set(updates)
      .where(eq(measurements.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMeasurement(id: string): Promise<void> {
    await db.delete(measurements).where(eq(measurements.id, id));
  }
}

export const storage = new DatabaseStorage();
