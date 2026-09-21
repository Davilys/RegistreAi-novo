import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import RegMark from "../brand/RegMark";

type ContractResponse = {
  version: string;
  sha256: string;
  status: "issued" | "accepted" | "superseded" | "cancelled";
  accepted_at: string | null;
  html: string;
};

export default function ContractView() {
  const { token = "" } = useParams();
  const [data, setData] = useState<ContractResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const endpoint = useMemo(() => {
    const base = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
    if (!base || !token) return "";
    return `${base}/functions/v1/contract-public?token=${encodeURIComponent(token)}`;
  }, [token]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!endpoint) {
        setError("Contrato indisponível.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: { accept: "application/json" }
        });

        if (!response.ok) {
          if (response.status === 410) throw new Error("Este link expirou. Peça um novo link para a Reg no WhatsApp.");
          if (response.status === 404) throw new Error("Contrato não encontrado.");
          throw new Error("Não foi possível abrir o contrato agora.");
        }

        const payload = (await response.json()) as ContractResponse;
        if (active) setData(payload);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Erro ao carregar contrato.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [endpoint]);

  return (
    <main className="contract-view-page">
      <header className="legal-header wrap">
        <Link className="brand" to="/">
          <RegMark size={40} />
          <span>RegistreAi</span>
        </Link>
        <Link className="legal-back" to="/">← Voltar</Link>
      </header>

      <section className="contract-view-shell wrap">
        <div className="contract-view-heading">
          <p className="eyebrow">CONTRATO DIGITAL</p>
          <h1>Leia com calma.</h1>
          <p>
            Depois de conferir o documento, volte ao WhatsApp e responda apenas <strong>ACEITO</strong> para continuar.
          </p>
        </div>

        {loading && <div className="contract-state-card">Carregando contrato…</div>}
        {error && <div className="contract-state-card error">{error}</div>}

        {data && (
          <>
            <div className="contract-meta">
              <span>Versão: {data.version}</span>
              <span>Hash: {data.sha256.slice(0, 14)}…</span>
              <span className={`contract-status ${data.status}`}>
                {data.status === "accepted" ? "Aceito" : "Aguardando aceite"}
              </span>
            </div>

            <iframe
              className="contract-frame"
              title="Contrato RegistreAi"
              sandbox=""
              srcDoc={data.html}
            />

            <div className="contract-instruction">
              <strong>Próximo passo</strong>
              <p>Volte ao WhatsApp e envie <b>ACEITO</b>. A Reg seguirá automaticamente para o pagamento.</p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
