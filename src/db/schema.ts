import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  date,
  time,
  timestamp,
  pgEnum,
  index,
  check,
} from "drizzle-orm/pg-core";

export const reservationStatus = pgEnum("reservation_status", [
  "confirmed",
  "pending_deposit",
  "cancelled",
]);

// Which channel a reservation came in through: the web wizard or the
// "reservar por correo" inbound-email flow.
export const reservationSource = pgEnum("reservation_source", ["web", "email"]);

// Language the customer booked in — follow-up emails (approved, rejected)
// are sent in the same language.
export const reservationLang = pgEnum("reservation_lang", ["es", "en"]);

// Why a reservation ended up "cancelled": the customer cancelled it
// themselves (/cancelar), or staff rejected its deposit on /admin.
export const cancellationReason = pgEnum("cancellation_reason", [
  "customer",
  "deposit_rejected",
]);

export const slotCapacity = pgTable(
  "slot_capacity",
  {
    slotTime: time("slot_time").primaryKey(),
    capacity: integer("capacity").notNull(),
  },
  (t) => [check("slot_capacity_non_negative", sql`${t.capacity} >= 0`)],
);

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    confirmationCode: text("confirmation_code").notNull().unique(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    partySize: integer("party_size").notNull(),
    reservationDate: date("reservation_date").notNull(),
    reservationTime: time("reservation_time").notNull(),
    occasion: text("occasion"),
    notes: text("notes"),
    status: reservationStatus("status").notNull().default("confirmed"),
    source: reservationSource("source").notNull().default("web"),
    lang: reservationLang("lang").notNull().default("es"),
    // Deposit is self-declared by the customer (amount + a reference code
    // they put in the bank transfer's description) and verified manually
    // by staff against the bank statement — there's no payment gateway
    // wired up yet.
    depositRequired: integer("deposit_required").notNull().default(0),
    depositAmount: integer("deposit_amount").notNull().default(0),
    depositReference: text("deposit_reference"),
    depositVerified: boolean("deposit_verified").notNull().default(false),
    cancellationReason: cancellationReason("cancellation_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [
    // Capacity checks sum confirmed party sizes per date+time slot.
    index("reservations_slot_idx").on(
      t.reservationDate,
      t.reservationTime,
      t.status,
    ),
    // /admin lists pending deposits oldest-first.
    index("reservations_status_created_idx").on(t.status, t.createdAt),
    index("reservations_deposit_reference_idx").on(t.depositReference),
    index("reservations_email_idx").on(t.email),
    check("reservations_party_size_positive", sql`${t.partySize} >= 1`),
    check(
      "reservations_deposit_non_negative",
      sql`${t.depositRequired} >= 0 and ${t.depositAmount} >= 0`,
    ),
  ],
);

// Deposit receipt screenshots, keyed by the "DEP-XXXXXX" reference the
// customer puts in the transfer description. Not a foreign key to
// reservations: the receipt is uploaded before the reservation row exists
// (and the email flow uploads it before the email is even sent).
export const depositReceipts = pgTable("deposit_receipts", {
  depositReference: text("deposit_reference").primaryKey(),
  mimeType: text("mime_type").notNull(),
  base64Data: text("base64_data").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Inbound-email webhook deliveries already handled, so a retried delivery
// can't double-book.
export const processedWebhookEvents = pgTable("processed_webhook_events", {
  eventId: text("event_id").primaryKey(),
  processedAt: timestamp("processed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- Menu (carta), editable by the owners from /admin/carta ---
// Seeded once from src/data/menu.ts by `npm run db:seed`; from then on this
// is the source of truth for /carta and the home page teaser.

export const menuCategories = pgTable("menu_categories", {
  // Stable slug (e.g. "casa") — also used as the accordion anchor id.
  id: text("id").primaryKey(),
  nameEs: text("name_es").notNull(),
  nameEn: text("name_en"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const menuItems = pgTable(
  "menu_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => menuCategories.id, { onUpdate: "cascade" }),
    nameEs: text("name_es").notNull(),
    // English fields are optional — the site falls back to Spanish.
    nameEn: text("name_en"),
    descEs: text("desc_es").notNull().default(""),
    descEn: text("desc_en"),
    // Null while a price is still pending — the card just hides the badge.
    price: integer("price"),
    // Either a static path under /public (e.g. "/carta/negroni.jpg") or an
    // uploaded photo served from /api/menu-images/<id>.
    image: text("image"),
    subcategoryEs: text("subcategory_es"),
    subcategoryEn: text("subcategory_en"),
    // Hidden from the public menu without deleting it (e.g. out of stock).
    available: boolean("available").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("menu_items_category_sort_idx").on(t.categoryId, t.sortOrder),
    check(
      "menu_items_price_non_negative",
      sql`${t.price} is null or ${t.price} >= 0`,
    ),
  ],
);

// Photos uploaded from /admin/carta (already resized/compressed in the
// browser before upload, so each row is small).
export const menuImages = pgTable("menu_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  mimeType: text("mime_type").notNull(),
  base64Data: text("base64_data").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type SlotCapacity = typeof slotCapacity.$inferSelect;
export type DepositReceipt = typeof depositReceipts.$inferSelect;
export type MenuCategoryRow = typeof menuCategories.$inferSelect;
export type MenuItemRow = typeof menuItems.$inferSelect;
