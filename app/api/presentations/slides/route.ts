import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get("filename")

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 })
    }

    // Remove file extension and trailing periods
    const baseFilename = filename.replace(/\.(pptx?|PPTX?)$/, "").replace(/\.+$/, "")

    const presentationsDir = path.join(process.cwd(), "public", "presentations", "slides", baseFilename)

    // Check if directory exists
    if (!fs.existsSync(presentationsDir)) {
      return NextResponse.json({ error: "Presentation not found", slides: [] }, { status: 404 })
    }

    // Read all PNG files in the directory
    const files = fs.readdirSync(presentationsDir)
    const pngFiles = files
      .filter((file) => file.toLowerCase().endsWith(".png"))
      .sort((a, b) => {
        // Extract numbers from filenames for proper sorting
        const numA = Number.parseInt(a.match(/\d+/)?.[0] || "0")
        const numB = Number.parseInt(b.match(/\d+/)?.[0] || "0")
        return numA - numB
      })

    // Generate full URLs for slides
    const slides = pngFiles.map((file) => `/presentations/slides/${baseFilename}/${file}`)

    return NextResponse.json({ slides })
  } catch (error) {
    console.error("Error reading slides:", error)
    return NextResponse.json({ error: "Internal server error", slides: [] }, { status: 500 })
  }
}
