import { get } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    const { filename } = await params
    
    if (!token) {
      return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })
    }

    const decodedFilename = decodeURIComponent(filename)
    
    const result = await get(decodedFilename, {
      token,
      access: "private",
    })

    if (!result) {
      return new NextResponse('Arquivo não encontrado', { status: 404 })
    }

    // Stream the PDF file
    const response = await fetch(result.blob.url)
    const blob = await response.blob()

    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${decodedFilename}"`,
      },
    })
  } catch (error) {
    console.error('Error serving PDF:', error)
    return NextResponse.json({ error: 'Erro ao carregar PDF' }, { status: 500 })
  }
}
