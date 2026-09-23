import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import RegMark from "../brand/RegMark";

// Link seguro: login e senha do e-INPI. A senha vai direto para a função cifrada e nunca é exibida de volta.
const MESSAGES: Record<string, string> = {
  invalid_link: "Este link não é válido. Peça um novo para a Reg no WhatsApp.",
  used: "Este link já foi usado. Se precisar, peça um novo para a Reg.",
  expired: "Este link expirou (vale 15 minutos). Peça um novo para a Reg.",
  invalid_login: "O login do e-INPI é o seu CPF (11 números) ou CNPJ (14 números), sem pontos nem traços.",
  invalid_password: "Digite a senha do e-INPI.",
  unavailable: "Não conseguimos salvar agora. Tente de novo em alguns minutos."
};

export default function SecureCredential() {
  const { token = "" } = useParams();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(() => {
    const base = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
    return base ? `${base}/functions/v1/credential-link` : "";
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!endpoint) { setError(MESSAGES.unavailable); return; }
    setState("sending"); setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, login: login.replace(/\D/g, ""), password })
      });
      const data = await res.json().catch(() => ({ ok: false, code: "unavailable" }));
      setPassword("");
      if (data.ok) setState("done");
      else { setState("idle"); setError(MESSAGES[data.code] ?? MESSAGES.unavailable); }
    } catch {
      setPassword(""); setState("idle"); setError(MESSAGES.unavailable);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f6f7fb" }}>
      <section style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 8px 30px rgba(0,0,0,.08)" }}>
        <RegMark />
        {state === "done" ? (
          <>
            <h1 style={{ fontSize: 22, margin: "18px 0 8px" }}>Pronto, salvo com segurança ✅</h1>
            <p>Pode voltar para o WhatsApp. A Reg continua daqui.</p>
          </>
        ) : (
          <form onSubmit={submit} autoComplete="off">
            <h1 style={{ fontSize: 22, margin: "18px 0 8px" }}>Seu acesso ao e-INPI</h1>
            <p style={{ color: "#555", fontSize: 14 }}>Fica guardado criptografado. Ninguém vê a senha, nem a Reg. Para apagar, é só pedir no WhatsApp.</p>
            <label style={{ display: "block", marginTop: 16, fontWeight: 600 }}>Login (CPF ou CNPJ)
              <input inputMode="numeric" value={login} onChange={(e) => setLogin(e.target.value)} required
                style={{ display: "block", width: "100%", padding: 12, marginTop: 6, fontSize: 16 }} />
            </label>
            <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>Senha do e-INPI
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={64}
                autoComplete="new-password" style={{ display: "block", width: "100%", padding: 12, marginTop: 6, fontSize: 16 }} />
            </label>
            {error && <p role="alert" style={{ color: "#b00020", marginTop: 12 }}>{error}</p>}
            <button type="submit" disabled={state === "sending"}
              style={{ marginTop: 18, width: "100%", padding: 14, fontSize: 16, fontWeight: 700, borderRadius: 10, border: 0, background: "#1f4fff", color: "#fff" }}>
              {state === "sending" ? "Salvando..." : "Salvar com segurança"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
