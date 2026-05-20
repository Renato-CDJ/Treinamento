import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Caminho para a pasta de slides
    const slidesDir = path.join(process.cwd(), 'public', 'presentations', 'slides')
    
    // Verificar se o diretorio existe
    if (!fs.existsSync(slidesDir)) {
      return NextResponse.json({ trainings: [] })
    }
    
    // Ler todos os arquivos da pasta
    const files = fs.readdirSync(slidesDir)
    
    // Filtrar apenas PDFs (ignorar README e outros arquivos)
    const pdfFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase()
        return ext === '.pdf' && !file.startsWith('.') && !file.toLowerCase().includes('readme')
      })
      .map(file => {
        const filePath = path.join(slidesDir, file)
        const stats = fs.statSync(filePath)
        
        return {
          id: file,
          title: path.basename(file, '.pdf').replace(/-/g, ' ').replace(/_/g, ' '),
          filename: file,
          url: `/presentations/slides/${file}`,
          size: stats.size,
          uploadedAt: stats.mtime.toISOString(),
        }
      })
      .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))

    return NextResponse.json({ trainings: pdfFiles })
  } catch (error) {
    console.error('[v0] Error listing trainings:', error)
    return NextResponse.json({ 
      error: 'Erro ao listar treinamentos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
