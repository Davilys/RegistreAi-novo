import { Link } from "react-router-dom";
import RegMark from "../brand/RegMark";

export default function TermsV2() {
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
        <p className="eyebrow">TERMOS</p>
        <h1>Termos de Serviço</h1>
        <p className="legal-updated">Versão preliminar para ambiente de desenvolvimento.</p>

        <h2>1. Serviço</h2>
        <p>
          A RegistreAi oferece uma experiência digital de apoio ao registro e acompanhamento de marcas,
          conduzida pela Reg, sua inteligência artificial especializada.
        </p>

        <h2>2. Decisão do INPI</h2>
        <p>
          A RegistreAi atua na preparação e acompanhamento do processo, mas a decisão sobre deferimento
          ou indeferimento pertence ao INPI. A versão final do contrato definirá as condições específicas
          das garantias comerciais oferecidas.
        </p>

        <h2>3. Plano Ilimitado</h2>
        <p>
          O Plano Ilimitado é vinculado ao mesmo CPF ou CNPJ titular informado na contratação e não poderá
          ser utilizado para pedidos em nome de terceiros. Taxas oficiais do INPI são pagas separadamente.
        </p>

        <h2>4. Responsabilidades do cliente</h2>
        <p>
          Quando documentos, informações, confirmações ou pagamentos dependerem do cliente, a Reg solicitará
          o necessário. O cliente é responsável por fornecer essas informações dentro do prazo comunicado.
        </p>

        <h2>5. Versão final</h2>
        <p>
          Estes termos são uma estrutura preliminar do ambiente de desenvolvimento e serão substituídos por
          versão jurídica definitiva antes da publicação.
        </p>
      </article>
    </main>
  );
}
