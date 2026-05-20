import { put, del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

const token = process.env.BLOB_READ_WRITE_TOKEN

export async function POST(request: NextRequest) {
  try {
    if (!token) {
      console.error('BLOB_READ_WRITE_TOKEN not configured')
      return NextResponse.json({ error: 'Token de storage não configurado' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo fornecido' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.includes('pdf')) {
      return NextResponse.json({ error: 'Apenas arquivos PDF são permitidos' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB' }, { status: 400 })
    }

    const blob = await put(`treinamentos/${Date.now()}-${file.name}`, file, {
      access: 'public',
      token,
    })

    return NextResponse.json({ 
      url: blob.url,
      pathname: blob.pathname,
      filename: file.name,
      size: file.size
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Falha no upload' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!token) {
      return NextResponse.json({ error: 'Token de storage não configurado' }, { status: 500 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 })
    }

    await del(url, { token })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Falha ao deletar' }, { status: 500 })
  }
}
