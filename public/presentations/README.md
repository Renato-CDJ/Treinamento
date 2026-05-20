# Pasta de Apresentações

Esta pasta é destinada ao armazenamento de arquivos de apresentação PowerPoint (PPT/PPTX) que serão automaticamente disponibilizados na aba de Treinamentos para todos os operadores.

## Como funciona:

1. Coloque seus arquivos `.ppt` ou `.pptx` nesta pasta
2. Os arquivos aparecerão automaticamente na aba "Treinamentos" para todos os operadores
3. Os operadores poderão baixar e visualizar as apresentações

## Estrutura recomendada:

```
public/presentations/
├── treinamento-produto-habitacional.pptx
├── treinamento-produto-comercial.pptx
├── treinamento-vendas.pptx
└── onboarding-novos-operadores.pptx
```

## Observações:

- Tamanho máximo recomendado: 10MB por arquivo
- Formatos suportados: .ppt, .pptx
- Use nomes descritivos para facilitar a identificação
- Os arquivos são listados automaticamente via API
- Qualquer arquivo PPT/PPTX adicionado aqui fica imediatamente disponível para todos os operadores

## Importante:

- Não delete o arquivo `.gitkeep` desta pasta
- Após adicionar um arquivo, faça o deploy para que ele fique disponível no ambiente de produção
