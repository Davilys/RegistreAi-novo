# RegistreAi - fluxo e-INPI, credencial e protocolo (decisão do dono, 23/09/2026)

**Decisão travada (não perguntar de novo):** modo A. A Reg faz tudo pelo cliente no INPI. Substitui o item 2 do CUSTOMER-ONBOARDING-INPI-BLUEPRINT.md e o "não existe uso da senha do cliente" da OFFICIAL-ACT-LANE. Gate jurídico pendente (não bloqueia build): cláusula no contrato autorizando a Reg a operar a conta e-INPI do cliente.

## 1. Cadastro e-INPI
Pergunta: "Você já tem cadastro no e-INPI? 1 Sim e lembro a senha / 2 Sim mas esqueci / 3 Não".
- **3 Novo:** Reg envia o link oficial https://meu.inpi.gov.br/pag/cliente/form e guia passo a passo, com PRINT da página em cada passo (cliente leigo). O PDF ilustrado do cadastro só entra no fluxo após aprovação do dono.
- **2 Esqueceu:** Sistema de emissão de GRU → "Esqueceu a senha? Clique aqui" → CPF/CNPJ só números → Pesquisar → marcar login → "Receber por e-mail" (disparar só com OK do cliente na conversa). O INPI informa o e-mail de destino depois do disparo; a Reg repassa como o INPI mostra. Senha provisória vai por e-mail, até 10 caracteres, diferencia maiúsculas; usar no PAG. Sem acesso ao e-mail → rota Fale Conosco do INPI (RG, CPF/contrato social, carta de autorização). Fonte: https://www.gov.br/inpi/pt-br/acesso-a-informacao/perguntas-frequentes/acesso-aos-sistemas
- **Login e-INPI:** é um nome de usuário escolhido pelo cliente (até 10 letras/números, sem símbolos), não o CPF/CNPJ. O link seguro, a função e o CHECK da tabela validam `^[A-Za-z0-9]{1,10}$`.
- **1 Lembra:** direto ao link seguro.

## 2. Credencial (login + senha)
- Só pelo link seguro RegistreAi (uso único, 15 min, token guardado só como hash). NUNCA pela conversa.
- Criptografada (AES-256-GCM) com chave dedicada EINPI_CREDENTIAL_KEY_B64 (não é a chave de PII). Banco guarda só cifrado. Tabela fechada (RLS, só service_role). Todo acesso auditado.
- A senha NUNCA aparece: nem conversa, nem /admin, nem log. Só "credencial cadastrada em DD/MM". Erros com a senha são redigidos.
- Não pede de novo, salvo se o INPI recusar o login (a Reg avisa).
- Retenção: caso fechado + 30 dias, ou antes se o cliente pedir "apagar minha senha".
- Testes: tests/credentials.test.ts.

## 3. GRU (valor sempre lido da GRU/tabela oficial do INPI; nunca constante no texto)
Mensagem da GRU inclui bloco curto:
1. Pague por PIX ou boleto, em qualquer banco, dentro do prazo.
2. Não deixe vencer e não pague vencida - o INPI não reembolsa. A responsabilidade é sua.
3. Pagou? Me envia o comprovante aqui.
Nunca prometer número de processo antes do pagamento confirmado. (Dono citou R$ 440 como taxa atual em 23/09; conferir com a tabela oficial vigente antes de qualquer texto fixo.)

## 4. Protocolo (ordem do dono)
1. Comprovante recebido → Reg VERIFICA que a GRU consta paga no INPI antes de qualquer protocolo.
2. Só então pede: cópia de RG ou CNH + logotipo (JPEG; outro formato → Reg converte para o formato aceito pelo INPI).
3. Procuração já assinada na etapa do contrato: Reg baixa do CRM e confere.
4. Preenche o pedido até o passo ANTERIOR ao finalizar.
5. Gera PDF de revisão e envia ao cliente.
6. Só com aprovação do cliente: finaliza e entrega o número do processo.
7. Avisa: ~90 dias até a publicação na RPI; a Reg volta sozinha com a atualização (monitor RPI).

## 5. Follow-ups da conversa (regras WebMarcas 1-8)
Ver services/reg-worker/src/followups.ts e tests/followups.test.ts (F1-F5 + regras 3, 7, 8).
