import RegMascot from '../brand/RegMascot';
import { SiteFooter, WhatsAppButton } from '../components/Business';
import { COMPANY, PLANS } from '../config/company';

const steps = [
  ['01', 'Você conversa', 'Conta sua ideia e escolhe o plano.'],
  ['02', 'A Reg analisa', 'Após contratação e pagamento, pesquisa a viabilidade.'],
  ['03', 'O pedido é preparado', 'Você confirma os dados e paga a taxa do INPI.'],
  ['04', 'A Reg acompanha', 'Protocolo no seu nome, atualizações e prazos.'],
];
const faqs = [
  ['É golpe?', `A responsável é ${COMPANY.legalName}, CNPJ ${COMPANY.cnpj}. Os dados e canais oficiais estão no rodapé.`],
  ['A IA erra?', 'Sim, IA pode errar. A Reg usa validações e pede confirmação quando necessário. Quem decide sobre o registro é o INPI.'],
  ['E se o INPI negar?', 'Você recebe a decisão e as opções aplicáveis ao seu plano. Viabilidade favorável não é garantia de registro.'],
  ['Preciso ter CNPJ?', 'Não. Pode ser CPF ou CNPJ, desde que o titular atenda aos requisitos do INPI para a atividade da marca.'],
  ['Posso cancelar quando quiser?', 'Sim, sem multa de fidelidade. O pedido já protocolado continua no seu nome; o acompanhamento termina conforme os Termos.'],
  ['Quanto tempo demora?', 'Preparação em até 48h após dados, documentos, confirmações e pagamentos necessários. O prazo de decisão depende do INPI.'],
];

function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const top = id === 'top' ? 0 : Math.max(0, target.getBoundingClientRect().top + window.scrollY - 24);
  target.focus({ preventScroll: true });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
}

