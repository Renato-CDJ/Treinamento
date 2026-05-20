import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const TABLE_NAME = 'training_views'

// POST - Registrar visualização de treinamento
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { training_filename, training_title, user_id, user_name } = body

    if (!training_filename || !user_id || !user_name) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const supabase = createAdminClient()
    
    const { error } = await supabase.from(TABLE_NAME).insert({
      training_filename,
      training_title: training_title || training_filename,
      user_id,
      user_name,
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error in training views POST:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET - Buscar visualizações (para relatório)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get('filename')

    const supabase = createAdminClient()
    
    let query = supabase
      .from(TABLE_NAME)
      .select('*')
      .order('viewed_at', { ascending: false })
    
    if (filename) {
      query = query.eq('training_filename', filename)
    }

    const { data: views, error } = await query

    if (error) throw error

    return NextResponse.json({ views: views || [] })
  } catch (error) {
    console.error('[v0] Error in training views GET:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
