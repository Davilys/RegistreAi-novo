# RegistreAi - onboarding, contratação e captura INPI (preparação)

**Status:** implementação de PR, não pronta para produção. Não cria cadastro e-INPI, não emite GRU, não protocola pedido e não envia instrumento ao cliente. Caroline/assessoria deve fechar os pontos marcados como gate jurídico.

## Sequência bloqueante
1. **Titular:** selecionar PF brasileira, PJ brasileira, PF/PJ estrangeira e eventual cotitularidade. Cada cotitular tem cadastro completo e validação própria.
2. **Cadastro e-INPI (modo A, decisão do dono 23/09/2026):** a Reg faz tudo pelo cliente no INPI. Cliente novo cria o cadastro guiado passo a passo (link oficial + print de cada tela); quem esqueceu a senha recebe a provisória do INPI no e-mail cadastrado. Login e senha só pelo link seguro RegistreAi (uso único, 15 min), cifrados com chave dedicada, nunca exibidos (conversa, /admin, logs), auditados e apagados no fechamento do caso + 30 dias ou a pedido. Detalhes: REGISTREAI-EINPI-CREDENTIAL-AND-FILING-FLOW.md. **Gate jurídico:** cláusula contratual autorizando a operação da conta e-INPI do cliente.
3. **Desconto:** registrar declaração, categoria, evidência, responsável pela verificação, data e resultado. Não presumir desconto. **Gate jurídico/produto:** documentos aceitos, expiração e gratuidade.
4. **Contrato:** antes do aceite, mostrar quadro-resumo, limitações em destaque e Termos integrais versionados. Checkbox obrigatório nasce desmarcado; autenticação/confirmação acontece depois. Preservar versão, hash, identidade, método de autenticação, data/hora, canal, evento, IP quando disponível e metadados mínimos. Gerar e entregar imediatamente PDF aceito, certificado de auditoria e recibo.
5. **Modelo operacional:** representação formal por procuração específica; procurador PF real, dedicado à carteira RegistreAi, entra com credencial própria e revisa/clica no ato oficial. Estrangeiro domiciliado fora do Brasil exige representante domiciliado no Brasil e poder para receber citação judicial. **Gate jurídico/INPI:** validar a estrutura, exibição pública, substituição e continuidade; não há rota presumida de CNPJ-procurador.
6. **GRU:** montar preview com titular e procurador PF dedicado, unidade Marcas, serviço (ex.: 389 especificação pré-aprovada ou 394 livre), classe(s), desconto, fonte oficial/data/versão e valor vigente lido do INPI. Valores governamentais mutáveis não são constantes de produto. Exigir confirmação vinculada ao hash do preview antes da emissão.
7. **Pedido:** somente após a etapa GRU, coletar natureza, apresentação, nome/tradução, imagem, classe Nice, lista de produtos/serviços, compatibilidade da atividade, prioridade e anexos condicionais. Exigir confirmação final vinculada ao snapshot antes do protocolo.

## Campos condicionais
- **PF brasileira:** nacionalidade, natureza Pessoa Física, CPF, nome completo sem abreviação, endereço brasileiro completo, e-mail; atividade/ocupação e contatos quando necessários; indicadores PCD/CadÚnico e participação em empresa do mesmo ramo para elegibilidade.
- **PJ brasileira:** nacionalidade, natureza/enquadramento, CNPJ, razão social sem abreviação, endereço completo, e-mail, atividade e contatos; prova atual de enquadramento quando houver desconto.
- **Estrangeiro:** PF/PJ, nome/razão social, país/endereço e e-mail; representante legal domiciliado no Brasil e procuração específica. CEP não deve ser exigido quando inaplicável.
- **Cotitularidade:** repetir o bloco completo e a elegibilidade para cada requerente; **gate INPI/jurídico:** confirmar suporte, representação, descontos e responsabilidade pelo pagamento no fluxo oficial atual.

