# RegistreAi — decisões de serviço e assinatura (22/09/2026)

## Estado e alcance deste registro
Fonte das decisões comerciais: explicação expressa do proprietário na conversa de 22/09/2026. Este documento registra requisitos; NÃO afirma que a jornada, os 90 dias, a cobrança, a mídia, o protocolo ou os recursos já estejam implementados. Não substitui o Termo de Serviço a ser enviado pelo proprietário em PDF para revisão. Não publicar uma versão final do termo a partir de suposições.

Nesta revisão, a única alteração operacional no código é a correção das adesões no prompt da Reg para os mesmos valores do site e da tabela public.plans. Foram acrescentados testes estáticos de consistência comercial. Não houve modificação no Supabase, no VPS, na Meta, no Asaas ou no INPI. O PR #5 não foi alterado nem incorporado como parte dessa correção.

## 1. Valores confirmados pelo proprietário
| Plano | Adesão | Mensalidade | Cobertura contratada |
| --- | --- | --- | --- |
| Proteção | R$197 | R$49 | Uma marca por assinatura; preparação inicial e acompanhamento no escopo do plano |
| Ilimitado | R$497 | R$599 | Honorários de novos pedidos e acompanhamento de marcas ilimitadas durante a vigência, para exatamente um CPF ou CNPJ titular |

As taxas oficiais do INPI são separadas e dependem do ato e do enquadramento correto. A busca de viabilidade ocorre após contratação/aceite e pagamento, conforme a decisão comercial anterior mantida. Não interpretar trechos de transcrição ambíguos como autorização para outro preço.

Sem descontos, parcelamentos, remissões ou acordos inventados pela Reg. Não confundir essa regra comercial com impedimento ao exercício de direitos legais, correção de cobrança indevida ou restituição devida.

Conferência realizada: src/config/company.ts e public.plans já tinham 19700/4900 e 49700/59900 centavos. O prompt ainda anunciava 299/999 de adesão. Corrigir esse desvio não habilita cobrança real.

## 2. Experiência desejada
Um único número oficial recebe quem vem do site ou anúncio: +55 11 92068-1100. Reg é a identidade de IA da RegistreAi. O atendimento começa comercial: explica o serviço, apresenta os dois planos sem negociar condições improvisadas, responde dúvidas, obtém dados e disponibiliza o Termo de Serviço para aceite eletrônico versionado.

O tom é próximo, acolhedor, direto e natural, com emojis/figurinhas discretos quando apropriado e suportado pelo canal. Não fingir ser humana; não pressionar ou hostilizar quem não deseja contratar. Não dizer ao cliente que suporte a uma mensagem de texto prova suporte a figurinhas ou documentos.

Cada cliente utiliza contexto isolado, com dados, mensagens, assinatura, comprovantes, termos aceitos, marcas, documentos e prazos próprios. Dentro do cliente, cada marca tem seu processo. Havendo ambiguidade, confirmar qual marca antes de associar prova, cobrança ou petição. Um número de WhatsApp identifica um canal, não comprova por si só identidade civil ou poderes de representação. Troca de número exige verificação segura.

## 3. Termo de Serviço e modelo de atuação
Nomenclatura voltada ao cliente: Termo de Serviço, com assinatura/aceite eletrônico, versão e cópia acessível. Os nomes internos contract_documents/contract.ts não definem a natureza jurídica da operação e não precisam ser renomeados às cegas. O gerador e as mensagens ainda precisam ser conciliados com o PDF aprovado.

Objetivo do proprietário: Reg como assistente tecnológica, sem cadastro automático da RegistreAi como procuradora. O titular permanece o CPF/CNPJ do cliente. Esse objetivo NÃO é uma conclusão de que a plataforma possa usar credenciais pessoais e agir como o usuário em qualquer sistema.

