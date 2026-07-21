import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.ogv', '.mov']

function listFiles(
  dir: string,
  urlBase: string,
  filter: (ext: string, file: string) => boolean,
  type: 'pdf' | 'video',
) {
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter((file) => {
      const ext = path.extname(file).toLowerCase()
      return (
        filter(ext, file) &&
        !file.startsWith('.') &&
        !file.toLowerCase().includes('readme')
      )
    })
    .map((file) => {
      const filePath = path.join(dir, file)
      const stats = fs.statSync(filePath)
      const ext = path.extname(file)

      return {
        id: `${type}-${file}`,
        type,
        title: path.basename(file, ext).replace(/-/g, ' ').replace(/_/g, ' '),
        filename: file,
        url: `${urlBase}/${file}`,
        size: stats.size,
        uploadedAt: stats.mtime.toISOString(),
      }
    })
}

export async function GET() {
  try {
    const slidesDir = path.join(process.cwd(), 'public', 'presentations', 'slides')
    const videosDir = path.join(process.cwd(), 'public', 'presentations', 'videos')

    const pdfFiles = listFiles(
      slidesDir,
      '/presentations/slides',
      (ext) => ext === '.pdf',
      'pdf',
    )

    const videoFiles = listFiles(
      videosDir,
      '/presentations/videos',
      (ext) => VIDEO_EXTENSIONS.includes(ext),
      'video',
    )

    const trainings = [...pdfFiles, ...videoFiles].sort((a, b) =>
      a.title.localeCompare(b.title, 'pt-BR'),
    )

    return NextResponse.json({ trainings })
  } catch (error) {
    console.error('[v0] Error listing trainings:', error)
    return NextResponse.json({ 
      error: 'Erro ao listar treinamentos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
