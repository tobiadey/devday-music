export const MAX_IMAGE_DATA_URL = 1_800_000;
export function readImage(dataUrl?: string) {
  if (!dataUrl) return null;
  if (dataUrl.length > MAX_IMAGE_DATA_URL)
    throw new Error("Please choose a smaller image.");
  const match =
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error("Choose a JPEG, PNG or WebP image.");
  const bytes = Buffer.from(match[2], "base64");
  const valid =
    match[1] === "image/jpeg"
      ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : match[1] === "image/png"
        ? bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP";
  if (!valid) throw new Error("That file doesn't look like a supported image.");
  return { bytes, mediaType: match[1] };
}