Condições para implementação do protocolo: validar cadastro, autenticação, representação e acesso automatizado permitido para cada ato. Não compartilhar credenciais pessoais no WhatsApp; não contornar verificações, CAPTCHA, MFA ou declarações pessoais. Não presumir que o aceite ao serviço privado autorize tudo no sistema oficial. Se o ato exigir participação pessoal ou representação formal, registrar o bloqueio e esclarecer o requisito antes de oferecer execução integralmente autônoma.

A assistente pode ser apresentada como tecnologia, mas a prestadora identificada continua sendo Registreai Marcas e Patentes LTDA, CNPJ 59.197.668/0001-13. O termo aceito continua gerando obrigações de prestação de serviço, mesmo sem fidelidade. Não publicar a alegação de inexistência de fornecedor ou responsabilidade por ser IA.

## 4. Ciclo mensal definido pelo proprietário
### Serviço ativo
Após aceite e pagamentos aplicáveis confirmados externamente, executar somente as etapas autorizadas e incluídas, respeitando os requisitos oficiais. A assinatura ativa autoriza serviços; não comprova pagamento de GRU nem existência de protocolo.

### Falta de renovação paga
O proprietário determinou que a execução remunerada pare quando a mensalidade não for paga. Ao mesmo tempo, deseja manter avisos de pagamento e de movimentações dos processos por uma janela de até 90 dias. Portanto, devem existir dois direitos separados: EXECUÇÃO DO SERVIÇO e ALERTAS TRANSITÓRIOS. Para o sistema, tratar como suspensão com alertas limitados, e não como acompanhamento integral ativo.

Proposta de implementação para confirmação no termo: iniciar a contagem no primeiro vencimento não regularizado, respeitar o período já pago e encerrar os alertas ao completar 90 dias corridos. Não usar a expressão três meses como cálculo equivalente em todas as datas. Publicar a data concreta de encerramento nos avisos. Não implementar sem fechar as definições da seção 7.

Durante essa janela, informar claramente que uma movimentação foi identificada, qual é o prazo oficial e que a execução está suspensa. Não sugerir que o prazo do INPI aguardará a regularização. O cliente deve poder continuar por conta própria ou por outro prestador. Os avisos não constituem promessa de defesa ou protocolo durante a suspensão.

### Reativação antes do limite
O proprietário permite reativar mediante regularização antes do encerramento definitivo. A forma de calcular o valor de regularização NÃO está definida: não presumir quitação de todos os meses nem perdão automático de débitos. A comprovação deve vir do provedor e observar a data efetiva do pagamento, inclusive webhook recebido com atraso. Após reativar, reconciliar publicações e tarefas sem duplicar pedidos ou taxas.

### Encerramento definitivo aos 90 dias
Encerrar o serviço e os alertas automáticos de acompanhamento; comunicar o encerramento e disponibilizar histórico, números e pendências conhecidas. Uma nova contratação exige novo aceite e adesão conforme o plano escolhido e confirmado. O proprietário explicitou R$197 + R$49 para nova contratação de Proteção. A readesão de Ilimitado deve seguir confirmação específica, sem presumir R$197 para manter marcas ilimitadas.

Zerar a assinatura não é apagar recibos, dados necessários ou histórico, nem cancelar o pedido no INPI. Dados desnecessários devem ser eliminados conforme a política de retenção; conservação exige finalidade/base aplicável. Cessação de acompanhamento não extingue canais para direitos do titular, contestação de cobranças ou cópia de documentos. Pedido expresso de cancelamento/recusa de mensagens é distinto de simples inadimplência e precisa de tratamento próprio.

## 5. Atualizações, taxas e peças administrativas
A Reg deve identificar o ato real e obter a íntegra e anexos pertinentes. Não tratar toda publicação como exigência nem toda resposta como recurso. Separar manifestação sobre oposição, cumprimento/contestação de exigência e recurso contra indeferimento, com prazo, taxa e documentos próprios.

