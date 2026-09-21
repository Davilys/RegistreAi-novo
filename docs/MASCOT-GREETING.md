# Reg: cumprimento discreto no piloto

Decisão do responsável em 21/09/2026: preservar a página aprovada; implementar primeiro somente piscar + aceno curto de 1 segundo. Seta animada, digitação no celular e corte adicional de 10–15% ficam para uma decisão posterior ao piloto, com dados. Esta decisão substitui a sugestão anterior de conversa em loop; não há animação contínua nesta entrega.

## Escopo implementado
- Apenas o mascote principal ao lado do celular recebe greetOnEntry. Logotipo, avatares, seta, conversa e CTAs não animam.
- Um piscar do olho aberto e um aceno discreto do braço (de -7° a +4°, sem mover o corpo), simultâneos em uma sequência finita de 1000 ms.
- Começa quando pelo menos 60% do mascote está no viewport e o documento está visível. Não inicia escondido abaixo da dobra ou em documento oculto.
- Executa uma vez por carregamento da página. Rolar, redimensionar, passar o mouse e navegar entre rotas internas não repetem a saudação. Recarregar a página permite uma nova saudação.
- Movimento reduzido impede a animação. Se ativado durante a execução, interrompe o efeito e restaura a pose original. Ocultar a aba durante a execução também interrompe, sem retomada.
- Estado de execução somente em memória. Sem cookies, localStorage, sessionStorage, pixels ou eventos de analytics; esta alteração NÃO instala medição de rolagem nem inicia piloto/campanha.
- APIs nativas, sem dependências novas. Só transformações internas do SVG; dimensões, textos, valores, CTAs, política, termos e CSS do layout preservados.
- Interseção, listeners e animações são liberados ao terminar ou desmontar. Falta de suporte/falha de API mantém a figura estática e os CTAs disponíveis.

## Validação exigida
Manter a suíte anterior (81 testes), acrescentando ensaios de interseção, execução única, duração finita, cancelamento, acessibilidade, API indisponível e falha parcial. Renderizar quadros reais em 390 e 1440 px, incluindo o ápice do piscar (190 ms) e aceno (350/650 ms). Conferir pose final idêntica à inicial, braço dentro do SVG, dimensões da página invariantes e ausência de animações remanescentes. A simulação de Page Visibility testa a lógica da API; não equivale a um teste físico de troca de aba em um telefone.

Não afirmar implantação no domínio apenas por merge ou CI aprovado. Publicar somente o serviço web, preservando Caddy/HTTPS, .env e volumes; não iniciar worker ou cobrança. Pendências de segurança/integrações anteriores continuam separadas deste refinamento.

Referências técnicas: https://developer.mozilla.org/en-US/docs/Web/API/Element/animate ; https://developer.mozilla.org/en-US/docs/Web/API/Animation/cancel ; https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/disconnect ; https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion ; https://react.dev/reference/react/useEffect .
