import { Link } from "react-router-dom";
import RegMark from "../brand/RegMark";

const whatsAppNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || "").replace(/\D/g, "");
const whatsAppUrl = whatsAppNumber
  ? `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent("Oi, Reg. Quero registrar minha marca.")}`
  : "#";

const steps = [
  ["01", "Você chama a Reg", "Mande uma mensagem no WhatsApp e conte qual marca quer registrar."],
  ["02", "A Reg organiza tudo", "Ela coleta os dados, apresenta o plano e prepara sua contratação."],
  ["03", "A análise começa", "Após a confirmação do pagamento, a Reg faz a viabilidade e prepara o pedido."],
  ["04", "Ela continua cuidando", "A Reg acompanha o INPI, controla prazos e age quando houver novidade."],
];

function WhatsAppButton({ label = "Falar com a Reg no WhatsApp" }: { label?: string }) {
  const disabled = !whatsAppNumber;

  return (
    <a
      className={`primary-cta ${disabled ? "is-disabled" : ""}`}
      href={whatsAppUrl}
      target={disabled ? undefined : "_blank"}
      rel="noreferrer"
      aria-disabled={disabled}
      onClick={(event) => {
        if (disabled) event.preventDefault();
      }}
    >
      <span className="whatsapp-dot" aria-hidden="true">◉</span>
      <span>{label}</span>
      <span aria-hidden="true">→</span>
    </a>
  );
}

export default function LandingV2() {
  return (
    <main className="site-shell">
      <header className="topbar wrap">
        <a className="brand" href="#top" aria-label="RegistreAi">
          <RegMark size={42} />
          <span>RegistreAi</span>
        </a>

        <nav className="desktop-nav" aria-label="Navegação principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#planos">Planos</a>
          <Link to="/politica-de-privacidade">Privacidade</Link>
        </nav>

        <WhatsAppButton label="Falar no WhatsApp" />
      </header>

      <section id="top" className="hero wrap">
        <div className="hero-copy">
          <p className="eyebrow">REGISTRO DE MARCAS NADA CONVENCIONAL.</p>
          <h1>A IA que registra sua marca.</h1>
          <p className="hero-subtitle">
            Você manda uma mensagem. A Reg pesquisa, prepara, acompanha e cuida do processo.
          </p>
          <WhatsAppButton />
          <p className="microcopy">Sem painel complicado. Sem juridiquês. O WhatsApp é a interface.</p>
        </div>

        <div className="phone-stage" aria-label="Exemplo de conversa com a Reg">
          <div className="phone">
            <div className="phone-speaker" />
            <div className="phone-screen">
              <div className="chat-head">
                <span className="chat-avatar"><RegMark size={26} /></span>
                <div>
                  <strong>Reg</strong>
                  <small>online</small>
                </div>
              </div>

              <div className="chat-body">
                <div className="bubble outgoing">Oi, quero registrar minha marca.</div>
                <div className="bubble incoming">
                  Oi! Eu sou a Reg. Vou cuidar do seu registro do início ao fim. Qual é o nome da marca?
                </div>
                <div className="bubble outgoing">RegistreAi</div>
                <div className="bubble incoming">
                  Perfeito. A partir daqui, quando eu precisar de algo seu, eu peço. O restante é comigo.
                </div>
              </div>

              <div className="chat-input">Digite uma mensagem… <span>↗</span></div>
            </div>
          </div>

          <div className="side-note">
            <span>Do seu WhatsApp</span>
            <span>para o seu registro.</span>
          </div>
        </div>
      </section>

      <section className="intro-band">
        <div className="wrap intro-grid">
          <div>
            <p className="eyebrow">SIMPLES ASSIM</p>
            <h2>Quem é a RegistreAi</h2>
            <p>
              A RegistreAi é uma operação especializada em registro de marcas conduzida pela Reg,
              uma inteligência artificial criada para cuidar do processo pelo WhatsApp.
            </p>
          </div>
          <div className="manifesto">
            <span>MENOS BUROCRACIA.</span>
            <span>MAIS CLAREZA.</span>
            <span>MAIS TEMPO PARA VOCÊ.</span>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="section wrap">
        <p className="eyebrow">EM QUATRO PASSOS</p>
        <h2>Como funciona</h2>

        <div className="steps-grid">
          {steps.map(([number, title, text]) => (
            <article className="step-card" key={number}>
              <div className="step-number">{number}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="planos" className="section wrap plans-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ESCOLHA O SEU PLANO</p>
            <h2>Dois planos. Sem complicação.</h2>
          </div>
          <p>
            As taxas oficiais do INPI são pagas separadamente quando aplicáveis.
          </p>
        </div>

        <div className="plans-grid">
          <article className="plan-card">
            <div>
              <p className="plan-kicker">PARA UMA MARCA</p>
              <h3>Proteção</h3>
              <p className="plan-description">Para quem quer uma Reg cuidando de uma marca do início ao fim.</p>
            </div>

            <div className="price">
              <strong>R$ 299</strong>
              <span>de adesão</span>
              <b>+</b>
              <strong>R$ 49</strong>
              <span>/mês</span>
            </div>

            <ul>
              <li>Viabilidade após contratação</li>
              <li>Preparação e acompanhamento do pedido</li>
              <li>Monitoramento do INPI e dos prazos</li>
              <li>Recursos previstos nas condições do plano</li>
              <li>Garantia comercial conforme contrato</li>
            </ul>

            <WhatsAppButton label="Quero o plano Proteção" />
          </article>

          <article className="plan-card featured">
            <div className="plan-badge">PARA QUEM TEM VÁRIAS MARCAS</div>
            <div>
              <p className="plan-kicker">MESMO TITULAR</p>
              <h3>Ilimitado</h3>
              <p className="plan-description">Honorários de novos registros ilimitados para o mesmo CPF ou CNPJ.</p>
            </div>

            <div className="price">
              <strong>R$ 999</strong>
              <span>de adesão</span>
              <b>+</b>
              <strong>R$ 599</strong>
              <span>/mês</span>
            </div>

            <ul>
              <li>Registros ilimitados em honorários</li>
              <li>Um único CPF ou CNPJ titular por plano</li>
              <li>Não permite registros para terceiros</li>
              <li>Acompanhamento e recursos previstos no plano</li>
              <li>Taxas oficiais do INPI à parte</li>
            </ul>

            <WhatsAppButton label="Quero o plano Ilimitado" />
          </article>
        </div>
      </section>

      <section className="promise">
        <div className="wrap promise-inner">
          <p className="eyebrow">PODE CONTAR COM A REG</p>
          <h2>Quando precisarmos de algo seu, vamos pedir. O restante é com a Reg.</h2>
          <p>Você cuida da sua empresa. A Reg cuida do processo.</p>
          <WhatsAppButton label="Começar pelo WhatsApp" />
        </div>
      </section>

      <footer className="footer wrap">
        <div className="brand footer-brand">
          <RegMark size={36} />
          <div>
            <strong>RegistreAi</strong>
            <small>Registro de marcas nada convencional.</small>
          </div>
        </div>

        <div className="footer-links">
          <Link to="/politica-de-privacidade">Política de Privacidade</Link>
          <Link to="/termos-de-uso">Termos de Serviço</Link>
        </div>

        <p className="footer-note">Feito no Brasil para simplificar o registro de marcas.</p>
      </footer>
    </main>
  );
}
