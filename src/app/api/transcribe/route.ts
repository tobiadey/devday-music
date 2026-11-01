import OpenAI, { toFile } from "openai";
import { NextRequest } from "next/server";
import { failure, guard, PublicError } from "@/lib/guard";

export const maxDuration = 60;
export async function POST(req: NextRequest) {
  try {
    guard(req, "voice", 15);
    if (
      Number(req.headers.get("content-length") ?? 0) >
      3 * 1024 * 1024 + 65536
    )
      throw new PublicError("Please record a shorter voice note.", 413);
    const form = await req.formData();
    const file = form.get("audio");
    if (
      !(file instanceof File) ||
      !file.size ||
      file.size > 3 * 1024 * 1024 ||
      !/^(audio\/(webm|mp4|mpeg|wav|ogg)|video\/webm)/.test(file.type)
    )
      throw new PublicError("Please record a voice note under one minute.");
    const transcription = await new OpenAI().audio.transcriptions.create(
      {
        model: "gpt-transcribe",
        file: await toFile(Buffer.from(await file.arrayBuffer()), file.name, {
          type: file.type,
        }),
      },
      { timeout: 40000, maxRetries: 0 },
    );
    return Response.json(
      { text: transcription.text },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
