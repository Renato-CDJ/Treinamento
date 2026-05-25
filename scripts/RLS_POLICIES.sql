-- ============================================================
-- REPIR - ROTEIRO CALL CENTER
-- POLITICAS DE ROW LEVEL SECURITY (RLS)
-- 
-- Execute este script APOS o DATABASE_SETUP.sql
-- Versao: 1.2 - Com DROP IF EXISTS para reexecucao
-- ============================================================

-- ============================================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE situations ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE initial_guide ENABLE ROW LEVEL SECURITY;
ALTER TABLE phraseology ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_cloud ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. POLITICAS PARA TABELA USERS
-- ============================================================
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (true);

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (true);

CREATE POLICY "users_delete_policy" ON users
  FOR DELETE USING (true);

-- ============================================================
-- 3. POLITICAS PARA TABELA PRODUCTS
-- ============================================================
DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;
DROP POLICY IF EXISTS "products_delete_policy" ON products;

CREATE POLICY "products_select_policy" ON products
  FOR SELECT USING (true);

CREATE POLICY "products_insert_policy" ON products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "products_update_policy" ON products
  FOR UPDATE USING (true);

CREATE POLICY "products_delete_policy" ON products
  FOR DELETE USING (true);

-- ============================================================
-- 3.1. POLITICAS PARA TABELA CAMPAIGNS
-- ============================================================
DROP POLICY IF EXISTS "campaigns_select_policy" ON campaigns;
DROP POLICY IF EXISTS "campaigns_insert_policy" ON campaigns;
DROP POLICY IF EXISTS "campaigns_update_policy" ON campaigns;
DROP POLICY IF EXISTS "campaigns_delete_policy" ON campaigns;

CREATE POLICY "campaigns_select_policy" ON campaigns
  FOR SELECT USING (true);

CREATE POLICY "campaigns_insert_policy" ON campaigns
  FOR INSERT WITH CHECK (true);

CREATE POLICY "campaigns_update_policy" ON campaigns
  FOR UPDATE USING (true);

CREATE POLICY "campaigns_delete_policy" ON campaigns
  FOR DELETE USING (true);

-- ============================================================
-- 4. POLITICAS PARA TABELA SCRIPTS
-- ============================================================
DROP POLICY IF EXISTS "scripts_select_policy" ON scripts;
DROP POLICY IF EXISTS "scripts_insert_policy" ON scripts;
DROP POLICY IF EXISTS "scripts_update_policy" ON scripts;
DROP POLICY IF EXISTS "scripts_delete_policy" ON scripts;

CREATE POLICY "scripts_select_policy" ON scripts
  FOR SELECT USING (true);

CREATE POLICY "scripts_insert_policy" ON scripts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "scripts_update_policy" ON scripts
  FOR UPDATE USING (true);

CREATE POLICY "scripts_delete_policy" ON scripts
  FOR DELETE USING (true);

-- ============================================================
-- 5. POLITICAS PARA TABELAS DE CONFIGURACAO
-- (tabulations, situations, channels, result_codes)
-- ============================================================
-- Tabulations
DROP POLICY IF EXISTS "tabulations_select_policy" ON tabulations;
DROP POLICY IF EXISTS "tabulations_insert_policy" ON tabulations;
DROP POLICY IF EXISTS "tabulations_update_policy" ON tabulations;
DROP POLICY IF EXISTS "tabulations_delete_policy" ON tabulations;

CREATE POLICY "tabulations_select_policy" ON tabulations
  FOR SELECT USING (true);

CREATE POLICY "tabulations_insert_policy" ON tabulations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "tabulations_update_policy" ON tabulations
  FOR UPDATE USING (true);

CREATE POLICY "tabulations_delete_policy" ON tabulations
  FOR DELETE USING (true);

-- Situations
DROP POLICY IF EXISTS "situations_select_policy" ON situations;
DROP POLICY IF EXISTS "situations_insert_policy" ON situations;
DROP POLICY IF EXISTS "situations_update_policy" ON situations;
DROP POLICY IF EXISTS "situations_delete_policy" ON situations;

