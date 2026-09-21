import { Link } from "react-router-dom";
import RegMark from "../brand/RegMark";

export default function PrivacyV2() {
  return (
    <main className="legal-page">
      <header className="legal-header wrap">
        <Link className="brand" to="/">
          <RegMark size={40} />
          <span>RegistreAi</span>
        </Link>
        <Link className="legal-back" to="/">← Voltar</Link>
      </header>

      <article className="legal-content">
        <p className="eyebrow">PRIVACIDADE</p>
        <h1>Política de Privacidade</h1>
        <p className="legal-updated">Versão preliminar para ambiente de desenvolvimento.</p>

        <h2>1. Nosso compromisso</h2>
        <p>
          A RegistreAi trata dados pessoais exclusivamente para viabilizar a contratação, execução,
          acompanhamento e suporte relacionados aos serviços oferecidos. A versão final desta política
          será revisada antes da publicação em produção.
        </p>

        <h2>2. Dados utilizados</h2>
        <p>
          Podemos tratar dados cadastrais, dados de contato, informações do titular da marca,
          documentos enviados pelo cliente, dados de pagamento, mensagens trocadas com a Reg e
          informações necessárias ao acompanhamento do processo perante o INPI.
        </p>

        <h2>3. Finalidades</h2>
        <p>
          Os dados são utilizados para identificar o cliente, executar o contrato, preparar e acompanhar
          processos, comunicar prazos e movimentações, cumprir obrigações legais e manter a segurança da plataforma.
        </p>

        <h2>4. Segurança</h2>
        <p>
          A arquitetura utiliza isolamento por cliente, controle de acesso, registros de auditoria,
          armazenamento privado de documentos e medidas técnicas destinadas a reduzir acesso indevido.
        </p>

        <h2>5. Direitos do titular</h2>
        <p>
          O titular poderá solicitar acesso, correção e demais providências previstas na legislação aplicável,
          observadas as hipóteses legais de retenção de dados.
        </p>

        <h2>6. Contato</h2>
        <p>
          O canal definitivo de privacidade e os dados empresariais serão incluídos antes da publicação da plataforma.
        </p>
      </article>
    </main>
  );
}
