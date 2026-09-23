export type Plan = Readonly<{code:"PROTECAO"|"ILIMITADO";name:string;setupCents:number;monthlyCents:number;setupDisplay:string;monthlyDisplay:string;noLoyalty:boolean;noWaitingPeriod?:boolean}>;
export const PRICING: Readonly<{protection:Plan;unlimited:Plan}>;
export function pricingPromptLines(): string[];
