import { config } from "./config.js";

export const NICE_CLASS_HEADINGS: Record<number, string> = {
  1: "Produtos químicos destinados à indústria, ciência, fotografia, agricultura, horticultura e silvicultura",
  2: "Tintas, vernizes, lacas, preservativos contra ferrugem e deterioração da madeira",
  3: "Preparações para branquear, limpar, polir, desengordurar e abrasivos; cosméticos e perfumaria",
  4: "Óleos e graxas industriais, lubrificantes, combustíveis e materiais de iluminação",
  5: "Preparações farmacêuticas, veterinárias e sanitárias para fins médicos",
  6: "Metais comuns e suas ligas, materiais de construção metálicos",
  7: "Máquinas e máquinas-ferramentas, motores e implementos agrícolas",
  8: "Ferramentas e instrumentos manuais, cutelaria e armas brancas",
  9: "Aparelhos e instrumentos científicos, elétricos e eletrônicos; software",
  10: "Aparelhos e instrumentos cirúrgicos, médicos, odontológicos e veterinários",
  11: "Aparelhos de iluminação, aquecimento, refrigeração, ventilação e instalações sanitárias",
  12: "Veículos e aparelhos de locomoção por terra, ar ou água",
  13: "Armas de fogo, munições e projéteis; explosivos e fogos de artifício",
  14: "Metais preciosos, joalheria, pedras preciosas, relojoaria e instrumentos cronométricos",
  15: "Instrumentos musicais",
  16: "Papel, papelão, impressos, artigos de papelaria e material de escritório",
  17: "Borracha, plásticos semiprocessados e materiais de isolamento",
  18: "Couro, imitações de couro, malas, bolsas, guarda-chuvas e artigos de selaria",
  19: "Materiais de construção não metálicos",
  20: "Móveis, espelhos, molduras e produtos de madeira, cortiça, junco e matérias similares",
  21: "Utensílios e recipientes domésticos ou de cozinha, pentes, esponjas, vidro e porcelana",
  22: "Cordas, redes, tendas, toldos, velas, sacos e matérias de enchimento",
  23: "Fios para uso têxtil",
  24: "Tecidos e seus substitutos; roupa de cama, mesa e banho",
  25: "Vestuário, calçados e chapelaria",
  26: "Rendas, bordados, fitas, botões, colchetes, agulhas e flores artificiais",
  27: "Tapetes, capachos, esteiras, linóleo e revestimentos de parede não têxteis",
  28: "Jogos, brinquedos, artigos de ginástica e esporte; decorações para árvores de Natal",
  29: "Carnes, peixes, aves, caça, frutas e legumes conservados; laticínios",
  30: "Café, chá, cacau, arroz, massas, farinhas, pães, confeitaria e condimentos",
  31: "Produtos agrícolas, aquícolas, hortícolas e florestais crus; animais vivos e alimentos para animais",
  32: "Cervejas e bebidas não alcoólicas; águas minerais; bebidas de frutas e xaropes",
  33: "Bebidas alcoólicas, exceto cervejas",
  34: "Tabaco e substitutos; cigarros, charutos e artigos para fumantes",
  35: "Publicidade, gestão, organização e administração de negócios; trabalhos de escritório",
  36: "Serviços financeiros, monetários, bancários, de seguros e imobiliários",
  37: "Serviços de construção, instalação e reparo",
  38: "Serviços de telecomunicações",
  39: "Transporte, embalagem, armazenagem de mercadorias e organização de viagens",
  40: "Tratamento de materiais; reciclagem; impressão; conservação de alimentos",
  41: "Educação, formação, entretenimento e atividades esportivas e culturais",
  42: "Serviços científicos e tecnológicos; pesquisa, design e desenvolvimento de software",
  43: "Serviços de fornecimento de alimentos e bebidas; alojamento temporário",
  44: "Serviços médicos, veterinários, higiene e beleza; agricultura, aquicultura e silvicultura",
  45: "Serviços jurídicos, de segurança e serviços pessoais e sociais"
};

type NiceSuggestion = {
  classes: Array<{
    nice_class: number;
    reason: string;
    primary: boolean;
  }>;
};

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    classes: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          nice_class: { type: "integer", minimum: 1, maximum: 45 },
          reason: { type: "string" },
          primary: { type: "boolean" }
        },
        required: ["nice_class","reason","primary"]
      }
    }
  },
  required: ["classes"]
} as const;

export async function suggestNiceClasses(activity: string): Promise<NiceSuggestion> {
  if (!config.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY_NOT_CONFIGURED");

  const headings = Object.entries(NICE_CLASS_HEADINGS)
    .map(([n, heading]) => n + ": " + heading)
    .join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: "Bearer " + config.OPENAI_API_KEY,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: config.OPENAI_MODEL_DEFAULT,
      store: false,
      instructions:
        "Você é um classificador de Nice para marcas no Brasil. " +
        "Escolha exatamente 3 classes plausíveis a partir da atividade informada. " +
        "Marque exatamente uma como primary=true. Não invente classes fora de 1 a 45.",
      input: "Atividade: " + activity + "\n\nClasses:\n" + headings,
      prompt_cache_key: "registreai:nice:v1",
      reasoning: { effort: "medium" },
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "nice_classes",
          strict: true,
          schema
        }
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error("OPENAI_NICE_HTTP_" + response.status + ":" + body.slice(0, 400));
  }

  const data = await response.json() as { output_text?: string };
  if (!data.output_text) throw new Error("OPENAI_NICE_EMPTY");

  const parsed = JSON.parse(data.output_text) as NiceSuggestion;
  const unique = new Set(parsed.classes.map((item) => item.nice_class));
  if (unique.size !== 3) throw new Error("OPENAI_NICE_DUPLICATE_CLASSES");
  if (parsed.classes.filter((item) => item.primary).length !== 1) {
    throw new Error("OPENAI_NICE_PRIMARY_INVALID");
  }

  return parsed;
}
