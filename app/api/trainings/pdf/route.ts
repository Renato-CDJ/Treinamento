import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 })
    }

    // Fetch the PDF from Vercel Blob
    const response = await fetch(url)

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro ao buscar PDF' }, { status: response.status })
    }

    const pdfBuffer = await response.arrayBuffer()

    // Return the PDF with proper headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error proxying PDF:', error)
    return NextResponse.json({ error: 'Erro ao carregar PDF' }, { status: 500 })
  }
}
