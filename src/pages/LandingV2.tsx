import { Link } from "react-router-dom";
import RegMascot from "../brand/RegMascot";

const whatsAppNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || "").replace(/\D/g, "");
const whatsAppReady = /^\d{8,15}$/.test(whatsAppNumber);
const whatsAppUrl = `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent("Oi, Reg. Quero registrar minha marca.")}`;

const steps = [
  ["01", "Você conversa", "Fala com a Reg no seu WhatsApp."],
  ["02", "A Reg analisa", "Consulta a viabilidade e organiza o próximo passo."],
  ["03", "A Reg prepara", "Cuida da documentação e deixa o pedido pronto para o protocolo."],
  ["04", "A Reg acompanha", "Monitora o INPI e avisa quando precisar de algo seu."],
];
const faqs = [
  ["É golpe?", "CNPJ ativo, endereço real e a marca fica no seu nome no INPI. Se a RegistreAi deixar de existir, o processo continua sendo seu."],
  ["A IA erra?", "A Reg faz a análise e os pontos críticos são revisados. Ela nunca promete resultado: quem decide é o INPI."],
  ["E se o INPI negar?", "Antes do protocolo, a Reg faz a busca de viabilidade e apresenta o cenário para você decidir com informação."],
  ["Preciso ter CNPJ?", "Não. Você pode registrar em CPF ou CNPJ, conforme o titular da marca."],
  ["Posso cancelar quando quiser?", "Sim. Sem multa e sem fidelidade. O processo já protocolado no INPI continua sendo seu."],
  ["Quanto tempo demora?", "O protocolo é preparado em até 48h após as etapas necessárias. A decisão do INPI leva meses e a Reg acompanha cada etapa."],
];

function WhatsAppIcon() {
  return (
    <svg className="whatsapp-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20.5 11.6a8.5 8.5 0 0 1-12.7 7.5L3 20.5l1.4-4.6a8.5 8.5 0 1 1 16.1-4.3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m8.5 7.5 1.4 2.7-1 1c.8 1.6 2 2.8 3.7 3.6l1-1 2.8 1.3c-.3 1.3-1.2 2-2.5 1.8-3.6-.6-6.6-3.6-7.2-7.1-.2-1.1.4-2 1.8-2.3Z" fill="currentColor" />
    </svg>
  );
}

function WhatsAppButton({ label = "Falar com a Reg no WhatsApp" }: { label?: string }) {
  const content = <><WhatsAppIcon /><span>{label}</span><span aria-hidden="true">→</span></>;
  if (!whatsAppReady) {
    return <button type="button" className="primary-cta is-disabled" disabled aria-describedby="whatsapp-availability" title="WhatsApp em configuração. Atendimento ainda não ativado.">{content}</button>;
  }
  return <a className="primary-cta" href={whatsAppUrl} target="_blank" rel="noopener noreferrer">{content}</a>;
}

function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const top = id === "top" ? 0 : Math.max(0, target.getBoundingClientRect().top + window.scrollY - 24);
  target.focus({ preventScroll: true });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
}

