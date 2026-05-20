-- ============================================================
-- MIGRACAO: Adicionar coluna category na tabela tabulations
-- 
-- Execute este script no SQL Editor do Supabase para adicionar
-- o campo de categoria (antes/depois da confirmacao de CPF)
-- ============================================================

-- Adicionar coluna category se nao existir
ALTER TABLE tabulations 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'before' CHECK (category IN ('before', 'after'));

-- Comentario explicativo
COMMENT ON COLUMN tabulations.category IS 'Categoria da tabulacao: before = Antes da confirmacao de CPF, after = Depois da confirmacao de CPF';
