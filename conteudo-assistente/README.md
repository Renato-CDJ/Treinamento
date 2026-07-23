# Conteúdo do Assistente do Roteiro

Coloque nesta pasta os documentos com informações adicionais que o
**Assistente do Roteiro** poderá consultar para responder às perguntas do
operador.

## Como usar

1. Adicione seus arquivos diretamente dentro desta pasta (`conteudo-assistente/`).
2. Formatos suportados:
   - `.docx` (Word) — recomendado
   - `.md` (Markdown)
   - `.txt` (texto simples)
3. Salve / faça o commit. O assistente passa a consultar o conteúdo
   automaticamente na próxima vez que for aberto.

## Atenção: documentos do Google Docs com "Guias no documento"

As **Guias no documento** (abas laterais) são um recurso exclusivo do Google
Docs. Ao usar **Arquivo → Baixar → Word (.docx)**, o Google exporta **apenas a
guia que está aberta** — as demais guias ficam de fora do arquivo.

Para o assistente enxergar todas as guias, use uma das opções:

- **Opção A (um único arquivo):** crie um documento **sem guias**, cole o
  conteúdo de todas as guias em sequência e aplique o estilo **"Título 1"** ao
  nome de cada guia. Baixe como `.docx`. Cada guia vira uma seção pesquisável.
- **Opção B (um arquivo por guia):** abra cada guia, copie o conteúdo, cole em
  um documento novo e baixe como `.docx`. Coloque todos os arquivos nesta pasta.

> O leitor também reconhece **assuntos em negrito** como início de seção, então
> funciona mesmo que você não aplique os estilos de título.

## Dicas para respostas melhores

- **Use títulos** no documento (Título 1, Título 2 no Word, ou `#`, `##` no
  Markdown). Cada título vira uma "seção" pesquisável, então o assistente
  consegue devolver a resposta certa em vez do documento inteiro.
- Escreva um título curto e descritivo para cada assunto
  (ex.: "Cliente desempregado", "Prazo para pagamento", "Cliente falecido").
- Mantenha os parágrafos objetivos — o texto abaixo de cada título é o que o
  operador vai ler como resposta.
- Pode adicionar quantos arquivos quiser. Todos são lidos e combinados.

## Observações

- Arquivos temporários do Word (começam com `~$`) são ignorados.
- Este `README.md` não é indexado pelo assistente.
