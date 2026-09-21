# Deploy na Hostinger VPS

Repositório oficial: `Davilys/RegistreAi-novo`  
Branch: `main`  
Diretório no VPS: `/opt/registreai`

## Site
O site usa Docker + Nginx e fica atrás do Caddy.

### Primeira instalação
No VPS Ubuntu:

```bash
git clone https://github.com/Davilys/RegistreAi-novo.git /opt/registreai
cd /opt/registreai
sudo bash deploy/hostinger/bootstrap.sh
```

Configure `/opt/registreai/.env`:

```env
VITE_SUPABASE_URL=https://qxgfkpqlaffsesqtnojh.supabase.co
VITE_WHATSAPP_NUMBER=
```

Depois:

```bash
cd /opt/registreai
docker compose up -d --build web caddy
```

## Reg Worker
O worker NÃO deve receber segredos pelo GitHub.

Crie diretamente no VPS:

```bash
cp deploy/hostinger/.env.worker.example deploy/hostinger/.env.worker
chmod 600 deploy/hostinger/.env.worker
```

Preencha os segredos e ative:

```bash
docker compose --profile worker up -d --build reg-worker
```

## Atualização

```bash
sudo bash /opt/registreai/deploy/hostinger/deploy.sh
```

## Segurança
- Nunca versionar `.env.worker`.
- Nunca colocar `SUPABASE_SERVICE_ROLE_KEY`, tokens Meta, Asaas ou OpenAI em variáveis `VITE_*`.
- Trocar o Caddyfile para o domínio definitivo antes de produção.
- Produção do WhatsApp/Asaas/INPI só deve ser ativada depois dos testes de staging.
