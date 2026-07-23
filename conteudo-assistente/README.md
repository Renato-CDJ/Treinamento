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
