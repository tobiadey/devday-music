import assert from "node:assert/strict";
import test from "node:test";
import { readImage, MAX_IMAGE_DATA_URL } from "../src/lib/image-input";
import { requestSchema } from "../src/lib/music";

const jpeg = `data:image/jpeg;base64,${Buffer.from([255, 216, 255, 224]).toString("base64")}`;

test("discovery accepts an image without requiring accompanying text", () => {
  assert.equal(
    requestSchema.safeParse({ prompt: "", image: jpeg }).success,
    true,
  );
  assert.equal(requestSchema.safeParse({ image: jpeg }).success, true);
  assert.equal(
    requestSchema.safeParse({ prompt: "", image: "" }).success,
    false,
  );
  assert.equal(requestSchema.safeParse({ prompt: "" }).success, false);
});

test("image parsing bounds size and rejects disguised or unsupported files", () => {
  assert.equal(readImage(), null);
  assert.equal(readImage(jpeg)?.mediaType, "image/jpeg");
  assert.throws(() => readImage("data:image/svg+xml;base64,PHN2Zz4="));
  assert.throws(() => readImage("data:image/jpeg;base64,aGVsbG8="));
  assert.throws(() => readImage("x".repeat(MAX_IMAGE_DATA_URL + 1)));
});
