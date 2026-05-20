-- ============================================================
-- REPIR - ROTEIRO CALL CENTER
-- SETUP COMPLETO DO BANCO DE DADOS
-- 
-- Copie e cole este script INTEIRO no SQL Editor do Supabase
-- Versao: 5.1 - Adicionada Nuvem de Palavras
-- Data: 2025
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABELA DE USUARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) DEFAULT '',
  role VARCHAR(50) NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'supervisor')),
  admin_type VARCHAR(50) CHECK (admin_type IN ('master', 'monitoria', 'supervisao')),
  allowed_tabs TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  avatar_url TEXT,
  last_activity TIMESTAMPTZ,
  current_product TEXT,
  current_screen TEXT,
  last_script_access TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para busca
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- 2. TABELA DE PRODUTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  price NUMERIC DEFAULT 0,
  details JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TABELA DE ROTEIROS/SCRIPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  category TEXT DEFAULT '',
  product_id TEXT,
  product_name TEXT,
  step_order INTEGER DEFAULT 0,
  buttons JSONB DEFAULT '[]',
  tabulations JSONB DEFAULT '[]',
  alert JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. TABELA DE TABULACOES
-- ============================================================
CREATE TABLE IF NOT EXISTS tabulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#6b7280',
  category TEXT DEFAULT 'before' CHECK (category IN ('before', 'after')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. TABELA DE SITUACOES
-- ============================================================
CREATE TABLE IF NOT EXISTS situations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. TABELA DE CANAIS
-- ============================================================
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'phone',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. TABELA DE CODIGOS DE RESULTADO
-- ============================================================
CREATE TABLE IF NOT EXISTS result_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. TABELA DE GUIA INICIAL
-- ============================================================
CREATE TABLE IF NOT EXISTS initial_guide (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  step_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. TABELA DE FRASEOLOGIA
-- ============================================================
CREATE TABLE IF NOT EXISTS phraseology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  category TEXT DEFAULT '',
  shortcut TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. TABELA DE CONFIGURACOES
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. TABELA DE MENSAGENS (RECADOS DO ADMIN)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  priority TEXT DEFAULT 'normal',
  author_id TEXT,
  author_name TEXT,
  recipients TEXT[] DEFAULT '{}',
  send_to_all BOOLEAN DEFAULT true,
  seen_by TEXT[] DEFAULT '{}',
  segments JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. TABELA DE TENTATIVAS DE QUIZ
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID,
  post_id UUID,
  user_id TEXT NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. TABELA DE FEEDBACKS
-- ============================================================
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT,
  message TEXT,
  type TEXT DEFAULT 'positive',
  sender_id TEXT,
  sender_name TEXT,
  recipient_id TEXT,
  recipient_name TEXT,
  operator_id UUID,
  operator_name TEXT,
  status TEXT DEFAULT 'pending',
  score INTEGER DEFAULT 0,
  is_read BOOLEAN DEFAULT false,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. TABELA DE POSTS DA CENTRAL DE QUALIDADE
-- ============================================================
CREATE TABLE IF NOT EXISTS quality_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('comunicado', 'quiz', 'recado', 'pergunta', 'feedback', 'aviso', 'procedimento', 'dica')),
  content TEXT NOT NULL,
  author_id TEXT,
  author_name VARCHAR(255) NOT NULL,
  quiz_options JSONB,
  correct_option INTEGER,
  likes TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  recipients TEXT[] DEFAULT '{}',
  recipient_names TEXT[] DEFAULT '{}',
  send_to_all BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. TABELA DE COMENTARIOS DA CENTRAL DE QUALIDADE
-- ============================================================
CREATE TABLE IF NOT EXISTS quality_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES quality_posts(id) ON DELETE CASCADE,
  author_id TEXT,
  author_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. TABELA DE PERGUNTAS PARA ADMIN
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT,
  reply TEXT,
  replied_by TEXT,
  replied_by_name TEXT,
  replied_at TIMESTAMPTZ,
  second_reply TEXT,
  second_replied_at TIMESTAMPTZ,
  reply_count INTEGER DEFAULT 0,
  understood BOOLEAN,
  needs_in_person_feedback BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 17. TABELA DE MENSAGENS DE CHAT
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_name TEXT,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  is_global BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 18. TABELA DE CHAT COM SUPERVISORES
-- ============================================================
CREATE TABLE IF NOT EXISTS supervisor_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  reply_to_id UUID,
  reply_to_sender_name TEXT,
  reply_to_content TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 19. TABELA DE CHAT COM QUALIDADE
-- ============================================================
CREATE TABLE IF NOT EXISTS quality_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  reply_to_id UUID,
  reply_to_sender_name TEXT,
  reply_to_content TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 20. TABELA DE TREINAMENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  content TEXT DEFAULT '',
  video_url TEXT,
  category TEXT DEFAULT '',
  thumbnail_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 21. TABELA DE VISUALIZACOES DE TREINAMENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS training_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID REFERENCES trainings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  progress_percent INTEGER DEFAULT 0,
  UNIQUE(training_id, user_id)
);

