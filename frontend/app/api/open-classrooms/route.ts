// /app/api/open-classrooms/route.ts
import { NextResponse } from "next/server";

const BASE_URL = process.env.BACKEND_URL;

if (!BASE_URL) {
  throw new Error("BACKEND_URL is not set");
}

const OPEN_CLASSROOMS_URL = `${BASE_URL}/api/open-classrooms`;

export async function POST(req: Request) {
  try {
    const { lat, lng } = await req.json();

    const response = await fetch(OPEN_CLASSROOMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch data", details: text },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in POST route:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const response = await fetch(OPEN_CLASSROOMS_URL, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch data", details: text },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET route:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
