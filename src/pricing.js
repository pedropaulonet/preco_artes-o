// Money uses integer cents; percentages use basis points (100 bp = 1%).
export const MAX_VALUE = 1_000_000_000_000;
export const UNITS = Object.freeze({
  un: { family: 'count', factor: 1, label: 'unidade' },
  g: { family: 'mass', factor: 1, label: 'grama' },
  kg: { family: 'mass', factor: 1000, label: 'quilograma' },
  ml: { family: 'volume', factor: 1, label: 'mililitro' },
  l: { family: 'volume', factor: 1000, label: 'litro' },
  cm: { family: 'length', factor: 1, label: 'centímetro' },
  m: { family: 'length', factor: 100, label: 'metro' },
});

export function integer(value, label, min = 0, max = MAX_VALUE) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${label}: informe um valor válido entre ${min} e ${max}.`);
  }
  return value;
}

export function parseDecimal(value, digits = 2) {
  integer(digits, 'Casas decimais', 0, 6);
  const text = String(value).trim().replace(',', '.');
  const pattern = digits === 0 ? /^\d+$/ : new RegExp(`^\\d+(?:\\.\\d{1,${digits}})?$`);
  if (text.length > 30 || !pattern.test(text)) {
    throw new Error(`Informe um número positivo com até ${digits} casas decimais.`);
  }
  const [whole, fraction = ''] = text.split('.');
  return integer(Number(BigInt(whole) * 10n ** BigInt(digits) + BigInt(fraction.padEnd(digits, '0'))), 'Valor');
}

function ceilDivide(numerator, denominator) {
  if (denominator <= 0n) throw new Error('O divisor precisa ser maior que zero.');
  const result = (numerator + denominator - 1n) / denominator;
  return integer(Number(result), 'Resultado');
}

export function materialCost(material, item) {
  const bought = UNITS[material.unit];
  const used = UNITS[item.unit];
  if (!bought || !used || bought.family !== used.family) throw new Error('Unidades de medida incompatíveis.');
  integer(material.costCents, 'Custo do insumo');
  integer(material.quantityMilli, 'Quantidade comprada', 1);
  integer(item.quantityMilli, 'Quantidade utilizada', 1);
  integer(material.lossBp, 'Perda', 0, 9999);
  return ceilDivide(
    BigInt(material.costCents) * BigInt(item.quantityMilli) * BigInt(used.factor) * 10000n,
    BigInt(material.quantityMilli) * BigInt(bought.factor) * BigInt(10000 - material.lossBp),
  );
}

export function calculatePrice(input, settings, materials = []) {
  for (const key of ['materialCents', 'laborMinutes', 'packagingCents', 'otherCents']) integer(input[key], key);
  integer(input.marginBp, 'Margem', 0, 9999);
  integer(input.feeBp, 'Taxas', 0, 9999);
  integer(settings.monthlyPayCents, 'Remuneração');
  integer(settings.productiveMinutes, 'Minutos produtivos', 1);
  integer(settings.monthlyUnits, 'Produção mensal', 1);
  integer(settings.monthlyOverheadCents, 'Despesas mensais');
  integer(settings.monthlyDASCents, 'DAS mensal');
  integer(settings.simulationTaxBp, 'Taxa hipotética', 0, 9999);
  if (!['none', 'mei', 'manual'].includes(settings.regime)) throw new Error('Modalidade tributária inválida.');
  const taxBp = settings.regime === 'manual' ? settings.simulationTaxBp : 0;
  const denominator = 10000 - input.marginBp - input.feeBp - taxBp;
  if (denominator <= 0) throw new Error('Margem, taxas e encargo hipotético devem somar menos de 100%.');
  let materialCents = input.materialCents;
  for (const item of input.items || []) {
    const material = materials.find(m => m.id === item.materialId);
    if (!material) throw new Error('Um insumo da composição não foi encontrado.');
    materialCents = integer(materialCents + materialCost(material, item), 'Total de materiais');
  }
  const laborCents = ceilDivide(BigInt(settings.monthlyPayCents) * BigInt(input.laborMinutes), BigInt(settings.productiveMinutes));
  const overheadCents = ceilDivide(BigInt(settings.monthlyOverheadCents), BigInt(settings.monthlyUnits));
  const dasCents = settings.regime === 'mei' ? ceilDivide(BigInt(settings.monthlyDASCents), BigInt(settings.monthlyUnits)) : 0;
  const costCents = integer(materialCents + laborCents + overheadCents + dasCents + input.packagingCents + input.otherCents, 'Custo unitário');
  // Round final price upward. Percentage amounts round down, keeping realized margin >= target.
  const priceCents = ceilDivide(BigInt(costCents) * 10000n, BigInt(denominator));
  const breakEvenCents = ceilDivide(BigInt(costCents) * 10000n, BigInt(10000 - input.feeBp - taxBp));
  const feeCents = Number(BigInt(priceCents) * BigInt(input.feeBp) / 10000n);
  const taxCents = Number(BigInt(priceCents) * BigInt(taxBp) / 10000n);
  return {
    materialCents, laborCents, overheadCents, dasCents, costCents, priceCents, breakEvenCents,
    feeCents, taxCents, profitCents: priceCents - costCents - feeCents - taxCents,
    denominator, taxBp,
  };
}