-- ============================================================
-- 22. TABELA DE CAMPANHAS
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  how_it_works TEXT DEFAULT '',
  positive_case TEXT DEFAULT '',
  negative_case TEXT DEFAULT '',
  delay_range TEXT DEFAULT '',
  complement TEXT DEFAULT '',
  system_site TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para busca por nome
CREATE INDEX IF NOT EXISTS idx_campaigns_name ON campaigns(name);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(is_active);

-- ============================================================
-- 23. TABELA DE NUVEM DE PALAVRAS
-- ============================================================
CREATE TABLE IF NOT EXISTS word_cloud (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para busca
CREATE INDEX IF NOT EXISTS idx_word_cloud_word ON word_cloud(word);
CREATE INDEX IF NOT EXISTS idx_word_cloud_active ON word_cloud(is_active);

-- ============================================================
-- INDICES ADICIONAIS PARA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_quality_posts_type ON quality_posts(type);
CREATE INDEX IF NOT EXISTS idx_quality_posts_author ON quality_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_quality_posts_created ON quality_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_questions_author ON admin_questions(author_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_recipient ON feedbacks(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient ON chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_chat_sender ON supervisor_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_quality_chat_sender ON quality_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_trainings_category ON trainings(category);
CREATE INDEX IF NOT EXISTS idx_training_views_user ON training_views(user_id);

-- ============================================================
-- INSERIR USUARIOS ADMINISTRADORES
-- ============================================================

-- Admin Master (Acesso Total)
INSERT INTO users (username, name, email, password, role, admin_type, is_active)
VALUES ('admin', 'Administrador Master', 'admin@gruporoveri.com', 'rcp@$', 'admin', 'master', true)
ON CONFLICT (email) DO NOTHING;

-- Admin Monitoria (Equipe de Qualidade)
INSERT INTO users (username, name, email, password, role, admin_type, is_active)
VALUES ('monitoria', 'Equipe Monitoria', 'monitoria@gruporoveri.com', 'm1234@$.', 'admin', 'monitoria', true)
ON CONFLICT (email) DO NOTHING;

-- Admin Supervisao
INSERT INTO users (username, name, email, password, role, admin_type, is_active)
VALUES ('supervisao', 'Equipe Supervisao', 'supervisao@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- INSERIR USUARIOS DE MONITORIA (monitoria1 a monitoria10)
-- ============================================================
INSERT INTO users (username, name, email, password, role, admin_type, is_active) VALUES
('monitoria1', 'VALDINETE LEMOS', 'monitoria1@gruporoveri.com', 'm1234@$.', 'admin', 'monitoria', true),
('monitoria2', 'BRENO LUCAS', 'monitoria2@gruporoveri.com', 'm1234@$.', 'admin', 'monitoria', true),
('monitoria3', 'NAELLY DA SILVA', 'monitoria3@gruporoveri.com', 'm1234@$.', 'admin', 'monitoria', true),
('monitoria4', 'LARISSA RODRIGUES', 'monitoria4@gruporoveri.com', 'm1234@$.', 'admin', 'monitoria', true),
('monitoria5', 'DIEGO BACCON', 'monitoria5@gruporoveri.com', 'm1234@$.', 'admin', 'monitoria', true),
('monitoria6', 'SOPHIA DE JESUS', 'monitoria6@gruporoveri.com', 'm1234@$.', 'admin', 'monitoria', true),
('monitoria7', 'ANA CLARA FIORENTINI', 'monitoria7@gruporoveri.com', 'm1234@$.', 'admin', 'monitoria', true),
('monitoria8', 'FELIPE NAKAMURA', 'monitoria8@gruporoveri.com', 'm1234@$.', 'admin', 'monitoria', true),
('monitoria9', 'LETICIA PAIS', 'monitoria9@gruporoveri.com', 'm1234@$.', 'admin', 'monitoria', true),
('monitoria10', 'GABRIELLY PAPINI', 'monitoria10@gruporoveri.com', 'm1234@$.', 'admin', 'monitoria', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- INSERIR USUARIOS DE SUPERVISAO (supervisor1 a supervisor25)
-- ============================================================
INSERT INTO users (username, name, email, password, role, admin_type, is_active) VALUES
('supervisor1', 'Supervisor 1', 'supervisor1@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor2', 'Supervisor 2', 'supervisor2@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor3', 'Supervisor 3', 'supervisor3@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor4', 'Supervisor 4', 'supervisor4@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor5', 'Supervisor 5', 'supervisor5@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor6', 'Supervisor 6', 'supervisor6@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor7', 'Supervisor 7', 'supervisor7@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor8', 'Supervisor 8', 'supervisor8@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor9', 'Supervisor 9', 'supervisor9@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor10', 'Supervisor 10', 'supervisor10@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor11', 'Supervisor 11', 'supervisor11@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor12', 'Supervisor 12', 'supervisor12@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor13', 'Supervisor 13', 'supervisor13@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor14', 'Supervisor 14', 'supervisor14@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor15', 'Supervisor 15', 'supervisor15@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor16', 'Supervisor 16', 'supervisor16@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor17', 'Supervisor 17', 'supervisor17@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor18', 'Supervisor 18', 'supervisor18@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor19', 'Supervisor 19', 'supervisor19@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor20', 'Supervisor 20', 'supervisor20@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor21', 'Supervisor 21', 'supervisor21@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor22', 'Supervisor 22', 'supervisor22@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor23', 'Supervisor 23', 'supervisor23@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor24', 'Supervisor 24', 'supervisor24@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true),
('supervisor25', 'Supervisor 25', 'supervisor25@gruporoveri.com', 's1234@$.', 'admin', 'supervisao', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- INSERIR DADOS INICIAIS - CANAIS DE ATENDIMENTO CAIXA
-- ============================================================
INSERT INTO channels (name, description, icon, is_active) VALUES
('Alô CAIXA', '4004 0 104 (Capitais) / 0800 104 0 104 (Demais regioes) - PF, PJ, Ente Publico - Conta corrente, poupanca, emprestimos, cartao, habitacao, negocios, loterias', 'phone', true),
('CAIXA Cidadão', '0800 726 0207 - PIS, Beneficios Sociais, FGTS e Cartao Social - Eletronico 24h / Humano seg-sex 8h-21h, sab 10h-16h', 'phone', true),
('Agencia Digital', '4004 0 104 (Capitais) / 0800 104 0 104 (Demais) - Servicos e consultoria financeira - 8h as 18h (exceto fds e feriados)', 'building', true),
('Atendimento Surdos', 'Atendimento 24h com Interprete de Libras via ICOM - https://icom.app/8AG8Z - www.caixa.gov.br/libras', 'ear', true),
('SAC CAIXA', '0800 726 0101 - Reclamacoes, sugestoes, elogios, cancelamentos - Atendimento 24h', 'headphones', true),
('Ouvidoria CAIXA', '0800 725 7474 - Reclamacoes nao solucionadas - Dias uteis 9h as 18h', 'message-circle', true),
('Canal de Denuncias', '0800 721 0738 - Fatos irregulares contra CAIXA - 24h - https://www.caixa.gov.br/denuncia', 'alert-triangle', true),
('WhatsApp CAIXA', '0800 101 0104 - Negociacao de dividas via www.caixa.gov.br/negociar', 'message-circle', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- INSERIR DADOS INICIAIS - SITUACOES
-- ============================================================
INSERT INTO situations (name, description, color, is_active) VALUES
('EM CASOS DE FALÊNCIA/CONCORDATA', 'É necessário que o sócio ou responsável entre em contato com a CAIXA acessando www.caixa.gov.br/negociar e pelo WhatsApp 0800 101 0104. Tabulação correta: Recado com terceiro', '#ef4444', true),
('FALECIDO', 'Pessoa informa que o titular faleceu. É necessário que compareça à agência levando a certidão de óbito para que as ligações de cobrança sejam interrompidas. Tabulação correta: FALECIDO', '#1f2937', true),
('SE O CLIENTE CITAR A LGPD OU PERGUNTAR POR QUE TEMOS OS SEUS DADOS', 'Seguindo a lei LGPD, n°13.709, possuímos alguns dados representando a CAIXA ECONÔMICA FEDERAL, para garantir sua segurança. Caso você possua qualquer dúvida ou solicitação em relação a isso, pedimos que entre em contato conosco enviando um e-mail para: dpo@gruporoveri.com.br .', '#8b5cf6', true),
('O CLIENTE SOLICITA O PROTOCOLO DA LIGAÇÃO', 'Informar que nós somos uma central de negócios, ou seja, nosso atendimento não possui caráter de SAC. Entretanto, como mencionamos no início do contato, todas as ligações são gravadas e para que você tenha acesso a elas é necessário que as solicite na sua agência de relacionamento. PORQUE NÃO PODEMOS REPASSAR ESSA INFORMAÇÃO PARA O CLIENTE? Nossa assessoria não é SAC.', '#f59e0b', true),
('SE O CLIENTE INFORMAR QUE "NÃO RESIDE NO IMÓVEL"', 'Embora o senhor(a) não resida no local, a dívida está registrada em seu nome e CPF, o que o(a) mantém como responsável pela regularização. Para resolver essa situação de forma rápida e eficiente, sugerimos que entre em contato com a pessoa que realiza o pagamento dessa dívida. Isso pode ajudar a esclarecer se o pagamento já foi efetuado, se há uma data prevista para a quitação ou outras informações relevantes.', '#06b6d4', true),
('CLIENTE SOLICITOU A LIGAÇÃO DO ATENDIMENTO', 'Cliente solicita escuta da ligacao. PR/RJ/SP/MT: 7 dias uteis. Outros estados: solicitar na agencia', '#3b82f6', true),
('CLIENTE FIES QUER PAUSAR O PAGAMENTO DAS SUAS PARCELAS', 'Caso o cliente do FIES questione a possibilidade de renegociar ou solicite o desconto para seu contrato, informar: "Você pode verificar se o seu contrato tem a possibilidade de realizar renegociação no site http://sifesweb.caixa.gov.br, APP FIES CAIXA ou na sua agência." ATENÇÃO! Lembrando que essa orientação só deve ser repassada para aqueles clientes que já fizeram a confirmação positiva.', '#22c55e', true),
('CONTRATOS DE EMPRÉSTIMO CONSIGNADO', 'Devemos orientar o cliente pedindo para que ele verifique novamente se o valor foi de fato descontado da folha de pagamento. Caso ele fale que vai aguardar em linha este retorno. Se o cliente disser que não pode fazer essa verificação durante o atendimento, podemos solicitar o melhor horário e telefone para realizar um contato futuro. QUESTIONAMENTO NORMALMENTE REALIZADO PELO CLIENTE: "Isso é descontado na minha folha de pagamento, não está aparecendo no sistema?"', '#f97316', true),
('NÃO RECONHECE A DÍVIDA', 'Orientar o cliente a procurar uma agência da CAIXA para mais informações ou ligar no 0800 101 0104. Para cartão de crédito, indicar a central de atendimento que está no verso do cartão para contestação das despesas.', '#dc2626', true),
('O QUE FAZER QUANDO CAIR UM PRODUTO QUE NÃO ATENDO?', 'Passo a passo. Confirmar IP, informar transferencia, transferir em Campanha Receptivo, tabular Transferencia de Ligacao', '#64748b', true),
('O QUE FAZER QUANDO CAIR ATENDIMENTO CNPJ?', 'Atendimento PJ. Falar nome do socio ou solicitar socio/responsavel financeiro. Verificar em Detalhes do Cliente', '#0ea5e9', true),
('EM CASOS DE SINEB 2.0', 'Oferta de renegociacao. Exclusao CPF em 10 dias uteis apos pagamento. Juros corrigidos diariamente. Condicoes nao garantidas', '#7c3aed', true),
('A LEI 12395/2024 DO ESTADO DE MATO GROSSO E A LEI 16276/2025 DO RIO GRANDE DO SUL', 'A Lei 12395/2024 do Estado do Mato Grosso e a Lei 16276/2025 do Rio Grande Sul também determinam que deve ser informado a composição dos valores cobrados quanto a o que efetivamente correspondem, destacando-se o valor originário e seus adicionais (juros, multas, taxas, custas, honorários e outros que, somados, correspondam ao valor total cobrado do consumidor) ao cliente desse estado que solicitar.', '#10b981', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- INSERIR DADOS INICIAIS - TABULACOES (CODIGO DE RESULTADO)
-- ============================================================

-- TABULACOES ANTES DA IP (Identificacao Positiva)
INSERT INTO tabulations (name, description, color, is_active) VALUES
('LIGAÇÃO CAIU', 'Atendimento interrompido sem que seja possível continuar o diálogo entre operador e cliente e sem possibilidade de realização da confirmação do CPF. Exemplo de resposta por parte do cliente/terceiro: "Alô" / "Quem é" / "De onde fala" / "Sou eu" / "Do que se trata" / etc.', '#ef4444', true),
('LIGAÇÃO MUDA', 'Utilizar se a ligação se iniciou muda, fica sem fala do cliente. Lembrando que se a pessoa atender e houver ruídos ou vozes que não se direcionar a você será considerada uma Ligação muda.', '#6b7280', true),
('RECADO COM TERCEIRO', 'Terceiro atende e informa que a empresa entrou em falência ou terceiro informa que conhece o cliente, ou terceiro pede para ligar outro dia/horário ou em outro telefone.', '#2563eb', true),
('FALECIDO', 'Terceiro informa que o titular faleceu', '#2563eb', true),
('DESCONHECIDO NO TELEFONE', 'Terceiro informa que não conhece ninguém com o nome do cliente no telefone do cadastro. Exemplo de resposta por parte do cliente/terceiro: "Não conheço" / "Não é desse número" / "Não é daqui" / "Nunca ouvi falar" / etc.', '#2563eb', true),
('PESSOA NÃO CONFIRMA DADOS', 'Cliente se recusa confirmar os dados para prosseguir com atendimento. Utilize quando: O cliente informa CPF/CNPJ, mas os dados não conferem, o cliente se recusa a informar CPF/CNPJ, o cliente não lembra os dados ou quando o cliente diz que não pode falar no momento. Exemplo de resposta por parte do cliente: "Não confirmo nada por telefone" / "Não, eu vou na agência" / "Não lembro meu CPF" / etc.', '#2563eb', true),
('FALÊNCIA/CONCORDATA', 'Utilizamos quando o sócio ou responsável financeiro informar que a empresa entrou em falência.', '#2563eb', true),
('SINAL DE FAX', 'Ligação direcionada para sinal de FAX', '#8b5cf6', true),
('GRAVAÇÃO DE OPERADORA', 'Mensagem automática da companhia telefônica foi reproduzida na chamada', '#8b5cf6', true),
('TRANSBORDO PARA ATENDIMENTO ENTRE CANAIS, SEM IP', 'Quando o atendimento é iniciado em um canal digital e precisa ser transbordado para resolução no atendimento humano antes do cliente ter realizado a confirmação do CPF.', '#2563eb', true),
('CAIXA POSTAL', 'Ligação direcionada diretamente a caixa postal', '#a855f7', true)
ON CONFLICT DO NOTHING;

-- TABULACOES APOS A IP (Identificacao Positiva)
INSERT INTO tabulations (name, description, color, is_active) VALUES
('CONTATO INTERROMPIDO APÓS IP, MAS SEM RESULTADO DEFINIDO', 'A ligação foi interrompida sem conseguir um posicionamento da parte do cliente sobre a dívida. Situação: Ao questionar se foi pago, o cliente responde apenas com um NÂO e desliga.', '#22c55e', true),
('PESSOA SOLICITA RETORNO EM OUTRO MOMENTO', 'Cliente pede para o operador retornar a ligação em outro dia/horário.', '#22c55e', true),
('PAGAMENTO JÁ EFETUADO', 'Cliente informa que ja efetuou o pagamento', '#22c55e', true),
('PROMESSA DE PAGAMENTO SEM EMISSÃO DE BOLETO', 'Cliente informa que ira pagar/depositar dentro de 10 dias corridos', '#10b981', true),
('CONTATO SEM NEGOCIAÇÃO', 'Cliente informa que não consegue falar no momento e desliga, ou cliente informa que irá pagar ou depositar FORA do prazo estabelecido [10 dias corridos].', '#22c55e', true),
('SEM CAPACIDADE DE PAGAMENTO', 'Cliente informa que não possui capacidade de efetuar o pagamento. Exemplo dos motivos: Informa que não tem recurso disponível, desemprego, mudanças econômicas ou não pode fazer o pagamento naquele momento.', '#22c55e', true),
('DÍVIDA NÃO RECONHECIDA', 'Cliente alega que desconhece a dívida.', '#22c55e', true),
('NEGOCIAÇÃO EM OUTRO CANAL', 'Cliente informa que já está negociando em outro canal.', '#22c55e', true),
('PROMESSA DE PAGAMENTO COM EMISSÃO DE BOLETO', 'Cliente solicita boleto e informa data de pagamento dentro do período permitido [10 dias corridos].', '#22c55e', true),
('ACEITA AÇÃO/CAMPANHA SEM EMISSÃO DE BOLETO', 'Cliente aceita a campanha sem emissao de boleto', '#22c55e', true),
('ACEITA AÇÃO/CAMPANHA COM EMISSÃO DE BOLETO', 'Cliente aceita a campanha com emissao de boleto', '#22c55e', true),
('CLIENTE COM ACORDO ATIVO RETORNA NO RECEPTIVO', 'Quando o cliente retorna no receptivo tendo acordo vigente para solicitar esclarecimentos ou solicitar o boleto.', '#22c55e', true),
('PROMESSA DE PAGAMENTO ACORDO DE PARCELAMENTO', 'Cliente confirma o pagamento parcelado do CARTÃO DE CRÉDITO.', '#22c55e', true),
('TRANSBORDO PARA ATENDIMENTO ENTRE CANAIS, COM IP', 'Quando o atendimento é iniciado em um canal e precisa ser transbordado para resolução por outro canal após o cliente ter realizado a confirmação do CPF.', '#22c55e', true),
('RECUSA AÇÃO/CAMPANHA + RESULTADO COM MOTIVO DA RECUSA', 'Cliente não aceita a campanha ofertada. Motivos da Recusa: Sem capacidade de pagamento | Contato sem negociacao/acordo | Negociacao em outro canal | Pessoa solicita retorno em outro momento | Divida nao reconhecida | Promessa de pagamento sem emissao de boleto | Promessa de pagamento com emissao de boleto', '#22c55e', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT DE SETUP
-- ============================================================
-- 
-- PROXIMOS PASSOS:
-- 1. Execute o script RLS_POLICIES.sql para habilitar Row Level Security
-- 2. Execute o script seed-operators.sql para adicionar operadores (opcional)
-- 
-- CREDENCIAIS DOS USUARIOS:
-- 
-- Admin Master:
--   Email: admin@gruporoveri.com
--   Senha: rcp@$
-- 
-- Monitoria (monitoria, monitoria1 a monitoria10):
--   Email: monitoria@gruporoveri.com (ou monitoriaX@gruporoveri.com)
--   Senha: m1234@$.
-- 
-- Supervisao (supervisao, supervisor1 a supervisor25):
--   Email: supervisao@gruporoveri.com (ou supervisorX@gruporoveri.com)
--   Senha: s1234@$.
-- 
-- ============================================================