CREATE POLICY "situations_select_policy" ON situations
  FOR SELECT USING (true);

CREATE POLICY "situations_insert_policy" ON situations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "situations_update_policy" ON situations
  FOR UPDATE USING (true);

CREATE POLICY "situations_delete_policy" ON situations
  FOR DELETE USING (true);

-- Channels
DROP POLICY IF EXISTS "channels_select_policy" ON channels;
DROP POLICY IF EXISTS "channels_insert_policy" ON channels;
DROP POLICY IF EXISTS "channels_update_policy" ON channels;
DROP POLICY IF EXISTS "channels_delete_policy" ON channels;

CREATE POLICY "channels_select_policy" ON channels
  FOR SELECT USING (true);

CREATE POLICY "channels_insert_policy" ON channels
  FOR INSERT WITH CHECK (true);

CREATE POLICY "channels_update_policy" ON channels
  FOR UPDATE USING (true);

CREATE POLICY "channels_delete_policy" ON channels
  FOR DELETE USING (true);

-- Result Codes
DROP POLICY IF EXISTS "result_codes_select_policy" ON result_codes;
DROP POLICY IF EXISTS "result_codes_insert_policy" ON result_codes;
DROP POLICY IF EXISTS "result_codes_update_policy" ON result_codes;
DROP POLICY IF EXISTS "result_codes_delete_policy" ON result_codes;

CREATE POLICY "result_codes_select_policy" ON result_codes
  FOR SELECT USING (true);

CREATE POLICY "result_codes_insert_policy" ON result_codes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "result_codes_update_policy" ON result_codes
  FOR UPDATE USING (true);

CREATE POLICY "result_codes_delete_policy" ON result_codes
  FOR DELETE USING (true);

-- ============================================================
-- 6. POLITICAS PARA INITIAL_GUIDE E PHRASEOLOGY
-- ============================================================
-- Initial Guide
DROP POLICY IF EXISTS "initial_guide_select_policy" ON initial_guide;
DROP POLICY IF EXISTS "initial_guide_insert_policy" ON initial_guide;
DROP POLICY IF EXISTS "initial_guide_update_policy" ON initial_guide;
DROP POLICY IF EXISTS "initial_guide_delete_policy" ON initial_guide;

CREATE POLICY "initial_guide_select_policy" ON initial_guide
  FOR SELECT USING (true);

CREATE POLICY "initial_guide_insert_policy" ON initial_guide
  FOR INSERT WITH CHECK (true);

CREATE POLICY "initial_guide_update_policy" ON initial_guide
  FOR UPDATE USING (true);

CREATE POLICY "initial_guide_delete_policy" ON initial_guide
  FOR DELETE USING (true);

-- Phraseology
DROP POLICY IF EXISTS "phraseology_select_policy" ON phraseology;
DROP POLICY IF EXISTS "phraseology_insert_policy" ON phraseology;
DROP POLICY IF EXISTS "phraseology_update_policy" ON phraseology;
DROP POLICY IF EXISTS "phraseology_delete_policy" ON phraseology;

CREATE POLICY "phraseology_select_policy" ON phraseology
  FOR SELECT USING (true);

CREATE POLICY "phraseology_insert_policy" ON phraseology
  FOR INSERT WITH CHECK (true);

CREATE POLICY "phraseology_update_policy" ON phraseology
  FOR UPDATE USING (true);

CREATE POLICY "phraseology_delete_policy" ON phraseology
  FOR DELETE USING (true);

-- ============================================================
-- 7. POLITICAS PARA APP_SETTINGS
-- ============================================================
DROP POLICY IF EXISTS "app_settings_select_policy" ON app_settings;
DROP POLICY IF EXISTS "app_settings_insert_policy" ON app_settings;
DROP POLICY IF EXISTS "app_settings_update_policy" ON app_settings;
DROP POLICY IF EXISTS "app_settings_delete_policy" ON app_settings;

CREATE POLICY "app_settings_select_policy" ON app_settings
  FOR SELECT USING (true);

CREATE POLICY "app_settings_insert_policy" ON app_settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "app_settings_update_policy" ON app_settings
  FOR UPDATE USING (true);

