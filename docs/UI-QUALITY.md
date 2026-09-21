# Revisão visual — 21/09/2026

## Falha relatada
O texto “Tudo pelo seu WhatsApp” ficava atrás do celular. A legenda tinha posicionamento absoluto, offsets laterais e nenhum espaço próprio no fluxo; o celular possuía transformação e outra camada de empilhamento. Regras responsivas duplicadas também mantinham o hero em duas colunas em larguras pequenas.

## Correção
- CSS consolidado em uma única sequência de regras responsivas.
- Mascote, celular e legenda ocupam áreas independentes de grid. A legenda fica abaixo do celular, com intervalo que considera a rotação.
- Em celular pequeno, a apresentação do mascote ocupa uma linha antes do aparelho; nada é escondido atrás dele.
- Conversa não tem altura máxima fixa que corte mensagens; cresce com o texto.
- Menus continuam disponíveis em telas pequenas e não criam saltos de hash.
- Rota de privacidade/termos começa no topo; navegação na mesma página não é reiniciada.
- Mesma identidade visual nas páginas institucionais e de contrato.
- Preços e selo de plano em fluxo normal; condições e valores preservados.
- WhatsApp não configurado tem estado desativado e aviso explícito. A ilustração é identificada como exemplo, não conversa real.
- “Mais popular” substituído por “Várias marcas”, sem alegar uma preferência de clientes ainda não demonstrada.

## Verificação
Renderização local do componente e CSS revisados passou nas larguras 320, 360, 390, 414, 559, 560, 680, 767, 768, 920, 1024, 1099, 1100, 1280, 1440 e 1920. Foram verificadas ausência de sobreposição e overflow, legenda visível, navegação estável, FAQ por teclado e texto ampliado a 200%.

A verificação local de layout foi feita com Chromium e um harness React disponível no ambiente, sem acesso de rede ao VPS; não substitui o build de produção. As verificações do React/Vite efetivos são executadas no GitHub Actions. Consultar a execução associada ao commit da PR para o resultado, sem assumir aprovação pela existência deste documento.

## Testes reproduzíveis
```sh
npm install --include=optional
npm run check
npm run build
npx playwright install --with-deps chromium firefox webkit
npm run test:ui
```
Executar os testes com `VITE_WHATSAPP_NUMBER` vazio. O workflow `RegistreAi UI Quality` publica relatório e screenshots no artefato `registreai-ui-review`. São verificações de layout e interação, não auditoria completa de acessibilidade nem homologação de WhatsApp, Asaas ou INPI. WebKit automatizado também não equivale a um teste físico em todos os modelos de iPhone.

## Implantação
A mudança no GitHub não atualiza sozinha um VPS que usa deploy manual. Recompilar o serviço `web` depois de atualizar o código. Não ativar `reg-worker` nesta atualização.
