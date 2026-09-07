import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  doublePrecision,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["customer", "owner", "driver"]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending", // فى طابور المطعم
  "accepted", // المطعم قبل الطلب
  "preparing", // قيد التحضير
  "ready", // جاهز للاستلام
  "assigned", // تم تعيين سائق
  "delivering", // فى الطريق
  "delivered", // تم التوصيل
  "cancelled", // ملغى
]);

// ─────────────────────────────────────────────────────────────
// Users (customer / owner / driver)
// ─────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("customer"),
  // موقع افتراضى للمستخدم (للزبون / السائق)
  lat: doublePrecision("lat").default(24.7136),
  lng: doublePrecision("lng").default(46.6753),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────
// Restaurants — كل مطعم مرتبط بمالك (owner) وله رابط فرعى (slug)
// ─────────────────────────────────────────────────────────────
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  description: text("description").default(""),
  cuisine: varchar("cuisine", { length: 80 }).default("عام"),
  logoColor: varchar("logo_color", { length: 20 }).default("#f97316"),
  lat: doublePrecision("lat").default(24.7136).notNull(),
  lng: doublePrecision("lng").default(46.6753).notNull(),
  isOpen: boolean("is_open").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────
// Menu items
// ─────────────────────────────────────────────────────────────
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description").default(""),
  price: doublePrecision("price").notNull(),
  category: varchar("category", { length: 80 }).default("رئيسى"),
  emoji: varchar("emoji", { length: 8 }).default("🍽️"),
  available: boolean("available").default(true).notNull(),
});

// ─────────────────────────────────────────────────────────────
// Drivers — ملف السائق (مرتبط بمستخدم دوره driver)
// ─────────────────────────────────────────────────────────────
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  vehicle: varchar("vehicle", { length: 60 }).default("دراجة نارية"),
  isOnline: boolean("is_online").default(false).notNull(),
  lat: doublePrecision("lat").default(24.7136).notNull(),
  lng: doublePrecision("lng").default(46.6753).notNull(),
  rating: doublePrecision("rating").default(5).notNull(),
  deliveriesCount: integer("deliveries_count").default(0).notNull(),
});

// ─────────────────────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  restaurantId: integer("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  driverId: integer("driver_id").references(() => drivers.id, {
    onDelete: "set null",
  }),
  status: orderStatusEnum("status").notNull().default("pending"),
  items: text("items").notNull(), // JSON string [{id,name,price,qty}]
  subtotal: doublePrecision("subtotal").notNull(),
  deliveryFee: doublePrecision("delivery_fee").notNull().default(0),
  total: doublePrecision("total").notNull(),
  distanceKm: doublePrecision("distance_km").default(0).notNull(),
  address: text("address").default("").notNull(),
  destLat: doublePrecision("dest_lat").default(24.7136).notNull(),
  destLng: doublePrecision("dest_lng").default(46.6753).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Restaurant = typeof restaurants.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Order = typeof orders.$inferSelect;
