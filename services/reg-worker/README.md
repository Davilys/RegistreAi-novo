# Reg Worker

Serviço de execução autônoma da RegistreAi.

## Responsabilidades iniciais
- consumir filas duráveis do Supabase;
- processar webhooks do WhatsApp e Asaas;
- resolver/criar o workspace isolado de cada cliente;
- registrar mensagens de forma idempotente;
- chamar a OpenAI Responses API com saída estruturada;
- registrar auditoria das execuções;
- enfileirar e enviar respostas pelo WhatsApp Cloud API;
- nunca executar diretamente uma ação proposta pelo modelo sem validação do backend.

## Segurança
- chaves apenas por variáveis de ambiente;
- payload bruto de webhook armazenado criptografado;
- telefone armazenado criptografado e identificado por HMAC;
- mensagens inbound e outbound criptografadas;
- service role somente no worker/VPS;
- nenhum segredo no frontend;
- store=false nas chamadas à OpenAI;
- contexto sempre limitado a um único workspace.

## Deploy
O serviço será executado no VPS da Hostinger via Docker após a validação de staging.

## Integrações necessárias para ativação
- OpenAI API key;
- Meta access token, phone number id e Graph API version;
- Asaas webhook secret/API key;
- chaves de criptografia de produção.
