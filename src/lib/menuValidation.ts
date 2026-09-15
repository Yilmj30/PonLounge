import { z } from "zod";
import { MENU_IMAGE_URL_PREFIX } from "@/lib/menu";

// Empty strings from the admin form become null ("not filled in").
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

// Either a static photo under /public or one uploaded via /admin/carta —
// never an arbitrary external URL.
const IMAGE_PATH_PATTERN = new RegExp(
  "^(/(carta|photos)/[\\w.-]+\\.(jpe?g|png|webp)|" +
    MENU_IMAGE_URL_PREFIX +
    "[0-9a-f-]{36})$",
);

export const menuItemSchema = z.object({
  categoryId: z.string().trim().min(1).max(80),
  nameEs: z.string().trim().min(1).max(120),
  nameEn: optionalText(120),
  descEs: z.string().trim().max(600).default(""),
  descEn: optionalText(600),
  price: z.number().int().min(0).max(100_000_000).nullable(),
  image: z.string().regex(IMAGE_PATH_PATTERN).nullable(),
  subcategoryEs: optionalText(80),
  subcategoryEn: optionalText(80),
  available: z.boolean(),
});

export const menuCategorySchema = z.object({
  nameEs: z.string().trim().min(1).max(80),
  nameEn: optionalText(80),
});

export const moveSchema = z.object({
  direction: z.enum(["up", "down"]),
});

// The editor resizes photos in the browser (JPEG, max 1600px), so real
// uploads are a few hundred KB; this cap just rejects anything abusive.
export const MAX_MENU_IMAGE_BYTES = 3 * 1024 * 1024;

export const menuImageUploadSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  base64Data: z
    .string()
    .min(1)
    .max(Math.ceil((MAX_MENU_IMAGE_BYTES * 4) / 3)),
});
