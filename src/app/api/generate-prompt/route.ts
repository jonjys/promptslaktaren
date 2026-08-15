import { NextRequest, NextResponse } from "next/server";
import { generate15PointPrompt, generateSeoTitle, generateSeoDescription } from "@/lib/prompt-template";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const word = (body.word || "").toString().trim();

    if (!word || word.length < 2 || word.length > 40) {
      return NextResponse.json(
        { ok: false, error: "Ord måste vara 2-40 tecken" },
        { status: 400 }
      );
    }

    const prompt = generate15PointPrompt(word);
    const seoTitle = generateSeoTitle(word);
    const seoDescription = generateSeoDescription(word);
    const slug = `${word.toLowerCase().replace(/\s+/g, "-")}-app-prompt`;

    return NextResponse.json({
      ok: true,
      data: {
        word,
        slug,
        prompt,
        seoTitle,
        seoDescription,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: "Något gick fel" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const word = req.nextUrl.searchParams.get("word") || "bokning";
  const prompt = generate15PointPrompt(word);
  return NextResponse.json({
    ok: true,
    data: { word, prompt },
  });
}
