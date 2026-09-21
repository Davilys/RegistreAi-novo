import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import RegMascot from '../brand/RegMascot';
import { COMPANY, CTA_LABEL, LEGAL_UPDATED, WHATSAPP_URL } from '../config/company';

export function WhatsAppButton() {
  return (
    <a className="primary-cta" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label={CTA_LABEL}>
      <svg className="whatsapp-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20.5 11.6a8.5 8.5 0 0 1-12.7 7.5L3 20.5l1.4-4.6a8.5 8.5 0 1 1 16.1-4.3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="m8.5 7.5 1.4 2.7-1 1c.8 1.6 2 2.8 3.7 3.6l1-1 2.8 1.3c-.3 1.3-1.2 2-2.5 1.8-3.6-.6-6.6-3.6-7.2-7.1-.2-1.1.4-2 1.8-2.3Z" fill="currentColor" />
      </svg>
      <span>{CTA_LABEL}</span><span aria-hidden="true">→</span>
    </a>
  );
}

export function CompanyDetails() {
  return (
    <address className="company-details">
      <strong>{COMPANY.legalName}</strong>
      <span>CNPJ {COMPANY.cnpj}</span>
      <span>{COMPANY.street}</span>
      <span>{COMPANY.city} · CEP {COMPANY.postalCode}</span>
      <a href={`tel:+${COMPANY.whatsapp}`}>WhatsApp e telefone: {COMPANY.phoneDisplay}</a>
      <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
    </address>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer wrap">
      <div className="footer-identity">
        <Link className="brand footer-brand" to="/" aria-label="RegistreAi — início">
          <RegMascot size={34} /><div><strong>RegistreAi</strong><small>Registro de marcas pelo WhatsApp.</small></div>
        </Link>
        <p className="footer-note">© 2026 RegistreAi. Todos os direitos reservados.</p>
      </div>
      <CompanyDetails />
      <div className="footer-contact">
        <nav className="footer-links" aria-label="Informações legais">
          <Link to="/politica-de-privacidade">Política de Privacidade</Link>
          <Link to="/termos-de-uso">Termos de Serviço</Link>
        </nav>
        <WhatsAppButton />
        <p className="footer-note">Privacidade e dados pessoais: <a href={`mailto:${COMPANY.email}?subject=Privacidade%20e%20LGPD`}>{COMPANY.email}</a></p>
      </div>
    </footer>
  );
}

export function LegalLayout({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <>
      <main className="legal-page">
        <header className="legal-header wrap">
          <Link className="brand" to="/"><RegMascot size={40} /><span>RegistreAi</span></Link>
          <Link className="legal-back" to="/">← Voltar</Link>
        </header>
        <article className="legal-content">
          <p className="eyebrow">{eyebrow}</p><h1>{title}</h1>
          <p className="legal-updated">Atualizado em {LEGAL_UPDATED}.</p>
          {children}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
