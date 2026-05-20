import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    },
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('file')

    if (!filename) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 })
    }

    // Validar o nome do arquivo para evitar path traversal
    if (filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
    }

    // Caminho do arquivo
    const filePath = path.join(process.cwd(), 'public', 'presentations', 'slides', filename)

    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
    }

    // Ler o arquivo
    const pdfBuffer = fs.readFileSync(filePath)

    // Retornar com headers apropriados para PDF.js e CORS
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename=' + filename,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error) {
    console.error('[v0] Error serving PDF:', error)
    return NextResponse.json({ 
      error: 'Erro ao carregar PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
