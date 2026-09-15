// Browser-only: shrinks a photo picked in /admin/carta before uploading it,
// so a 6MB phone picture is stored as a ~200KB JPEG. Menu cards never
// render wider than ~600px, so 1600px leaves room for retina screens.
export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.85,
): Promise<{ mimeType: "image/jpeg"; base64Data: string }> {
  // Throws for formats the browser can't decode (e.g. HEIC outside Safari).
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  // JPEG has no transparency — fill with the site's background color so
  // transparent PNGs don't turn black-on-black or white boxes.
  ctx.fillStyle = "#0b0d10";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("Couldn't encode the image");

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  // Strip the "data:image/jpeg;base64," prefix.
  return { mimeType: "image/jpeg", base64Data: dataUrl.split(",")[1] ?? "" };
}