Sequência alvo: fonte oficial -> classificar ato e prazo -> comunicar -> solicitar somente dados/provas faltantes -> avaliar alternativas lícitas -> gerar guia oficial quando aplicável -> confirmar pagamento externo -> elaborar e verificar peça -> obter autorização exigida -> protocolar por acesso permitido -> guardar recibo -> acompanhar.

A ausência de um documento deve provocar análise de alternativas reais e cabíveis, não abandono silencioso. Ela NÃO autoriza fabricar provas, alegar fatos inexistentes, dispensar documento indispensável ou prometer êxito. Uma resposta possível deve ser materialmente adequada; protocolar qualquer texto não comprova cumprimento. Se não houver caminho admissível, comunicar o impedimento a tempo e registrar o motivo. A decisão final é do INPI.

## 6. Critérios de aceite de produto, não só de banco
1. Visitante -> WhatsApp real -> contexto correto -> apresentação dos preços -> termo aprovado -> aceite verificável.
2. Pagamento externo -> plano correto -> início permitido, sem depender de print e sem duplicidade por reenvio de webhook.
3. CPF/CNPJ errado, outra marca e outro cliente: bloqueio determinístico antes de ler documento ou executar ato.
4. Documento chega pelo WhatsApp -> arquivo validado -> cliente/processo corretos -> requisito atualizado -> rotina retomada.
5. Guia/petição só recebem status final após confirmação oficial verificável; ausência de integração gera bloqueio explícito.
6. Atraso -> suspensão da execução -> alertas transitórios -> regularização/encerramento; checar dias 0, 89, 90, webhook atrasado, pagamento duplicado e cancelamento expresso.
7. Reativação não reabre prazo oficial vencido nem cria novo processo para substituir o existente sem necessidade e autorização.
8. Alertas precisam de confirmação de entrega, tentativas controladas e caminho de falha. Não considerar evento na fila como mensagem entregue.

Nenhum teste acima está declarado aprovado apenas por existir este documento.

## 7. Definições que continuam pendentes
- PDF do Termo de Serviço prometido pelo proprietário, incluindo revisão de compatibilidade com site, gerador e operação.
- Valor necessário para reativar antes de 90 dias: somente nova mensalidade ou todas as parcelas vencidas? O período suspenso continua sendo cobrado ou o modelo é pré-pago, sem renovação de dívida?
- Adesão exigida para nova contratação de Ilimitado após o limite: confirmar manutenção de R$497 + R$599/mês quando esse plano for escolhido.
- Marco e inclusão do dia 90, primeiro vencimento/novo ciclo pago, pagamento parcial e solicitações expressas de cancelamento.
- Canal permitido pelo INPI para atos automatizados sem representação e quais autenticações/confirmações não são delegáveis.
- Capacidade efetiva para cumprir os atos e prazos anunciados antes de ativar vendas com execução automática.

## 8. Fontes externas consultadas — separar de decisões comerciais
- Cadastro e-INPI: https://www.gov.br/inpi/pt-br/cadastro-no-e-inpi — distingue cadastro do interessado e procurador; login e senha pessoais e intransferíveis.
- e-Marcas: https://www.gov.br/inpi/pt-br/assuntos/marcas/e-marcas — orienta peticionamento e GRU; não é autorização genérica para um robô usar a conta do titular.
- Decreto 7.962/2013: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm — identificação do fornecedor, clareza de restrições, aceite e acesso ao instrumento; o nome termo não elimina obrigações.
- LPI: https://www.planalto.gov.br/ccivil_03/leis/l9279.htm — arts. 158, 159, 212 e 216; atos, requisitos e prazos não se confundem com os da assinatura.
- ANPD: https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes — término do tratamento e hipóteses de conservação de dados.

As fontes não foram usadas para inventar uma regra de cobrança que o proprietário ainda não definiu. Validar juridicamente a versão final antes da oferta e contratação reais.
