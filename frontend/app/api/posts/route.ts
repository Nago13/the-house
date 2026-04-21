import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "posts.json");
    const raw      = fs.readFileSync(filePath, "utf-8");
    const posts    = JSON.parse(raw);
    return NextResponse.json(posts);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
