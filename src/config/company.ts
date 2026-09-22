import { PRICING } from '@registreai/product-config';
/** Public business details confirmed by the owner on 2026-09-21. Never store secrets here. */
export const COMPANY = Object.freeze({
  brand: 'RegistreAi',
  legalName: 'Registreai Marcas e Patentes LTDA',
  cnpj: '59.197.668/0001-13',
  street: 'Rua Itapura, 975 - Vila Gomes Cardim',
  city: 'São Paulo - SP',
  postalCode: '03310-000',
  whatsapp: '5511920681100',
  phoneDisplay: '(11) 92068-1100',
  email: 'ola@registreai.com.br',
  website: 'https://registreai.com.br',
});

// A reviewed public destination: never depend on a missing build-time variable.
export const WHATSAPP_URL = `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent('Oi, Reg. Quero conhecer os planos para registrar minha marca.')}`;
export const CTA_LABEL = 'Falar com a Reg';
export const LEGAL_UPDATED = '21 de setembro de 2026';
export const LEGAL_VERSION = '2026-09-21';
export const PLANS = Object.freeze({
  protection: { setup: PRICING.protection.setupDisplay, monthly: PRICING.protection.monthlyDisplay },
  unlimited: { setup: PRICING.unlimited.setupDisplay, monthly: PRICING.unlimited.monthlyDisplay },
});