export default function LandingV2() {
  return (
    <main className="site-shell">
      <header className="topbar wrap">
        <button type="button" className="brand brand-button" aria-label="Voltar ao início" onClick={() => scrollToSection("top")}>
          <RegMascot size={38} className="brand-mascot" /><span>RegistreAi</span>
        </button>
        <nav className="desktop-nav" aria-label="Navegação principal">
          <button type="button" aria-controls="como-funciona" onClick={() => scrollToSection("como-funciona")}>Como funciona</button>
          <button type="button" aria-controls="planos" onClick={() => scrollToSection("planos")}>Planos</button>
          <button type="button" aria-controls="duvidas" onClick={() => scrollToSection("duvidas")}>Dúvidas</button>
        </nav>
        <WhatsAppButton label="Falar com a Reg" />
      </header>

      <section id="top" tabIndex={-1} className="hero wrap">
        <div className="hero-copy">
          <p className="hero-badge">Registro de marcas nada convencional.</p>
          <h1>A IA que registra sua marca.</h1>
          <p className="hero-subtitle">Você manda uma mensagem. A Reg pesquisa, prepara, acompanha e cuida do processo do início ao fim.</p>
          <WhatsAppButton />
          <p className="microcopy">Atendimento 100% online, rápido e seguro.</p>
          {!whatsAppReady && <p id="whatsapp-availability" className="availability-note">WhatsApp em configuração. Este site ainda está em testes.</p>}
        </div>

        <div className="phone-stage" role="group" aria-label="Exemplo ilustrativo de conversa com a Reg">
          <div className="mascot-cluster">
            <div className="mascot-message">Oi,<br />eu sou a Reg!</div>
            <svg className="mascot-arrow" viewBox="0 0 120 54" aria-hidden="true"><path d="M9 8c27 0 53 9 73 30" /><path d="m70 36 15 5-1-14" /></svg>
            <RegMascot size={218} className="hero-mascot" />
          </div>
          <div className="phone phone-hero">
            <div className="phone-speaker" aria-hidden="true" />
            <div className="phone-screen">
              <div className="chat-head">
                <span className="chat-avatar"><RegMascot size={27} /></span>
                <div><strong>Reg</strong><small>online</small></div>
              </div>
              <div className="chat-body">
                <div className="bubble outgoing">Quero registrar minha marca.</div>
                <div className="bubble incoming">Perfeito! 👋 Vou cuidar de tudo por você do início ao fim. Me diz qual é o nome da sua marca?</div>
                <div className="bubble outgoing">RegistreAi</div>
                <div className="bubble incoming">Perfeito. Quando eu precisar de algo seu, eu peço. O restante é comigo.</div>
              </div>
              <div className="chat-input" aria-hidden="true"><span>Mensagem...</span><span className="chat-send">↗</span></div>
            </div>
          </div>
          {/* A separate grid row reserves space even after the phone is rotated. */}
          <div className="whatsapp-note">
            <svg viewBox="0 0 42 48" aria-hidden="true"><path d="M34 42C15 39 8 25 14 7" /><path d="m5 13 10-9 5 13" /></svg>
            <span>Tudo pelo<br />seu WhatsApp</span>
          </div>
        </div>
      </section>

      <section className="trust-band" aria-labelledby="trust-title">
        <div className="wrap">
          <div className="trust-heading">
            <p className="eyebrow">TRANSPARÊNCIA</p>
            <h2 id="trust-title">Sim, é de verdade. E a marca fica no seu nome.</h2>
          </div>
          <div className="trust-grid">
            <article className="trust-card"><span className="trust-index">01</span><h3>CNPJ ativo e endereço real</h3><p>A RegistreAi opera com CNPJ ativo e endereço físico em São Paulo.</p></article>
            <article className="trust-card"><span className="trust-index">02</span><h3>Pedido no nome do cliente</h3><p>O pedido é protocolado no INPI em nome do próprio titular da marca.</p></article>
            <article className="trust-card"><span className="trust-index">03</span><h3>O processo continua sendo seu</h3><p>Mesmo se a RegistreAi deixar de existir, o processo protocolado no INPI continua vinculado ao titular.</p></article>
          </div>
        </div>
      </section>

      <section id="como-funciona" tabIndex={-1} className="steps-band" aria-label="Como funciona">
        <div className="wrap steps-grid">
          {steps.map(([number, title, text]) => <article className="step-card" key={number}><div className="step-number">{number}</div><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>
      <section className="intro-band">
        <div className="wrap intro-grid">
          <div><p className="eyebrow">SIMPLES ASSIM</p><h2>Quem é a RegistreAi</h2><p>A RegistreAi é uma operação especializada em registro de marcas conduzida pela Reg, uma inteligência artificial criada para cuidar do processo pelo WhatsApp.</p></div>
          <div className="manifesto"><span>MENOS BUROCRACIA.</span><span>MAIS CLAREZA.</span><span>MAIS TEMPO PARA VOCÊ.</span></div>
        </div>
      </section>

      <section className="section wrap comparison-section" aria-labelledby="comparison-title">
        <div className="section-heading">
          <div><p className="eyebrow">ANTES DE ESCOLHER O PLANO</p><h2 id="comparison-title">Fazer sozinho sai caro.</h2></div>
          <p>Uma escolha errada no início pode virar exigência, atraso e nova taxa depois.</p>
        </div>
        <div className="comparison-grid">
          <article className="comparison-card">
            <p className="plan-kicker">SOZINHO NO INPI</p>
            <h3>Mais risco de retrabalho.</h3>
            <ul>
              <li>Escolher a classe errada</li>
              <li>Receber uma exigência</li>
              <li>Perder meses no processo</li>
              <li>Precisar pagar taxa novamente</li>
            </ul>
          </article>
          <article className="comparison-card">
            <p className="plan-kicker">COM A REG</p>
            <h3>Mais clareza do início ao acompanhamento.</h3>
            <ul>
              <li>Análise de viabilidade após a contratação</li>
              <li>Definição da classe aplicável ao pedido</li>
              <li>Preparação do protocolo em até 48h após as etapas necessárias</li>
              <li>Monitoramento do processo até a decisão do INPI</li>
            </ul>
            <p className="comparison-price">Proteção: <strong>R$ 197</strong> de adesão + <strong>R$ 49/mês</strong></p>
          </article>
        </div>
      </section>

      <section id="planos" tabIndex={-1} className="section wrap plans-section">
        <div className="section-heading"><div><p className="eyebrow">PLANOS SIMPLES E TRANSPARENTES</p><h2>Escolha o seu.</h2></div><p>As taxas oficiais do INPI são pagas separadamente quando aplicáveis.</p></div>
        <div className="plans-grid">
          <article className="plan-card">
            <div className="plan-heading"><p className="plan-kicker">PARA UMA MARCA</p><span className="plan-badge">MAIS POPULAR</span></div>
            <h3>Proteção</h3>
            <p className="plan-description">Para quem quer uma Reg cuidando de uma marca do início ao fim.</p>
            <div className="price"><div className="price-setup"><strong>R$ 197</strong><span>de adesão</span></div><div className="price-monthly"><strong>+ R$ 49</strong><span>/mês</span></div></div>
            <ul><li>1 marca, do início ao fim</li><li>Sem fidelidade</li><li>Busca de viabilidade após contratação/pagamento</li><li>Preparação do protocolo</li><li>Monitoramento do INPI e dos prazos</li></ul>
            <WhatsAppButton label="Quero o plano Proteção" />
          </article>
          <article className="plan-card featured">
            <div className="plan-heading"><p className="plan-kicker">MESMO TITULAR</p><span className="plan-badge">VÁRIAS MARCAS</span></div>
            <h3>Ilimitado</h3>
            <p className="plan-description">Honorários de novos registros ilimitados para o mesmo CPF ou CNPJ.</p>
            <div className="price"><div className="price-setup"><strong>R$ 497</strong><span>de adesão</span></div><div className="price-monthly"><strong>+ R$ 599</strong><span>/mês</span></div></div>
            <ul><li>Registros ilimitados em honorários</li><li>Mesmo CPF ou CNPJ titular</li><li>Sem carência — cancele quando quiser</li><li>Não permite registros para terceiros</li><li>Taxas oficiais do INPI à parte</li></ul>
            <WhatsAppButton label="Quero o plano Ilimitado" />
          </article>
        </div>
      </section>

      <section id="duvidas" tabIndex={-1} className="faq-section">
        <div className="wrap faq-grid">
          <div><p className="eyebrow">DÚVIDAS</p><h2>Antes de falar com a Reg.</h2><p className="faq-lead">O essencial para entender como funciona, sem complicação.</p></div>
          <div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
        </div>
      </section>
      <section className="promise">
        <div className="wrap promise-inner"><p className="eyebrow">PODE CONTAR COM A REG</p><h2>Quando precisarmos de algo seu, vamos pedir. O restante é com a Reg.</h2><p>Você cuida da sua empresa. A Reg cuida do processo.</p><WhatsAppButton label="Começar pelo WhatsApp" /></div>
      </section>
      <footer className="footer wrap">
        <div className="brand footer-brand"><RegMascot size={34} /><div><strong>RegistreAi</strong><small>A IA que registra sua marca.</small></div></div>
        <div className="footer-links"><Link to="/politica-de-privacidade">Política de Privacidade</Link><Link to="/termos-de-uso">Termos de Serviço</Link></div>
        <p className="footer-note">RegistreAi © 2026. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
