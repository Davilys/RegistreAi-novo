# Site público: revisão visual de 30/09/2026

Base: main 4192c306478ba385115c4bf317c6d6d08de217d0.
Branch isolada: feat/marketing-mobile-quality-20260930.

Escopo: landing pública e seus testes. Não incorpora PRs #6/#8/#9, backend, worker, CRM, admin ou cobrança. O footer recebe uma opção para omitir o CTA apenas na landing; páginas legais mantêm o comportamento original. Valores e company.ts não alterados.

Mudanças: header de uma linha, menu mobile, hero alinhado à esquerda, conversa frontal com três mensagens e expansão, ressalvas sempre visíveis, identidade integrada, comparação pareada, sequência mobile vertical, planos neutros com valores/limites visíveis e detalhes acessíveis, FAQ menor e uma ação final sem CTA no footer.

Validação local: build/check da aplicação; check/build do worker sem alteração; 69 testes Playwright nos três motores. Matriz de 16 larguras, FAQ/menu/conversa/planos, teclado, reduced-motion, fonte alternativa e texto a 200%. Registre o resultado da rodada final depois de qualquer ajuste adicional. Prints locais não são prova de publicação.

Publicação: pendente de confirmação explícita e de validação do acesso ao VPS. O script deploy/hostinger/deploy.sh não serve para este escopo, pois pode reconstruir/reativar o worker.

Rollback preparado: usar o commit base acima somente para os arquivos de marketing, ou reverter o commit desta branch. Na VPS, identificar primeiro o serviço web real e guardar cópia da imagem, artefatos e configuração atual. Não executar git reset hard no checkout ativo nem reiniciar caddy/worker. Registrar o caminho exato do backup e o comando específico do serviço confirmado antes de publicar.

## Publicação confirmada

Em 30/09/2026, após confirmação explícita do dono em resposta à pergunta de publicação e o pedido de animação lenta do logo. Somente serviço web recriado; Caddy, admin e demais serviços conservaram uptime anterior.

Fonte local revisada: 767f4baa0e4c8102b7f6ab7e803dbccf553697f0.
Clone VPS só-source: /opt/registreai-marketing-20260930, commit 1a15e9c, branch feat/marketing-mobile-quality-20260930. Cinco arquivos de source iguais por SHA-256 ao build local; testes/docs não foram transferidos para esse clone. Checkout ativo /opt/registreai não alterado.
Imagem: registreai-marketing:20260930, ID 60b39075db09fa494dbd1c1a0d5ba50ae1f459bd003f3c0b662dd00cc50dccc9. Tag usada pelo compose: registreai-web:latest.
Backup: /opt/registreai-marketing-backup-20260930, imagem anterior web-image.tar e tag registreai-marketing-rollback:20260930, HTML/assets, inspect, compose e Caddyfile anteriores.
Rollback: bash /opt/registreai-marketing-backup-20260930/rollback-web.sh. Retag da imagem anterior e docker compose up -d --no-deps --no-build --force-recreate web. Não reinicia outros serviços.

Validação pós-publicação: 72/72 Playwright verdes contra https://registreai.com.br/ em Chromium, Firefox e WebKit. Cinco larguras principais sem overflow, sem erros JS, preços preservados. Healthz externo ok e container web saudável. Inspecionar prints ao vivo, não prints locais, para o aceite visual final. GitHub remoto não recebeu push; o build está implantado no VPS com branch isolada lá e bundle local para continuidade.
