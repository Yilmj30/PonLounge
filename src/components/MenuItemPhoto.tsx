import Image from "next/image";

// Placeholder for a menu item's photo. Pass `image` (a path under /public,
// e.g. "/carta/dama-de-pon.jpg") once a real photo exists and it renders in
// place of the branded placeholder automatically — no other changes needed.
export default function MenuItemPhoto({
  image,
  alt,
  className = "aspect-[4/3] w-full",
  sizes = "(max-width: 768px) 50vw, 320px",
}: {
  image?: string;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {image ? (
        <Image
          src={image}
          alt={alt}
          fill
          className="object-cover"
          sizes={sizes}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, var(--color-brass-light), var(--color-emerald) 55%, var(--color-obsidian) 100%)",
          }}
        >
          <span
            aria-hidden="true"
            className="font-display text-cream/60 text-2xl"
          >
            ✦
          </span>
        </div>
      )}
    </div>
  );
}
