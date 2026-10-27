const results = [];
const list = typeof document === 'undefined' ? null : document.querySelector('#results');
function equal(actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw Error(`Esperado ${JSON.stringify(expected)}, recebido ${JSON.stringify(actual)}`);
}
function throws(fn) {
  let failed = false;
  try { fn(); } catch { failed = true; }
  if (!failed) throw Error('Deveria rejeitar a entrada');
}
async function test(name, fn) {
  try { await fn(); results.push({ name, passed: true }); }
  catch (e) { results.push({ name, passed: false, error: e.message }); }
  if (!list) return;
  const item = document.createElement('li');
  const last = results.at(-1);
  item.className = last.passed ? 'pass' : 'fail';
  item.textContent = `${last.passed ? '✓' : '✗'} ${name}${last.error ? ` — ${last.error}` : ''}`;
  list.append(item);
}
try {
  const { calculatePrice, parseDecimal, materialCost } = await import('../src/pricing.js');
  const { defaultState, createBackup, validateBackup, mergeStates } = await import('../src/model.js');
  const settings = () => ({ ...defaultState().settings, monthlyPayCents: 240000, productiveMinutes: 7200, monthlyOverheadCents: 0, monthlyDASCents: 0, monthlyUnits: 100, regime: 'none' });
  const product = (overrides = {}) => ({ id: 'test-product', name: 'Vela', sku: '', materialCents: 1800, laborMinutes: 0, packagingCents: 0, otherCents: 0, marginBp: 0, feeBp: 0, items: [], savedPriceCents: 0, updatedAt: '2026-10-27T12:00:00.000Z', ...overrides });
  await test('quantidades inteiras são lidas sem casas decimais', () => equal(parseDecimal('45', 0), 45));
  await test('quantidades inteiras rejeitam casas decimais', () => throws(() => parseDecimal('45.2', 0)));
  await test('decimal em reais é convertido em centavos exatos', () => equal(parseDecimal('56,06', 2), 5606));
  await test('não aceita dinheiro com precisão maior que centavos', () => throws(() => parseDecimal('1.005', 2)));
  await test('não aceita sinal negativo ou notação exponencial', () => { throws(() => parseDecimal('-1', 2)); throws(() => parseDecimal('1e8', 2)); });
  await test('não aceita número acima do limite seguro', () => throws(() => parseDecimal('9007199254740993', 2)));
  await test('mão de obra: 45 minutos a R$20 por hora custa R$15', () => equal(calculatePrice(product({ laborMinutes: 45, materialCents: 0 }), settings()).laborCents, 1500));
  await test('preço arredonda para cima para garantir a margem de 25%', () => {
    const result = calculatePrice(product({ materialCents: 3700, feeBp: 500, marginBp: 2500 }), { ...settings(), regime: 'manual', simulationTaxBp: 400 });
    equal(result.priceCents, 5607); equal(result.breakEvenCents, 4066);
    if (result.profitCents * 10000 < result.priceCents * 2500) throw Error('Margem inferior ao alvo');
  });
  await test('margem de 25% difere de markup de 25%', () => equal(calculatePrice(product({ materialCents: 3000, marginBp: 2500 }), settings()).priceCents, 4000));
  await test('MEI rateia DAS sem imposto percentual fictício', () => {
    const r = calculatePrice(product({ materialCents: 1000 }), { ...settings(), regime: 'mei', monthlyDASCents: 8000, simulationTaxBp: 5000 });
    equal(r.dasCents, 80); equal(r.taxCents, 0); equal(r.priceCents, 1080);
  });
  await test('despesas mensais são rateadas por unidades', () => equal(calculatePrice(product(), { ...settings(), monthlyOverheadCents: 10000 }).overheadCents, 100));
  await test('soma de percentuais igual ou maior que 100% é bloqueada', () => throws(() => calculatePrice(product({ marginBp: 9500, feeBp: 500 }), settings())));
  await test('percentual fracionário interno não é aceito', () => throws(() => calculatePrice(product({ marginBp: 1.2 }), settings())));
  await test('zero horas produtivas é bloqueado', () => throws(() => calculatePrice(product(), { ...settings(), productiveMinutes: 0 })));
  await test('150g de um quilo de cera de R$40 custa R$6', () => equal(materialCost({ costCents: 4000, quantityMilli: 1000, unit: 'kg', lossBp: 0 }, { quantityMilli: 150000, unit: 'g' }), 600));
  await test('perda de 20% aumenta consumo de R$8 para R$10', () => equal(materialCost({ costCents: 800, quantityMilli: 1000, unit: 'un', lossBp: 2000 }, { quantityMilli: 1000, unit: 'un' }), 1000));
  await test('unidades incompatíveis são rejeitadas', () => throws(() => materialCost({ costCents: 100, quantityMilli: 1000, unit: 'kg', lossBp: 0 }, { quantityMilli: 1000, unit: 'l' })));
  await test('alterar custo de insumo recalcula o produto', () => {
    const p = product({ materialCents: 0, items: [{ materialId: 'wax', quantityMilli: 150000, unit: 'g' }] });
    equal(calculatePrice(p, settings(), [{ id: 'wax', costCents: 5000, quantityMilli: 1000, unit: 'kg', lossBp: 0 }]).priceCents, 750);
  });
  await test('insumo ausente é rejeitado em vez de subestimar o preço', () => throws(() => calculatePrice(product({ items: [{ materialId: 'missing', quantityMilli: 1000, unit: 'un' }] }), settings())));
  await test('backup válido preserva produto e configurações', () => {
    const state = defaultState(); state.settings.shopName = 'Ateliê'; state.products.push(product());
    const restored = validateBackup(JSON.parse(JSON.stringify(createBackup(state))));
    equal(restored, state);
  });
  await test('backup de versão futura é rejeitado', () => throws(() => validateBackup({ ...createBackup(defaultState()), schemaVersion: 99 })));
  await test('backup com custos negativos é rejeitado', () => {
    const state = defaultState(); state.products.push(product({ materialCents: -1 }));
    throws(() => validateBackup({ app: 'preco-artesao', schemaVersion: 1, exportedAt: new Date().toISOString(), data: state }));
  });
  await test('IDs duplicados são rejeitados', () => {
    const state = defaultState(); state.products.push(product(), product());
    throws(() => validateBackup({ app: 'preco-artesao', schemaVersion: 1, exportedAt: new Date().toISOString(), data: state }));
  });
  await test('backup com referência quebrada é rejeitado', () => {
    const state = defaultState(); state.products.push(product({ items: [{ materialId: 'missing', quantityMilli: 1000, unit: 'g' }] }));
    throws(() => validateBackup({ app: 'preco-artesao', schemaVersion: 1, exportedAt: new Date().toISOString(), data: state }));
  });
  await test('nomes com HTML permanecem texto no contrato', () => {
    const state = defaultState(); state.settings.shopName = '<img src=x onerror=alert(1)>';
    equal(validateBackup(createBackup(state)).settings.shopName, '<img src=x onerror=alert(1)>');
  });
  await test('mesclar mantém configurações atuais e atualiza registros pelo ID', () => {
    const a = defaultState(); a.settings.shopName = 'Atual'; a.products.push(product());
    const b = defaultState(); b.settings.shopName = 'Backup'; b.products.push(product({ name: 'Atualizada' }), product({ id: 'second' }));
    const merged = mergeStates(a, b); equal(merged.settings.shopName, 'Atual'); equal(merged.products.length, 2); equal(merged.products[0].name, 'Atualizada');
  });
  await test('estado grande demais para backup restaurável é bloqueado antes de salvar', () => {
    const state = defaultState();
    state.materials.push({ id: 'wax', name: 'Cera', unit: 'g', quantityMilli: 1000, costCents: 100, lossBp: 0 });
    state.products = Array.from({ length: 1000 }, (_, index) => product({ id: `large-${index}`, items: Array.from({ length: 100 }, () => ({ materialId: 'wax', quantityMilli: 1000, unit: 'g' })) }));
    throws(() => createBackup(state));
  });
  await test('insumo extremo mantém uma descrição exibível sem derrubar a lista', async () => {
    const { materialUnitLabel } = await import('../src/ui.js');
    const m = { id: 'expensive', name: 'Extremo', costCents: 1000000000000, quantityMilli: 1, lossBp: 9999, unit: 'un' };
    const label = materialUnitLabel(m);
    if (typeof label !== 'string' || !label.length) throw Error('Descrição indisponível');
  });
  if (typeof indexedDB !== 'undefined') {
  const { openDatabase, loadState, saveState } = await import('../src/db.js');
  const db = await openDatabase(`artesao-test-${crypto.randomUUID()}`);
  await test('IndexedDB persiste e recupera configurações', async () => {
    const state = defaultState(); state.settings.shopName = 'Persistente'; await saveState(state, db);
    equal((await loadState(db)).settings.shopName, 'Persistente');
  });
  await test('restauração inválida preserva banco existente', async () => {
    const bad = defaultState(); bad.settings.monthlyUnits = 0;
    let rejected = false;
    try { await saveState(bad, db); } catch { rejected = true; }
    equal(rejected, true); equal((await loadState(db)).settings.shopName, 'Persistente');
  });
  await test('substituição válida persiste todo o estado', async () => {
    const state = defaultState(); state.products.push(product()); await saveState(state, db);
    equal((await loadState(db)).products[0].name, 'Vela');
  });
  await test('edição em outra aba é detectada sem sobrescrever dados recentes', async () => {
    const original = await loadState(db);
    const newer = { ...original, settings: { ...original.settings, shopName: 'Outra aba' } };
    await saveState(newer, db, original);
    let rejected = false;
    try { await saveState(original, db, original); } catch { rejected = true; }
    equal(rejected, true); equal((await loadState(db)).settings.shopName, 'Outra aba');
  });
  const dbName = db.name; db.close(); indexedDB.deleteDatabase(dbName);
  }
} catch (e) {
  await test('módulos da aplicação disponíveis', () => { throw e; });
}
const report = { skipped: typeof indexedDB === 'undefined' ? ['4 testes de IndexedDB: executar no navegador'] : [], passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length, tests: results };
if (typeof document !== 'undefined') {
  document.querySelector('#summary').textContent = `${report.passed} passaram; ${report.failed} falharam.`;
  window.testReport = report;
  if (location.protocol !== 'file:') await fetch('/__test_results', { method: 'POST', body: JSON.stringify(report) }).catch(() => {});
} else {
  print(JSON.stringify(report, null, 2));
  if (report.failed) imports.system.exit(1);
}
