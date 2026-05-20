import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { filename } = await request.json()

    // Check if slides are already converted
    const slidesDir = path.join(process.cwd(), "public", "presentations", "slides", filename.replace(/\.(pptx?)$/i, ""))

    if (fs.existsSync(slidesDir)) {
      const files = fs.readdirSync(slidesDir)
      const slides = files
        .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))
        .sort()
        .map((file) => `/presentations/slides/${filename.replace(/\.(pptx?)$/i, "")}/${file}`)

      return NextResponse.json({ slides })
    }

    return NextResponse.json({
      slides: [],
      message: "Slides not converted yet. Please convert PPT to images manually.",
    })
  } catch (error) {
    console.error("Error converting presentation:", error)
    return NextResponse.json({ error: "Failed to process presentation" }, { status: 500 })
  }
}
