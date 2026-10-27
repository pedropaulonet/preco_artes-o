import { integer, UNITS } from './pricing.js';

export const SCHEMA_VERSION = 1;
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
function utf8Length(text) {
  let bytes = 0;
  for (const character of text) {
    const point = character.codePointAt(0);
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
  }
  return bytes;
}
export function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      shopName: 'Meu ateliê', monthlyPayCents: 240000, productiveMinutes: 7200,
      monthlyOverheadCents: 0, monthlyDASCents: 0, monthlyUnits: 100,
      defaultMarginBp: 2500, defaultFeeBp: 0, regime: 'none', simulationTaxBp: 0,
    },
    materials: [], products: [],
  };
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}: estrutura inválida.`);
}
function text(value, label, max = 120, empty = false) {
  if (typeof value !== 'string' || value.length > max || (!empty && !value.trim())) throw new Error(`${label}: texto inválido.`);
  return value;
}
function id(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(value)) throw new Error('Identificador inválido.');
  return value;
}
function unit(value) {
  if (!Object.hasOwn(UNITS, value)) throw new Error('Unidade de medida inválida.');
  return value;
}
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error('Data inválida.');
  return value;
}
function collection(value, label, map) {
  if (!Array.isArray(value) || value.length > 10000) throw new Error(`${label}: limite de 10.000 registros.`);
  const result = value.map(map);
  if (new Set(result.map(item => item.id)).size !== result.length) throw new Error(`${label}: identificadores duplicados.`);
  return result;
}

export function validateState(value) {
  object(value, 'Dados');
  if (value.schemaVersion !== SCHEMA_VERSION) throw new Error('Versão dos dados não suportada.');
  const s = value.settings;
  object(s, 'Configurações');
  if (!['none', 'mei', 'manual'].includes(s.regime)) throw new Error('Modalidade tributária inválida.');
  const settings = {
    shopName: text(s.shopName, 'Nome da loja'),
    monthlyPayCents: integer(s.monthlyPayCents, 'Remuneração'),
    productiveMinutes: integer(s.productiveMinutes, 'Minutos produtivos', 1),
    monthlyOverheadCents: integer(s.monthlyOverheadCents, 'Despesas'),
    monthlyDASCents: integer(s.monthlyDASCents, 'DAS'),
    monthlyUnits: integer(s.monthlyUnits, 'Unidades mensais', 1),
    defaultMarginBp: integer(s.defaultMarginBp, 'Margem padrão', 0, 9999),
    defaultFeeBp: integer(s.defaultFeeBp, 'Taxas padrão', 0, 9999),
    regime: s.regime,
    simulationTaxBp: integer(s.simulationTaxBp, 'Encargo hipotético', 0, 9999),
  };
  if (settings.defaultMarginBp + settings.defaultFeeBp + (settings.regime === 'manual' ? settings.simulationTaxBp : 0) >= 10000) throw new Error('Percentuais padrão devem somar menos de 100%.');
  const materials = collection(value.materials, 'Insumos', m => {
    object(m, 'Insumo');
    return {
      id: id(m.id), name: text(m.name, 'Nome do insumo'), unit: unit(m.unit),
      quantityMilli: integer(m.quantityMilli, 'Quantidade', 1), costCents: integer(m.costCents, 'Custo'),
      lossBp: integer(m.lossBp, 'Perda', 0, 9999),
    };
  });
  const products = collection(value.products, 'Produtos', p => {
    object(p, 'Produto');
    if (!Array.isArray(p.items) || p.items.length > 100) throw new Error('Composição inválida: máximo de 100 insumos.');
    const result = {
      id: id(p.id), name: text(p.name, 'Nome do produto'), sku: text(p.sku, 'SKU', 60, true),
      materialCents: integer(p.materialCents, 'Materiais avulsos'), laborMinutes: integer(p.laborMinutes, 'Tempo'),
      packagingCents: integer(p.packagingCents, 'Embalagem'), otherCents: integer(p.otherCents, 'Outros custos'),
      marginBp: integer(p.marginBp, 'Margem', 0, 9999), feeBp: integer(p.feeBp, 'Taxas', 0, 9999),
      items: p.items.map(item => {
        object(item, 'Item');
        return { materialId: id(item.materialId), quantityMilli: integer(item.quantityMilli, 'Consumo', 1), unit: unit(item.unit) };
      }),
      savedPriceCents: integer(p.savedPriceCents, 'Preço salvo'), updatedAt: date(p.updatedAt),
    };
    // Validate references and dimensional conversions, without making products
    // impossible to restore when later settings make their margins infeasible.
    for (const item of result.items) {
      const material = materials.find(m => m.id === item.materialId);
      if (!material || UNITS[material.unit].family !== UNITS[item.unit].family) throw new Error('Composição contém insumo ausente ou unidade incompatível.');
    }
    return result;
  });
  const result = { schemaVersion: SCHEMA_VERSION, settings, materials, products };
  // Reserve room for the backup envelope so every stored state is restorable.
  if (utf8Length(JSON.stringify(result)) > MAX_BACKUP_BYTES - 512) {
    throw new Error('O ateliê atingiu o limite de 5 MB para backups. Exporte os dados atuais antes de reduzir os cadastros.');
  }
  return result;
}

export function createBackup(state) {
  return { app: 'preco-artesao', schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data: validateState(state) };
}
export function validateBackup(value) {
  object(value, 'Backup');
  if (value.app !== 'preco-artesao' || value.schemaVersion !== SCHEMA_VERSION) throw new Error('Arquivo não pertence ao Preço Artesão ou possui versão incompatível.');
  date(value.exportedAt);
  return validateState(value.data);
}
export function mergeStates(current, incoming) {
  const byId = (a, b) => [...new Map([...a, ...b].map(row => [row.id, row])).values()];
  return validateState({
    ...current, materials: byId(current.materials, incoming.materials), products: byId(current.products, incoming.products),
  });
}
