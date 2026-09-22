# RegistreAi — serviço mensal conduzido pela Reg

Registro de decisões do proprietário em 22/09/2026. Separar os requisitos comerciais abaixo dos limites verificados e das definições ainda pendentes. Este documento NÃO implementa cobrança, suspensão, alertas, assinatura, protocolo ou recurso; não é a versão final do Termo de Serviço. O proprietário informou que enviará o PDF para revisão.

## 1. Estado do código e escopo desta alteração
- Base main consultada: 4192c306478ba385115c4bf317c6d6d08de217d0.
- Site src/config/company.ts e Supabase public.plans: Proteção 19700/4900 e Ilimitado 49700/59900 centavos, já corretos.
- O prompt na main ainda contém as antigas adesões 299/999.
- A correção já está preparada no PR #6, feat/meta-cloud-homologation, head consultado 7df092972b21d58e09729e080576765767dbf3ef: packages/product-config/index.js centraliza PRICING com R$197+49 e R$497+599; services/reg-worker/src/prompt.ts usa pricingPromptLines de @registreai/product-config.
- Preservar e revisar a implementação existente do PR #6. Não criar uma segunda fonte de preço no prompt. O PR continua separado da main e não prova implantação no VPS.
- Este PR de decisões foi reduzido a documentação somente: a correção concorrente de prompt e seus testes estáticos foram retirados ao confirmar a centralização já existente. Não há alteração líquida de código executável nem de testes/workflows nesta proposta final.
- Não foram alterados Supabase, VPS, Meta, Asaas, INPI ou os PRs #5/#6. Esta documentação não conta como conclusão das integrações.

## 2. Preços e regras confirmados
| Plano | Adesão | Mensalidade | Escopo |
| --- | --- | --- | --- |
| Proteção | R$197 | R$49 | Uma marca por assinatura; preparação inicial e acompanhamento conforme o plano |
| Ilimitado | R$497 | R$599 | Honorários de novos pedidos e acompanhamento de marcas ilimitadas enquanto vigente, para um único CPF ou CNPJ titular |

Taxas oficiais do INPI sempre separadas, conforme ato e enquadramento. Busca de viabilidade após aceite e pagamento, mantendo a decisão anterior. Sem negociação improvisada de preços, descontos ou acordos pela Reg; direitos legais e correção de cobrança indevida não são negociação discricionária. Não interpretar trechos ambíguos de transcrição como autorização para outro valor.

O Ilimitado não cobre terceiros, outro CPF, outro CNPJ ou grupo econômico distinto do titular contratado. A pessoa de contato pode ser diferente do titular, mas seus poderes devem ser validados. Troca de número de WhatsApp não transfere automaticamente acesso ao cadastro.

## 3. Experiência e agente exclusivo
Canal único oficial: +55 11 92068-1100. O visitante vem do site/anúncio para o WhatsApp. A Reg primeiro explica o serviço e os planos, responde dúvidas e conduz o aceite do Termo de Serviço eletrônico. Tom direto, próximo e acolhedor; emojis/figurinhas discretos quando apropriados e suportados, sem fingir ser humana ou hostilizar quem não contrata.

Uma identidade Reg atende todos, mas o contexto recuperado em cada execução deve pertencer exclusivamente ao cliente autenticado: mensagens, titular, termos aceitos, assinatura, pagamentos, marcas, arquivos e prazos. Dentro do cliente, cada marca mantém processo próprio. Dúvida entre duas marcas exige esclarecimento antes de associar documento, pagamento ou petição.

Criar registros no banco não conclui o produto. A entrega precisa comprovar WhatsApp -> contexto correto -> aceite -> confirmação de pagamento -> trabalho executado -> evidência externa -> mensagem entregue.

## 4. Termo de Serviço e operação como próprio
Nomenclatura desejada: Termo de Serviço, aceito/assinado digitalmente, com versão, data e evidência de aceite e cópia acessível. Conciliar o PDF aprovado, site, mensagens e gerador. Os nomes internos contract_documents e contract.ts não obrigam a chamar o instrumento de contrato no atendimento, nem precisam ser renomeados sem plano de migração.

Objetivo comercial: Reg como assistente tecnológica, sem cadastrar automaticamente a RegistreAi como procuradora. O pedido pertence ao titular, não à plataforma. Isso não é autorização presumida para compartilhar credenciais e agir como outra pessoa nos sistemas oficiais.

Condição de implementação: validar o acesso permitido e a legitimidade para cada ato. Não pedir senhas pessoais pelo WhatsApp nem contornar CAPTCHA, MFA ou confirmações pessoais. Não presumir que um aceite privado autorize automação irrestrita no INPI. Se o ato exigir atuação pessoal ou representação formal, esse requisito deve ser explicado antes de oferecer execução integralmente autônoma.

Reg é uma IA; a prestadora identificada permanece Registreai Marcas e Patentes LTDA, CNPJ 59.197.668/0001-13. Um termo aceito continua estabelecendo obrigações, mesmo sem fidelidade. Não publicar que inexiste fornecedor ou responsabilidade por se tratar de uma IA. Verificar também a qualificação e habilitação exigíveis para as atividades efetivamente oferecidas.

## 5. Mensalidade, suspensão, alertas e encerramento
### Ativo
Após aceite e pagamentos aplicáveis confirmados, executar somente atos incluídos e autorizados. Assinatura paga não comprova GRU paga nem protocolo realizado.

### Mensalidade não paga
O proprietário determinou a interrupção do serviço remunerado quando não houver renovação paga, mas a manutenção de avisos de pagamento e de movimentações durante até 90 dias. Separar, portanto, EXECUÇÃO REMUNERADA de ALERTAS TRANSITÓRIOS. Estado técnico sugerido: suspensão com alertas limitados, e não acompanhamento integral ativo.

