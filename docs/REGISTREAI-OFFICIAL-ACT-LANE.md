# RegistreAi - lane oficial de procurador (preparação de PR)

**NO-GO / não produção.** Este desenho não cadastra procurador, não acessa e-INPI, não emite GRU e não protocola.

## Modelo definitivo de produto
A Reg conduz o cliente no WhatsApp, coleta o mínimo progressivamente, apresenta resumo e Termos, obtém aceite eletrônico, apresenta uma procuração separada, coleta pagamento e confirmação da prévia. O ato oficial é executado por **procurador pessoa física real e dedicado à carteira RegistreAi**, com credencial pessoal própria e clique humano após revisar a prévia imutável.

Não existe neste desenho:
- CNPJ, IA, agência ou “escritório” fingindo ser procurador;
- uso da senha do cliente fora do link seguro e da custódia cifrada (modo A, 23/09/2026: ver REGISTREAI-EINPI-CREDENTIAL-AND-FILING-FLOW.md); senha do procurador por automação;
- atuação pelo cliente sem autorização contratual específica (gate jurídico do modo A);
- cruzamento de identidade, fila, email operacional, artefatos ou portfólio com qualquer outra operação;
- protocolo sem Termos, procuração, confirmação do cliente e revisão humana.

## Fluxo bloqueante
1. WhatsApp oficial RegistreAi e número de contato confirmado.
2. PF/PJ e coleta mínima; CEP/CNPJ com fonte, data, correção e resumo confirmado.
3. Elegibilidade de desconto somente quando relevante e com evidência.
4. Termos completos versionados + checkbox desmarcado + autenticação + PDF/certificado/recibo.
5. Procuração específica versionada e assinada separadamente.
6. Atribuição de procurador PF ativo da carteira `REGISTREAI`.
7. Dados da marca e análise; preview da GRU com valor oficial vigente e confirmação do cliente.
8. Procurador revisa e clica no ato oficial com credencial própria; recibo oficial é associado ao snapshot.
9. Protocolo segue a mesma dupla confirmação: cliente confirma snapshot, procurador revisa/clica, sistema guarda recibo.
10. Monitoramento RPI, prazos, exceções e handoff humano.

## Separação de carteira
O cadastro da lane exige `portfolio=REGISTREAI`, identidade e-INPI própria confirmada, vínculo operacional exclusivo/dedicado e versão de procuração. Qualquer `portfolio` diferente de `REGISTREAI` é rejeitado. Segregação deve existir também em email, filas, storage, logs, dashboards e escala. Não criar pessoa de fachada: vínculo, poderes, responsabilidade, remuneração, substituição e continuidade devem ser reais e revisados.

## Gates antes de homologar
- Caroline/legal: poderes, validade/assinatura/entrega da procuração, prazo de apresentação, substabelecimento/revogação, disclosure ao cliente e responsabilidade do procurador.
- INPI: confirmação formal de cadastro/vínculo de procuradores, exibição pública e busca por procurador/escritório, operação por PF dedicada e procedimento de continuidade/substituição.
- Identidade/assinatura: provedores, autenticação, recuperação e certificado.
- Operação: nomear PF(s) reais, contrato/vínculo, treinamento, revisão humana, dupla cobertura e offboarding.
- Integração: fonte oficial atual de taxas, forma permitida de automação e captura de recibos sem credenciais.
- Segurança/LGPD: segregação de portfólio, retenção, acesso, auditoria, incidentes e bases legais.

Fontes oficiais para validação formal: https://www.gov.br/inpi/pt-br/composicao/estrutura/como-atuar-no-inpi · https://manualdeig.inpi.gov.br/projects/manual/wiki/3%C2%B701_Cadastro_no_e-INPI · https://www.gov.br/inpi/pt-br/pagamento-de-gru
