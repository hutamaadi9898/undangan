import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const weddings = sqliteTable(
	"weddings",
	{
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	slug: text("slug").notNull().unique(),
	title: text("title").notNull(),
	coupleNames: text("couple_names").notNull(),
	eventDate: text("event_date").notNull(),
	themeId: text("theme_id"),
	status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`)
	}
);

export const pages = sqliteTable("pages", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	weddingId: text("wedding_id")
		.notNull()
		.references(() => weddings.id, { onDelete: "cascade" }),
	type: text("type").notNull(),
	orderIndex: integer("order_index").notNull().default(0),
	contentJson: text("content_json").notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`)
});

export const rsvps = sqliteTable("rsvps", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	weddingId: text("wedding_id")
		.notNull()
		.references(() => weddings.id, { onDelete: "cascade" }),
	guestName: text("guest_name").notNull(),
	contact: text("phone_or_email").notNull(),
	attending: text("attending", { enum: ["yes", "no", "maybe"] }).notNull(),
	paxCount: integer("pax_count").notNull().default(1),
	message: text("message"),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`)
});

export const photos = sqliteTable("photos", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	weddingId: text("wedding_id")
		.notNull()
		.references(() => weddings.id, { onDelete: "cascade" }),
	r2Key: text("r2_key").notNull(),
	uploaderName: text("uploader_name"),
	caption: text("caption"),
	status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`)
});

export const themes = sqliteTable("themes", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	previewUrl: text("preview_url"),
	configJson: text("config_json").notNull()
});

export type Wedding = typeof weddings.$inferSelect;
export type NewWedding = typeof weddings.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type Rsvp = typeof rsvps.$inferSelect;
export type NewRsvp = typeof rsvps.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
export type Theme = typeof themes.$inferSelect;
export type NewTheme = typeof themes.$inferInsert;