## Bases e consentimentos
Execução contratual, obrigação legal/regulatória, prevenção a fraude/segurança e exercício de direitos devem ser registrados separadamente de consentimento LGPD. Marketing opcional precisa de escolha própria e revogável. Aceite dos Termos não é consentimento genérico para todo tratamento. Arrependimento, cancelamento da renovação, revogação de procuração e direitos de titular de dados são comandos distintos.

## Gates abertos antes de produção
- Caroline: texto final, CDC/arrependimento, escopo de serviços, procuração específica, retenção e bases LGPD.
- Identidade: método de autenticação, recuperação, conflito de identidade e risco.
- Assinatura: provedor, certificado, entrega, disponibilidade do PDF e prova de integridade.
- INPI: modalidade oficial de integração/automação, atualização de tabela, cotitularidade, anexos e poderes.
- Produto: nomear procurador(es) PF reais e dedicados à RegistreAi, definir vínculo, redundância, handoff humano, suporte a estrangeiros, descontos e contingência.

Fontes oficiais de operação: https://www.gov.br/inpi/pt-br/cadastro-no-e-inpi · https://meu.inpi.gov.br/pag/cliente/form · https://www.gov.br/inpi/pt-br/pagamento-de-gru · https://www.gov.br/inpi/pt-br/servicos/custos-e-pagamento/descontos

## Contrato eletrônico e entrega
A interface atual que instrui o cliente a responder `ACEITO` no WhatsApp é legado e não atende sozinha a este blueprint. Antes da produção, substituir por ação autenticada no próprio documento, com checkbox desmarcado e confirmação subsequente; a frase em canal pode ser evidência complementar. Não criar cobrança até a conclusão e entrega dos artefatos. A procuração deve possuir `instrument_id`, versão, hash e trilha próprios, sem ser fundida ao aceite dos Termos. O procurador revisa e clica no ato oficial com sua credencial pessoal; a automação nunca recebe essa credencial.

## WhatsApp: perguntar o mínimo, confirmar o todo
Os campos do INPI são o modelo final, não um questionário bruto. A primeira pergunta é PF ou PJ.
- PF: pedir CPF; nome completo apenas se não puder ser resolvido com confiança; CEP, número, complemento opcional e e-mail. Resolver logradouro/bairro/cidade/UF pelo CEP, mostrar fonte/data e pedir correção/confirmação.
- PJ: pedir CNPJ; consultar razão social, situação, natureza, porte e endereço em fonte pública oficial atual quando disponível. Não transcrever pelo cliente. Pedir CEP/número/complemento apenas se faltar, divergir ou houver endereço de correspondência válido; pedir nome, CPF e e-mail do representante para contrato e identificação do responsável; procuração específica separada.
- Reaproveitar o número verificado do WhatsApp como contato, mostrar que será usado e pedir confirmação. Ele não prova identidade sozinho.
- Nacionalidade/estrangeiro, cotitularidade e elegibilidade a desconto só abrem seus ramos quando sinalizados ou não verificáveis.
- Todo autofill guarda `source`, URL quando houver, `retrieved_at` e confirmação/correção. Nenhum dado de identidade é sobrescrito silenciosamente. A Reg mostra um resumo integral confirmado antes de contrato, procuração separada, atribuição de procurador, GRU e protocolo.
- Se CEP/CNPJ não resolver, estiver indisponível ou divergir, interromper o avanço e pedir somente o campo faltante/correção, sem inventar. A coleta segue minimização e finalidade; campos opcionais permanecem opcionais.


## Proibição de impersonação e modelo oficial
Os Termos não podem transformar credencial pessoal em autorização válida para a Reg operar “como o próprio cliente”. O modelo oficial preparado é representação formal: procuração específica, procurador PF real dedicado à carteira RegistreAi, credencial própria e clique humano após revisão. Até os gates jurídico, INPI e operacional fecharem, nenhuma automação pode atribuir procurador, criar GRU ou protocolar.
