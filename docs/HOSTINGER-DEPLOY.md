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

## Admin (/admin)
`registreai.com.br/admin` é servido por um container separado (`admin-web`, `Dockerfile.admin`) atrás de basic auth no Caddy. É a prévia do CRM com dados sintéticos: sem Supabase, sem Meta, sem dados reais. O login Google + 2FA substitui a senha depois.

A senha nunca vai para o Git. Só o hash bcrypt fica em `/opt/registreai/.env`:

```bash
cd /opt/registreai
docker compose exec caddy caddy hash-password
# cole o resultado entre aspas simples:
# ADMIN_BASIC_AUTH_HASH='$2a$14$...'
```

Sem essa variável o `deploy.sh` para antes de mexer em qualquer coisa, porque o Caddy não sobe sem ela.

## Atualização

```bash
sudo bash /opt/registreai/deploy/hostinger/deploy.sh
```

## Segurança
- Nunca versionar `.env.worker`.
- Nunca colocar `SUPABASE_SERVICE_ROLE_KEY`, tokens Meta, Asaas ou OpenAI em variáveis `VITE_*`.
- Trocar o Caddyfile para o domínio definitivo antes de produção.
- Produção do WhatsApp/Asaas/INPI só deve ser ativada depois dos testes de staging.