export default function LandingV2() {
  return (
    <main className="site-shell">
      <header className="topbar wrap">
        <button type="button" className="brand brand-button" aria-label="Voltar ao início" onClick={() => scrollToSection('top')}>
          <RegMascot size={38} className="brand-mascot" /><span>RegistreAi</span>
        </button>
        <nav className="desktop-nav" aria-label="Navegação principal">
          <button type="button" aria-controls="como-funciona" onClick={() => scrollToSection('como-funciona')}>Como funciona</button>
          <button type="button" aria-controls="planos" onClick={() => scrollToSection('planos')}>Planos</button>
          <button type="button" aria-controls="duvidas" onClick={() => scrollToSection('duvidas')}>Dúvidas</button>
        </nav>
        <WhatsAppButton />
      </header>

      <section id="top" tabIndex={-1} className="hero wrap">
        <div className="hero-copy">
          <p className="hero-badge">Registro de marcas nada convencional.</p>
          <h1>Você manda uma mensagem. <span>A Reg cuida de tudo.</span></h1>
          <p className="hero-subtitle">Registro de marca no INPI, pelo WhatsApp, com a Reg: sua assistente de IA.</p>
          <WhatsAppButton />
          <p className="microcopy">Atendimento online · No seu nome · Sem fidelidade</p>
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
                <div><strong>Reg</strong><small>Conversa ilustrativa</small></div>
              </div>
              <div className="chat-body">
                <div className="bubble outgoing">Quero registrar minha marca.</div>
                <div className="bubble incoming">Oi! Qual é o nome da sua marca?</div>
                <div className="bubble outgoing">Minha Marca</div>
                <div className="bubble incoming viability-bubble"><strong>✓ Viabilidade aprovada na análise.</strong><span>Cenário favorável, sem garantia de deferimento.</span></div>
                <div className="chat-milestone">Após documentos, confirmação e taxas</div>
                <div className="bubble incoming protocol-bubble"><strong>Pedido protocolado no INPI em seu nome.</strong><span>Agora acompanho as próximas etapas.</span><span className="demo-process-number">Processo: 000.000.000<br /><small>Número fictício para demonstração.</small></span></div>
              </div>
              <div className="chat-input" aria-hidden="true"><span>Mensagem…</span><span className="chat-send">↗</span></div>
            </div>
          </div>
          <div className="phone-caption">
            <div className="whatsapp-note"><svg viewBox="0 0 42 48" aria-hidden="true"><path d="M34 42C15 39 8 25 14 7" /><path d="m5 13 10-9 5 13" /></svg><span>Tudo pelo seu WhatsApp</span></div>
            <p className="demo-disclaimer">Exemplo ilustrativo, sem processo real. A análise começa após contratação e pagamento.</p>
          </div>
        </div>
      </section>

      <section className="trust-band" aria-labelledby="trust-title">
        <div className="wrap">
          <div className="trust-heading"><p className="eyebrow">TRANSPARÊNCIA</p><h2 id="trust-title">A empresa tem nome. A marca fica no seu.</h2></div>
          <div className="trust-grid">
            <article className="trust-card"><h3>Empresa identificada</h3><p>{COMPANY.legalName}<br />CNPJ {COMPANY.cnpj}</p></article>
            <article className="trust-card"><h3>Endereço e contato reais</h3><p>{COMPANY.street}<br />{COMPANY.city} · CEP {COMPANY.postalCode}</p></article>
            <article className="trust-card"><h3>O pedido continua seu</h3><p>O protocolo é vinculado ao titular, não à RegistreAi. Cancelar o serviço não muda essa titularidade.</p></article>
          </div>
        </div>
      </section>

      <section id="como-funciona" tabIndex={-1} className="steps-band" aria-label="Como funciona">
        <div className="wrap steps-grid">{steps.map(([number, title, text]) => <article className="step-card" key={number}><div className="step-number">{number}</div><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>
      <section className="intro-band">
        <div className="wrap intro-grid"><div><p className="eyebrow">QUEM SOMOS</p><h2>Menos burocracia. Mais clareza.</h2><p>A RegistreAi cuida da preparação e do acompanhamento de marcas. Você conversa com a Reg, nossa assistente de IA, pelo WhatsApp.</p></div><div className="manifesto"><span>Seu negócio em primeiro lugar.</span><span>A decisão final é sempre do INPI.</span></div></div>
      </section>

      <section className="section wrap comparison-section" aria-labelledby="comparison-title">
        <div className="section-heading"><div><p className="eyebrow">CADA ETAPA CONTA</p><h2 id="comparison-title">Evite retrabalho no registro.</h2></div><p>Você pode pedir diretamente ao INPI. Com a Reg, conta com apoio para preparar e acompanhar.</p></div>
        <div className="comparison-grid">
          <article className="comparison-card"><p className="plan-kicker">POR CONTA PRÓPRIA</p><h3>Você cuida de cada detalhe.</h3><ul><li>Pesquisar marcas anteriores</li><li>Definir classe e especificação</li><li>Preparar documentos e pedido</li><li>Acompanhar publicações e prazos</li></ul></article>
          <article className="comparison-card"><p className="plan-kicker">COM A REG</p><h3>Uma jornada acompanhada.</h3><ul><li>Busca de viabilidade após pagamento</li><li>Orientação sobre a classe</li><li>Preparação e protocolo autorizado</li><li>Atualizações durante o plano ativo</li></ul><p className="comparison-price">Proteção: <strong>R$ {PLANS.protection.setup}</strong> + <strong>R$ {PLANS.protection.monthly}/mês</strong>. Taxas do INPI à parte.</p></article>
        </div>
      </section>

      <section id="planos" tabIndex={-1} className="section wrap plans-section">
        <div className="section-heading"><div><p className="eyebrow">PLANOS SIMPLES E TRANSPARENTES</p><h2>Escolha o seu.</h2></div><p>Honorários da RegistreAi. Taxas oficiais do INPI pagas separadamente.</p></div>
        <div className="plans-grid">
          <article className="plan-card recommended" data-plan="protection">
            <div className="plan-heading"><p className="plan-kicker">PARA UMA MARCA</p><span className="plan-badge">MAIS POPULAR</span></div><h3>Proteção</h3>
            <p className="plan-description">Uma marca, do início ao acompanhamento.</p>
            <div className="price"><div className="price-setup"><strong>R$ {PLANS.protection.setup}</strong><span>de adesão</span></div><div className="price-monthly"><strong>+ R$ {PLANS.protection.monthly}</strong><span>/mês</span></div></div>
            <ul><li>1 marca por assinatura</li><li>Adesão: viabilidade + protocolo</li><li>Busca após contratação/pagamento</li><li>Monitoramento e alertas no plano ativo</li><li>Sem fidelidade</li></ul><WhatsAppButton />
          </article>
          <article className="plan-card secondary" data-plan="unlimited">
            <div className="plan-heading"><p className="plan-kicker">MESMO TITULAR</p><span className="plan-badge">VÁRIAS MARCAS</span></div><h3>Ilimitado</h3>
            <p className="plan-description">Novos pedidos para um único CPF ou CNPJ.</p>
            <div className="price"><div className="price-setup"><strong>R$ {PLANS.unlimited.setup}</strong><span>de adesão</span></div><div className="price-monthly"><strong>+ R$ {PLANS.unlimited.monthly}</strong><span>/mês</span></div></div>
            <ul><li>Honorários de registros ilimitados</li><li>Mesmo CPF ou CNPJ titular</li><li>Sem carência — cancele quando quiser</li><li>Não permite registros para terceiros</li><li>Taxas oficiais do INPI à parte</li></ul><WhatsAppButton />
          </article>
        </div>
      </section>

      <section id="duvidas" tabIndex={-1} className="faq-section"><div className="wrap faq-grid"><div><p className="eyebrow">DÚVIDAS</p><h2>O essencial, sem complicação.</h2></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></section>
      <section className="promise"><div className="wrap promise-inner"><h2>Pronto para falar com a Reg?</h2><p>Sua marca, do seu jeito. Pelo WhatsApp.</p><WhatsAppButton /></div></section>
      <SiteFooter />
    </main>
  );
}
