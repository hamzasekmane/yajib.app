CREATE TYPE "public"."order_status" AS ENUM('pending', 'accepted', 'preparing', 'ready', 'assigned', 'delivering', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('customer', 'owner', 'driver');--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"vehicle" varchar(60) DEFAULT 'دراجة نارية',
	"is_online" boolean DEFAULT false NOT NULL,
	"lat" double precision DEFAULT 24.7136 NOT NULL,
	"lng" double precision DEFAULT 46.6753 NOT NULL,
	"rating" double precision DEFAULT 5 NOT NULL,
	"deliveries_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "drivers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text DEFAULT '',
	"price" double precision NOT NULL,
	"category" varchar(80) DEFAULT 'رئيسى',
	"emoji" varchar(8) DEFAULT '🍽️',
	"available" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"driver_id" integer,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"items" text NOT NULL,
	"subtotal" double precision NOT NULL,
	"delivery_fee" double precision DEFAULT 0 NOT NULL,
	"total" double precision NOT NULL,
	"distance_km" double precision DEFAULT 0 NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"dest_lat" double precision DEFAULT 24.7136 NOT NULL,
	"dest_lng" double precision DEFAULT 46.6753 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"description" text DEFAULT '',
	"cuisine" varchar(80) DEFAULT 'عام',
	"logo_color" varchar(20) DEFAULT '#f97316',
	"lat" double precision DEFAULT 24.7136 NOT NULL,
	"lng" double precision DEFAULT 46.6753 NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'customer' NOT NULL,
	"lat" double precision DEFAULT 24.7136,
	"lng" double precision DEFAULT 46.6753,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;