Proposta a confirmar no termo: contar 90 dias corridos a partir do primeiro vencimento não regularizado, respeitando o período já pago; exibir data concreta de encerramento. Não usar três meses como cálculo necessariamente equivalente. Não ativar cobrança, prazo de corte ou readesão até esclarecer as pendências da seção 8.

Durante a janela, avisar sobre publicação/prazo real e deixar claro que preparar ou protocolar a defesa está suspenso. O prazo do INPI não aguarda pagamento da mensalidade. O cliente deve poder continuar por conta própria ou com outro prestador. Se a entrega da mensagem falhar, registrar a falha: enfileirar não é notificar.

### Regularização antes de 90 dias
O proprietário permite reativação, mas não definiu se exige todas as mensalidades vencidas ou apenas a nova mensalidade. Não presumir acúmulo de dívida durante suspensão, quitação integral, perdão automático ou cobrança por avisos transitórios. Confirmar o modelo financeiro antes de implementá-lo.

Na reativação, conferir pagamento no provedor, data efetiva da quitação, eventos recebidos com atraso e situação real de cada processo. Reativar o plano não reabre prazo vencido nem significa criar outro pedido no INPI.

### Encerramento aos 90 dias
Encerrar serviço e alertas automáticos de acompanhamento, comunicar o encerramento e disponibilizar documentos, protocolos e pendências conhecidas. Nova contratação exige novo termo e nova adesão. O proprietário explicitou R$197 + R$49 para voltar ao Proteção. Confirmar a aplicação da adesão de R$497 + R$599/mês quando a nova contratação for Ilimitado; não assumir adesão de R$197 para manter marcas ilimitadas.

Zerar a assinatura não apaga automaticamente históricos ou recibos, nem cancela o processo no INPI. Eliminação ou conservação de dados deve seguir finalidade, base legal e política de retenção. Cessação de acompanhamento não elimina atendimento a direitos do titular, contestação de cobrança ou pedido de cópia. Cancelamento expresso/recusa de mensagens exige fluxo próprio, diferente de inadimplência.

## 6. Atualizações e defesas
Identificar ato, origem, íntegra/anexos e prazo antes de cobrar ou pedir documentos. Diferenciar manifestação à oposição, cumprimento/contestação de exigência e recurso contra indeferimento; não transformar toda publicação em exigência ou taxa.

Fluxo alvo: fonte oficial -> classificação/prazo -> explicação -> documentos/provas faltantes -> avaliação de alternativas lícitas -> guia oficial quando aplicável -> confirmação de pagamento -> preparação e validação da peça -> autorização exigida -> protocolo por acesso permitido -> recibo -> acompanhamento.

Não abandonar silenciosamente um caso por falta de documento: procurar alternativas reais e admissíveis. Essa diretriz não autoriza inventar prova, alegar fato inexistente, dispensar item indispensável ou garantir êxito. Protocolar qualquer texto não comprova cumprimento. Se não existir caminho admissível, informar impedimento e risco a tempo. A decisão final é do INPI.

## 7. Critérios de aceite para implementação futura
1. Dois clientes e várias marcas: provar isolamento, vínculo de titular e seleção do processo correto, inclusive troca de telefone e mensagens ambíguas.
2. Preços: site, configuração compartilhada, prompt, termo e cobrança devem coincidir; não basta corrigir um texto.
3. Aceite e financeiro: confirmar pagamentos reais do ambiente autorizado; testar duplicidade, eventos fora de ordem, cancelamento, pagamento parcial e falha do provedor.
4. Mídia: receber arquivo real no canal de teste, validar e vincular ao requisito certo; nenhuma atribuição ao cliente vizinho.
5. Assinatura: testar dias 0, 89 e 90, suspensão, mensagens, reativação, opt-out e readesão, após fechar a definição financeira.
6. INPI: confirmar guia, pagamento e recibo oficial; simulação não comprova capacidade transacional. Bloqueio deve informar o impedimento, não inventar sucesso.
7. Prazos: distinguir prazo oficial de prazo comercial; testar recuperação de indisponibilidade e informar pendências na saída do serviço.

Nenhum desses critérios é declarado cumprido por este documento.

## 8. Pendências que não podem ser decididas silenciosamente
- PDF do Termo de Serviço prometido pelo proprietário e sua revisão.
- Valor para reativação antes do limite e eventual cobrança durante suspensão: nova mensalidade ou todas as vencidas? Modelo pré-pago ou dívida acumulada?
- Adesão de Ilimitado na nova contratação após 90 dias; eventual escolha de outro plano.
- Marco/inclusão do dia 90, primeiro vencimento, período já pago e ciclo após reativação.
- Canal efetivamente permitido para automação de atos no INPI sem representação, com autenticações não delegáveis identificadas.
- Tratamento de cancelamento expresso, avisos, falhas de entrega, retenção e obrigações legais.

## 9. Verificação externa — não confundir com decisão comercial
- Cadastro e-INPI: https://www.gov.br/inpi/pt-br/cadastro-no-e-inpi — cadastro do interessado e procurador; credenciais pessoais e intransferíveis.
- e-Marcas: https://www.gov.br/inpi/pt-br/assuntos/marcas/e-marcas — peticionamento e GRU; não comprova permissão genérica para robôs.
- Decreto 7.962/2013: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm — identificação do fornecedor, condições, aceite e acesso ao instrumento.
- LPI: https://www.planalto.gov.br/ccivil_03/leis/l9279.htm — atos, requisitos e prazos, especialmente arts. 158, 159, 212 e 216.
- ANPD: https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes — término do tratamento e hipóteses de conservação.

As fontes não definem o valor comercial da reativação; isso continua pendente de confirmação do proprietário. Revisão jurídica final não é substituída por este registro técnico.
