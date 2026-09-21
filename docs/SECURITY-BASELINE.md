# RegistreAi V2 — Baseline de Segurança e LGPD

## Princípio
Dados de clientes, documentos e processos são tratados como informação sensível do negócio. O sistema deve ser multi-tenant com isolamento forte por workspace.

## Controles obrigatórios
- RLS em todas as tabelas expostas.
- Nenhuma tabela de cliente disponível diretamente para anon/authenticated sem política explícita.
- service_role nunca no frontend.
- dados críticos criptografados em repouso no nível da aplicação quando necessário.
- CPF/CNPJ armazenados com hash para comparação e versão criptografada para uso operacional.
- número de WhatsApp armazenado com hash para resolução de identidade e valor mascarado para exibição.
- bucket de documentos privado.
- URLs assinadas e com curta validade.
- trilha de auditoria append-only.
- idempotência em webhooks e ferramentas.
- validação de assinatura/segredo em webhooks.
- segregação de ambientes sandbox/produção.
- segredos somente em secret stores; nunca em Git.
- mínimo privilégio.
- bloqueio de referências cross-workspace por constraints e validações de backend.
- confirmação externa antes de marcar pagamento ou protocolo como concluído.
- backups e teste periódico de restauração.
- política de retenção e atendimento a solicitações de titulares de dados.

## Multi-tenant
Toda operação de dados deve carregar:
- workspace_id
- customer/holder_id quando aplicável
- process_id quando aplicável

O backend deve rejeitar automaticamente referências que pertençam a outro workspace.

## Plano Ilimitado
A associação titular-plano é bloqueada.
O backend não permite processo vinculado a assinatura com holder_id diferente do titular contratado.

## Agente
O modelo de IA nunca recebe acesso irrestrito ao banco.
As ferramentas expostas à Reg são de escopo estreito e sempre aplicam o workspace atual.

## Webhooks
Fluxo:
1. receber;
2. validar autenticidade;
3. persistir evento de forma idempotente;
4. enfileirar processamento;
5. responder rapidamente ao provedor;
6. processar assíncrono;
7. registrar sucesso/falha.

## Documentos
- validar MIME real;
- limitar tamanho;
- calcular SHA-256;
- bloquear executáveis;
- classificar;
- associar a processo/caso;
- manter origem e horário;
- não expor caminho interno ao cliente.

## Auditoria
Registrar:
- ator;
- ação;
- entidade;
- workspace;
- processo;
- request/correlation id;
- horário;
- metadados redigidos.

Não registrar segredos, tokens, senhas ou documentos completos em logs.

## LGPD
A aplicação deve suportar:
- registro de consentimentos/aceites;
- finalidade de tratamento;
- correção;
- acesso;
- revogação quando aplicável;
- exclusão conforme obrigações legais/contratuais;
- portabilidade quando aplicável;
- trilha de atendimento ao titular.