CREATE POLICY "app_settings_delete_policy" ON app_settings
  FOR DELETE USING (true);

-- ============================================================
-- 8. POLITICAS PARA MESSAGES
-- ============================================================
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON messages;

CREATE POLICY "messages_select_policy" ON messages
  FOR SELECT USING (true);

CREATE POLICY "messages_insert_policy" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "messages_update_policy" ON messages
  FOR UPDATE USING (true);

CREATE POLICY "messages_delete_policy" ON messages
  FOR DELETE USING (true);

-- ============================================================
-- 9. POLITICAS PARA QUIZ_ATTEMPTS
-- ============================================================
DROP POLICY IF EXISTS "quiz_attempts_select_policy" ON quiz_attempts;
DROP POLICY IF EXISTS "quiz_attempts_insert_policy" ON quiz_attempts;
DROP POLICY IF EXISTS "quiz_attempts_update_policy" ON quiz_attempts;
DROP POLICY IF EXISTS "quiz_attempts_delete_policy" ON quiz_attempts;

CREATE POLICY "quiz_attempts_select_policy" ON quiz_attempts
  FOR SELECT USING (true);

CREATE POLICY "quiz_attempts_insert_policy" ON quiz_attempts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "quiz_attempts_update_policy" ON quiz_attempts
  FOR UPDATE USING (true);

CREATE POLICY "quiz_attempts_delete_policy" ON quiz_attempts
  FOR DELETE USING (true);

-- ============================================================
-- 10. POLITICAS PARA FEEDBACKS
-- ============================================================
DROP POLICY IF EXISTS "feedbacks_select_policy" ON feedbacks;
DROP POLICY IF EXISTS "feedbacks_insert_policy" ON feedbacks;
DROP POLICY IF EXISTS "feedbacks_update_policy" ON feedbacks;
DROP POLICY IF EXISTS "feedbacks_delete_policy" ON feedbacks;

CREATE POLICY "feedbacks_select_policy" ON feedbacks
  FOR SELECT USING (true);

CREATE POLICY "feedbacks_insert_policy" ON feedbacks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "feedbacks_update_policy" ON feedbacks
  FOR UPDATE USING (true);

CREATE POLICY "feedbacks_delete_policy" ON feedbacks
  FOR DELETE USING (true);

-- ============================================================
-- 11. POLITICAS PARA QUALITY_POSTS E QUALITY_COMMENTS
-- ============================================================
-- Quality Posts
DROP POLICY IF EXISTS "quality_posts_select_policy" ON quality_posts;
DROP POLICY IF EXISTS "quality_posts_insert_policy" ON quality_posts;
DROP POLICY IF EXISTS "quality_posts_update_policy" ON quality_posts;
DROP POLICY IF EXISTS "quality_posts_delete_policy" ON quality_posts;

CREATE POLICY "quality_posts_select_policy" ON quality_posts
  FOR SELECT USING (true);

CREATE POLICY "quality_posts_insert_policy" ON quality_posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "quality_posts_update_policy" ON quality_posts
  FOR UPDATE USING (true);

CREATE POLICY "quality_posts_delete_policy" ON quality_posts
  FOR DELETE USING (true);

-- Quality Comments
DROP POLICY IF EXISTS "quality_comments_select_policy" ON quality_comments;
DROP POLICY IF EXISTS "quality_comments_insert_policy" ON quality_comments;
DROP POLICY IF EXISTS "quality_comments_update_policy" ON quality_comments;
DROP POLICY IF EXISTS "quality_comments_delete_policy" ON quality_comments;

CREATE POLICY "quality_comments_select_policy" ON quality_comments
  FOR SELECT USING (true);

CREATE POLICY "quality_comments_insert_policy" ON quality_comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "quality_comments_update_policy" ON quality_comments
  FOR UPDATE USING (true);

CREATE POLICY "quality_comments_delete_policy" ON quality_comments
  FOR DELETE USING (true);

