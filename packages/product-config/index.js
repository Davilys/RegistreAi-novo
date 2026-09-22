export const PRICING = Object.freeze({
  protection: Object.freeze({ code: "PROTECAO", name: "Proteção", setupCents: 19700, monthlyCents: 4900, setupDisplay: "197", monthlyDisplay: "49", noLoyalty: true }),
  unlimited: Object.freeze({ code: "ILIMITADO", name: "Ilimitado", setupCents: 49700, monthlyCents: 59900, setupDisplay: "497", monthlyDisplay: "599", noWaitingPeriod: true, noLoyalty: true })
});
export const pricingPromptLines = () => [
  `${PRICING.protection.name}: R$${PRICING.protection.setupDisplay} de adesão + R$${PRICING.protection.monthlyDisplay}/mês, sem fidelidade.`,
  `${PRICING.unlimited.name}: R$${PRICING.unlimited.setupDisplay} de adesão + R$${PRICING.unlimited.monthlyDisplay}/mês, sem carência e sem fidelidade, com honorários de registros ilimitados para o mesmo CPF ou CNPJ titular.`
];
