import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100";
  const isProd = process.env.NEXT_PUBLIC_ENV === "production";

  return {
    rules: {
      userAgent: "*",
      allow: isProd ? "/" : undefined,
      disallow: isProd ? undefined : "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