-- ============================================================
-- 12. POLITICAS PARA ADMIN_QUESTIONS
-- ============================================================
DROP POLICY IF EXISTS "admin_questions_select_policy" ON admin_questions;
DROP POLICY IF EXISTS "admin_questions_insert_policy" ON admin_questions;
DROP POLICY IF EXISTS "admin_questions_update_policy" ON admin_questions;
DROP POLICY IF EXISTS "admin_questions_delete_policy" ON admin_questions;

CREATE POLICY "admin_questions_select_policy" ON admin_questions
  FOR SELECT USING (true);

CREATE POLICY "admin_questions_insert_policy" ON admin_questions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_questions_update_policy" ON admin_questions
  FOR UPDATE USING (true);

CREATE POLICY "admin_questions_delete_policy" ON admin_questions
  FOR DELETE USING (true);

-- ============================================================
-- 13. POLITICAS PARA CHAT_MESSAGES
-- ============================================================
DROP POLICY IF EXISTS "chat_messages_select_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_update_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete_policy" ON chat_messages;

CREATE POLICY "chat_messages_select_policy" ON chat_messages
  FOR SELECT USING (true);

CREATE POLICY "chat_messages_insert_policy" ON chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "chat_messages_update_policy" ON chat_messages
  FOR UPDATE USING (true);

CREATE POLICY "chat_messages_delete_policy" ON chat_messages
  FOR DELETE USING (true);

-- ============================================================
-- 14. POLITICAS PARA SUPERVISOR_CHAT_MESSAGES
-- ============================================================
DROP POLICY IF EXISTS "supervisor_chat_select_policy" ON supervisor_chat_messages;
DROP POLICY IF EXISTS "supervisor_chat_insert_policy" ON supervisor_chat_messages;
DROP POLICY IF EXISTS "supervisor_chat_update_policy" ON supervisor_chat_messages;
DROP POLICY IF EXISTS "supervisor_chat_delete_policy" ON supervisor_chat_messages;

CREATE POLICY "supervisor_chat_select_policy" ON supervisor_chat_messages
  FOR SELECT USING (true);

CREATE POLICY "supervisor_chat_insert_policy" ON supervisor_chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "supervisor_chat_update_policy" ON supervisor_chat_messages
  FOR UPDATE USING (true);

CREATE POLICY "supervisor_chat_delete_policy" ON supervisor_chat_messages
  FOR DELETE USING (true);

-- ============================================================
-- 15. POLITICAS PARA QUALITY_CHAT_MESSAGES
-- ============================================================
DROP POLICY IF EXISTS "quality_chat_select_policy" ON quality_chat_messages;
DROP POLICY IF EXISTS "quality_chat_insert_policy" ON quality_chat_messages;
DROP POLICY IF EXISTS "quality_chat_update_policy" ON quality_chat_messages;
DROP POLICY IF EXISTS "quality_chat_delete_policy" ON quality_chat_messages;

CREATE POLICY "quality_chat_select_policy" ON quality_chat_messages
  FOR SELECT USING (true);

CREATE POLICY "quality_chat_insert_policy" ON quality_chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "quality_chat_update_policy" ON quality_chat_messages
  FOR UPDATE USING (true);

CREATE POLICY "quality_chat_delete_policy" ON quality_chat_messages
  FOR DELETE USING (true);

-- ============================================================
-- 16. POLITICAS PARA WORD_CLOUD
-- ============================================================
DROP POLICY IF EXISTS "word_cloud_select_policy" ON word_cloud;
DROP POLICY IF EXISTS "word_cloud_insert_policy" ON word_cloud;
DROP POLICY IF EXISTS "word_cloud_update_policy" ON word_cloud;
DROP POLICY IF EXISTS "word_cloud_delete_policy" ON word_cloud;

CREATE POLICY "word_cloud_select_policy" ON word_cloud
  FOR SELECT USING (true);

CREATE POLICY "word_cloud_insert_policy" ON word_cloud
  FOR INSERT WITH CHECK (true);

CREATE POLICY "word_cloud_update_policy" ON word_cloud
  FOR UPDATE USING (true);

CREATE POLICY "word_cloud_delete_policy" ON word_cloud
  FOR DELETE USING (true);

-- ============================================================
-- FIM DO SCRIPT DE RLS
-- ============================================================
