# RegistreAi V2 — Produto e Regras Centrais

## Visão
A RegistreAi é uma operação de registro de marcas conduzida por uma IA especializada, chamada **Reg**, com o WhatsApp como interface principal.

O cliente não precisa aprender o processo do INPI. Ele fornece os dados, documentos e pagamentos que dependem dele; a Reg conduz o restante.

## Princípios do produto
1. Um número oficial de WhatsApp para entrada de todos os clientes.
2. Cada cliente recebe um **workspace isolado**, com memória, processos, documentos, prazos, cobranças e eventos próprios.
3. A experiência é de uma **Reg exclusiva por cliente**, embora o runtime e o código-base sejam multi-tenant.
4. Cada marca possui um processo independente e seu próprio estado jurídico.
5. A Reg permanece estritamente no escopo de marcas e serviços correlatos do projeto.
6. Dados e contexto nunca podem atravessar workspaces.
7. A IA não pode ignorar bloqueios de backend.
8. A Reg nunca afirma pagamento ou protocolo sem confirmação externa real.
9. Na dúvida, a automação interrompe a etapa específica, identifica o que falta e só prossegue após resolver a inconsistência.
10. Toda ação crítica gera trilha de auditoria.

## Planos
### Proteção
- Adesão: R$ 197
- Mensalidade: R$ 49
- Uma marca
- Sem fidelidade
- Busca de viabilidade após contratação/pagamento
- Acompanhamento automatizado
- Recursos previstos no plano
- Garantia comercial conforme contrato
- Taxas oficiais do INPI à parte

### Ilimitado
- Adesão: R$ 497
- Mensalidade: R$ 599
- Honorários de registros ilimitados
- Sem carência — cancelamento quando quiser
- Somente para o mesmo CPF ou CNPJ vinculado ao plano
- Não permite registro para terceiros
- Taxas oficiais do INPI à parte

### Regra absoluta do Ilimitado
**Quantidade de marcas = ilimitada. Quantidade de titulares = 1.**

Se o plano foi contratado por CPF, todos os novos pedidos do plano devem usar esse mesmo CPF.
Se foi contratado por CNPJ, todos devem usar esse mesmo CNPJ.
Outro titular exige contratação própria.

## Fluxo principal
WhatsApp -> identificação do cliente -> workspace -> Reg -> cadastro -> plano -> contrato -> cobrança Asaas -> confirmação de pagamento -> viabilidade -> classificação Nice -> taxa INPI -> confirmação -> protocolo -> acompanhamento RPI -> ações jurídicas -> renovação.

## Eventos jurídicos
Para oposição, exigência, exigência de mérito, indeferimento e recurso:
1. detectar publicação;
2. classificar evento;
3. calcular prazo;
4. analisar o processo;
5. verificar quais documentos já existem;
6. solicitar ao cliente apenas o que estiver faltando;
7. receber e validar documentos;
8. gerar taxa oficial quando aplicável;
9. solicitar comprovante quando necessário;
10. confirmar efetivamente o pagamento;
11. redigir a peça;
12. revisar com segundo agente/motor;
13. validar dados determinísticos;
14. protocolar;
15. capturar recibo/protocolo;
16. atualizar CRM e avisar o cliente.

Se o cliente não enviar o necessário a tempo, a Reg registra os lembretes, informa o impedimento e, se o prazo expirar, comunica o encerramento do prazo sem inventar protocolo.

## Frase operacional
**Quando precisarmos de algo seu, vamos pedir. O restante é com a Reg.**
