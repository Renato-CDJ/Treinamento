import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://wtkznrdtkwyqcvozzsky.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0a3pucmR0a3d5cWN2b3p6c2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NDI2MjcsImV4cCI6MjA5NDAxODYyN30.6W2i2MYGj0nKYo86okyrt1dkCSv_Gtla281yVtO9XLs"

const supabase = createClient(supabaseUrl, supabaseKey)

async function createCampaignsTable() {
  console.log("Verificando se a tabela campaigns existe...")

  // Tentar inserir um registro de teste para ver se a tabela existe
  const { error: checkError } = await supabase.from("campaigns").select("id").limit(1)

  if (checkError && checkError.code === "42P01") {
    console.log("Tabela campaigns não existe. Por favor, crie a tabela no Supabase Dashboard com o seguinte SQL:")
    console.log(`
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  how_it_works TEXT,
  positive_case TEXT,
  negative_case TEXT,
  delay_range TEXT,
  complement TEXT,
  system_site TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para todos
CREATE POLICY "Allow read access for all users" ON campaigns
  FOR SELECT USING (true);

-- Política para permitir todas as operações para usuários autenticados
CREATE POLICY "Allow all operations for authenticated users" ON campaigns
  FOR ALL USING (true);
    `)
    return
  }

  if (checkError) {
    console.log("Erro ao verificar tabela:", checkError.message)
    return
  }

  console.log("Tabela campaigns já existe!")

  // Inserir dados de exemplo
  const sampleCampaigns = [
    {
      name: "SINEB - 224,225 e 226",
      how_it_works:
        "Ofertar a campanha informando os dados apresentados no SINEB (valor total para pagamento à vista de todos os contratos, tipo de cada um deles (cheque especial, CDC etc));\n\nCaso o cliente não possa pagar todos os contratos, desmarcar os contratos que não serão gerados boletos e informar o novo valor para pagamento.\n\nNão informar os valores descritos como desconto no SINEB (Desc. à vista ou Desc. à prazo);\n\nReforçar que o pagamento com o desconto irá quitar todas as dívidas descritas no boleto.\n\nSe o cliente recusar o pagamento, ofertar o boleto para análise (o boleto enviado deverá ser de no máximo 10 dias úteis)\n\nDevemos informar que devido ao desconto, não será possível obter novos créditos na CAIXA pelo período de 5 anos.\n\nCaso o cliente queira continuar o relacionamento com a CAIXA deve ser pago o valor descrito como \"à prazo\" e será necessário acessar o site Negociar Dívidas.",
      positive_case:
        "Registrar: Aceita Ação/Campanha com emissão de boleto;\n\nAtualizar e-mail e telefone celular do cliente;\n\nCaso o cliente não possua e-mail, ofereça o envio do boleto pelo WhatsApp.",
      negative_case:
        "Informar que a proposta é por tempo limitado e que pode ser verificada no site da CAIXA www.caixa.gov.br/negociar clicando em \"Negociar agora\" ou pelo Whatsapp 0800 104 0104;\n\nRegistrar: Recusa Ação/Campanha;\n\nInformar que as ações de cobrança terá continuidade.",
      delay_range: "Atraso a partir de 361 dias",
      complement: "Comercial",
      system_site: "SINEB",
      is_active: true,
    },
    {
      name: "SIATC - 224,225 e 226",
      how_it_works:
        "Ofertar a campanha informando os dados apresentados no SIATC (valor total para pagamento à vista de todos os contratos);\n\nCaso o cliente possua mais de um cartão, informar os dados apresentados por conta, haja vista que o sistema não permite a aglutinação de contratos, ou seja, deve ser feito um acordo para cada cartão;\n\nSe o cliente recusar o pagamento, ofertar o boleto para análise (o boleto enviado deverá ser de no máximo 10 dias úteis)\n\nOs cartões sem a marca devem ser abordados como de costume.\n\nDevemos informar que devido ao desconto, não será possível obter novos créditos na CAIXA pelo período de 3 anos.",
      positive_case:
        "Registrar: Aceita Ação/Campanha com emissão de boleto;\n\nAtualizar e-mail e telefone celular do cliente;\n\nCaso o cliente não possua e-mail, ofereça o envio do boleto pelo WhatsApp.\n\nCaso o boleto apresente algum erro/divergência: Informar no campo de comentários: Boleto Indisponível, seguir com fraseologia de boleto indisponível e tabular: Promessa de pagamento;",
      negative_case:
        "Informar que a proposta é por tempo limitado e que pode ser verificada no site da CAIXA www.caixa.gov.br/negociar clicando em \"Negociar agora\" ou pelo Whatsapp 0800 104 0104;\n\nRegistrar: Recusa Ação/Campanha;\n\nInformar que as ações de cobrança terá continuidade.",
      delay_range: "Atraso a partir de 361 dias",
      complement: "Cartão de crédito",
      system_site: "SIATC",
      is_active: true,
    },
  ]

  console.log("Inserindo campanhas de exemplo...")

  const { data, error } = await supabase.from("campaigns").insert(sampleCampaigns).select()

  if (error) {
    console.log("Erro ao inserir campanhas:", error.message)
  } else {
    console.log("Campanhas inseridas com sucesso:", data.length)
  }
}

createCampaignsTable()
