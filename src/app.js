import { calculatePrice, parseDecimal, UNITS } from './pricing.js';
import { defaultState, createBackup, validateBackup, validateState, mergeStates, MAX_BACKUP_BYTES } from './model.js';
import { loadState, saveState } from './db.js';
import { icon, escapeHTML as e, brl, percent, decimal, displayDate, field, unitOptions, empty, heading, tableButton, illustration, materialUnitLabel } from './ui.js';

const main = document.querySelector('#main');
const modal = document.querySelector('#modal');
const routes = [
  ['painel', 'Painel inicial', 'home'], ['calculadora', 'Calculadora rápida', 'calculator'],
  ['produtos', 'Produtos', 'box'], ['insumos', 'Materiais e insumos', 'leaf'],
  ['configuracoes', 'Configurações', 'settings'], ['backup', 'Backup e restauração', 'backup'], ['ajuda', 'Ajuda', 'help'],
];
let state, route = '', dirty = false, busy = false, draft = null, pendingBackup = null, toastTimer;
let backupDownloaded = false;
const uid = () => globalThis.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
const read = (form, name, digits = 2) => parseDecimal(form.elements[name].value, digits);
function notify(message, error = false) {
  const toast = document.querySelector('#toast');
  clearTimeout(toastTimer); toast.textContent = message; toast.classList.toggle('error', error); toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, error ? 11000 : 6500);
}
function fail(error) { notify(error.message || 'Não foi possível concluir a operação.', true); }
function status(text) { document.querySelector('#storage-status').textContent = text; }
function newProduct() {
  return { id: uid(), name: '', sku: '', materialCents: 0, laborMinutes: 0, packagingCents: 0, otherCents: 0, marginBp: state.settings.defaultMarginBp, feeBp: state.settings.defaultFeeBp, items: [], savedPriceCents: 0, updatedAt: new Date().toISOString() };
}
async function persist(next, message) {
  if (busy) throw new Error('Aguarde a conclusão do salvamento.');
  busy = true; status('Salvando neste navegador…');
  try {
    const valid = await saveState(next, undefined, state);
    state = valid; dirty = false; backupDownloaded = false;
    document.querySelector('#shop-label').textContent = state.settings.shopName;
    status('Salvo neste navegador');
    if (message) notify(`${message} Lembre-se de fazer backup.`);
  } catch (error) { status('Falha ao salvar · faça backup'); throw error; }
  finally { busy = false; }
}
function confirmDialog(title, description, label = 'Confirmar', danger = false) {
  return new Promise(resolve => {
    modal.innerHTML = `<h2 id="modal-title">${e(title)}</h2><p>${e(description)}</p><div class="notice">Antes de continuar, faça backup em JSON dos seus dados atuais.</div><div class="form-footer"><button class="button ${danger ? 'danger' : ''}" type="button" id="dialog-confirm">${e(label)}</button><button type="button" class="button secondary" id="dialog-cancel">Cancelar</button></div>`;
    const finish = result => { modal.close(); resolve(result); };
    modal.querySelector('#dialog-confirm').onclick = () => finish(true);
    modal.querySelector('#dialog-cancel').onclick = () => finish(false);
    modal.oncancel = event => { event.preventDefault(); finish(false); };
    modal.showModal();
  });
}
function navigate(target) {
  if (location.hash === `#${target}`) render();
  else location.hash = target;
}
function render() {
  if (!state) return;
  document.querySelector('#navigation').innerHTML = routes.map(([key, label, symbol]) => `<a href="#${key}"${key === route ? ' aria-current="page"' : ''}>${icon(symbol)}${label}</a>`).join('');
  const views = { painel: dashboard, calculadora: calculator, produtos: products, insumos: materials, configuracoes: settings, backup: backup, ajuda: help };
  main.innerHTML = views[route]();
  document.title = `${routes.find(r => r[0] === route)?.[1] || 'Painel'} — Preço Artesão`;
  if (route === 'calculadora') { mountRecipe(); updateResult(false); }
  if (route === 'configuracoes') updateTaxFields();
  if (route === 'backup') mountBackupPreview();
}
function handleRoute() {
  if (!state) return;
  const next = routes.some(([name]) => name === location.hash.slice(1)) ? location.hash.slice(1) : 'painel';
  if (next === route) return;
  if (dirty && !window.confirm('Há alterações não salvas. Deseja sair desta tela e descartá-las? Lembre-se de fazer backup dos dados já salvos.')) {
    history.replaceState(null, '', `#${route}`); return;
  }
  dirty = false;
  if (route === 'calculadora') draft = null;
  route = next; render();
  main.focus({ preventScroll: true }); window.scrollTo(0, 0);
}
function safePrice(product) {
  try { return calculatePrice(product, state.settings, state.materials); } catch { return null; }
}
function productRows(rows, compact = false) {
  return rows.map(p => {
    const result = safePrice(p);
    return `<tr><td><strong>${e(p.name)}</strong><small>${e(p.sku || 'Sem SKU')}</small></td><td>${result ? `<strong>${brl(result.priceCents)}</strong>${!compact && result.priceCents !== p.savedPriceCents ? `<small>Anterior: ${brl(p.savedPriceCents)}</small>` : ''}` : '<span class="tag">Revisar percentuais</span>'}</td>${compact ? '' : `<td>${percent(p.marginBp)}</td>`}<td><div class="table-actions">${tableButton('edit-product', p.id, `Editar ${p.name}`, 'edit')}${compact ? '' : tableButton('delete-product', p.id, `Excluir ${p.name}`, 'trash')}</div></td></tr>`;
  }).join('');
}
function dashboard() {
  const total = state.products.length;
  const prices = state.products.map(safePrice).filter(Boolean);
  const average = prices.length ? Number((prices.reduce((sum, p) => sum + BigInt(p.priceCents), 0n) + BigInt(Math.floor(prices.length / 2))) / BigInt(prices.length)) : 0;
  return `${heading('SEU ATELIÊ EM EQUILÍBRIO', 'Todo feito à mão tem seu valor.', 'Cuide dos custos. Valorize seu tempo. Venda com mais confiança.')}
    <section class="welcome-card"><div><p class="eyebrow">MAIS CLAREZA, MAIS TRANQUILIDADE</p><h2>Você cria com as mãos.<br>A gente ajuda com as contas.</h2><p>Descubra um preço que respeita seus materiais, seu tempo e o futuro do seu negócio.</p><a class="button" href="#calculadora">${icon('plus')} Calcular meu preço</a></div><div class="welcome-art">${illustration}</div></section>
    <section class="stats" aria-label="Resumo do ateliê"><div class="stat"><div class="stat-head">Produtos cadastrados ${icon('box')}</div><strong>${total.toLocaleString('pt-BR')}</strong><p>Suas criações organizadas</p></div><div class="stat"><div class="stat-head">Materiais e insumos ${icon('leaf')}</div><strong>${state.materials.length.toLocaleString('pt-BR')}</strong><p>A base de cada criação</p></div><div class="stat"><div class="stat-head">Preço médio sugerido ${icon('chart')}</div><strong>${brl(average)}</strong><p>${prices.length ? 'Dos produtos com cálculo válido' : 'Cadastre seu primeiro produto'}</p></div></section>
    <div class="two-columns"><section class="card"><div class="card-header"><h2>Suas últimas criações</h2><a href="#produtos">Ver produtos →</a></div>${total ? `<div class="table-wrap"><table><thead><tr><th>Produto</th><th>Preço sugerido</th><th><span class="muted">Editar</span></th></tr></thead><tbody>${productRows([...state.products].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5), true)}</tbody></table></div>` : empty('Seu ateliê começa aqui', 'Cadastre uma criação para conhecer seus custos e encontrar um preço justo.', '<a class="button secondary" href="#calculadora">Adicionar primeiro produto</a>')}</section>
    <div><section class="card tip-card"><p class="eyebrow">UMA DICA PARA O SEU NEGÓCIO</p><h2>Seu tempo também<br>faz parte do preço.</h2><p>O cuidado que você coloca em cada peça tem valor. Inclua sua mão de obra antes de definir o lucro.</p><div class="tip-example"><span>45 min a R$ 20 por hora</span><strong>R$ 15,00</strong></div></section><section class="card spacer"><h2>Primeiros passos</h2><ol class="checklist"><li><span class="${state.settings.shopName !== 'Meu ateliê' ? 'done' : ''}">1</span><a href="#configuracoes">Configure seu ateliê</a><span>→</span></li><li><span class="${state.materials.length ? 'done' : ''}">2</span><a href="#insumos">Organize seus materiais</a><span>→</span></li><li><span class="${total ? 'done' : ''}">3</span><a href="#calculadora">Calcule a primeira criação</a><span>→</span></li><li><span>4</span><a href="#backup">Faça uma cópia de segurança</a><span>→</span></li></ol></section></div></div>
    ${!total && !state.materials.length ? '<div class="notice spacer">Quer conhecer a ferramenta primeiro? <button class="text-button" type="button" data-action="demo">Carregar exemplo de uma vela artesanal →</button> Os valores são fictícios.</div>' : ''}`;
}
function calculator() {
  if (!draft) draft = newProduct();
  const editing = state.products.some(p => p.id === draft.id);
  return `${heading('DO CUSTO AO PREÇO JUSTO', editing ? 'Cuide do preço da sua criação.' : 'Quanto vale a sua criação?', 'Preencha os custos e descubra quanto cobrar para alcançar sua margem.')}
    <div class="calculator-layout"><form class="card" id="calculator-form"><div class="card-header"><h2>${editing ? 'Editar produto' : 'Sua criação'}</h2><span class="tag">${editing ? 'Produto salvo' : 'Calculadora rápida'}</span></div>
    <div class="form-grid">${field('Nome do produto', 'name', draft.name, { full: true, required: false, hint: 'Preencha para salvar. Ex.: vela aromática de lavanda.' })}${field('Código / SKU (opcional)', 'sku', draft.sku, { full: true, required: false, maxLength: 60 })}</div>
    <h3 class="section-label">01 · Materiais e composição</h3><div class="form-grid">${field('Materiais avulsos (R$)', 'materialCents', draft.materialCents, { digits: 2, money: true, full: true, hint: 'Total por peça. Não repita os insumos adicionados abaixo.' })}</div>
    <div id="recipe-list" class="spacer"></div><button type="button" class="text-button" data-action="add-recipe">+ Adicionar insumo cadastrado</button>
    <h3 class="section-label">02 · Tempo e outros custos</h3><div class="form-grid">${field('Tempo de produção (minutos)', 'laborMinutes', draft.laborMinutes, { digits: 0, hint: 'Tempo dedicado a uma unidade.' })}${field('Embalagem por unidade (R$)', 'packagingCents', draft.packagingCents, { digits: 2, money: true })}${field('Outros custos por unidade (R$)', 'otherCents', draft.otherCents, { digits: 2, money: true, full: true, hint: 'Inclua tarifas fixas, etiquetas e frete pago por você, se aplicáveis.' })}</div>
    <h3 class="section-label">03 · Venda e lucro</h3><div class="form-grid">${field('Taxas sobre a venda (%)', 'feeBp', draft.feeBp, { digits: 2, hint: 'Cartão, comissão e outras taxas percentuais.' })}${field('Margem desejada (%)', 'marginBp', draft.marginBp, { digits: 2, hint: 'Lucro como parte do preço final, após os custos informados.' })}</div>
    <p class="notice spacer">Mão de obra e despesas vêm das <a href="#configuracoes">configurações do ateliê</a>. ${taxDescription()}</p><div id="calculation-error" role="alert" class="notice error" hidden></div><div class="form-footer"><button class="button" type="submit">${icon('calculator')} Calcular preço de venda</button><small>Os dados só são gravados ao salvar o produto.</small></div></form>
    <aside class="card result-card" id="calculation-result" aria-label="Resultado da precificação"></aside></div>`;
}
function taxDescription() {
  if (state.settings.regime === 'mei') return 'DAS informado rateado por unidade; nenhum percentual tributário adicional aplicado.';
  if (state.settings.regime === 'manual') return `Simulação hipotética com ${percent(state.settings.simulationTaxBp)} sobre a venda. Não representa apuração fiscal.`;
  return 'Sem carga tributária estimada. O resultado precisa de revisão para operações com tributos.';
}
function mountRecipe() {
  const container = document.querySelector('#recipe-list');
  container.innerHTML = draft.items.map((item, index) => `<div class="recipe-row" data-index="${index}"><label>Insumo<select name="recipe-material-${index}" data-recipe="materialId">${state.materials.map(m => `<option value="${e(m.id)}"${m.id === item.materialId ? ' selected' : ''}>${e(m.name)}</option>`).join('')}</select></label><label>Consumo<input type="text" inputmode="decimal" name="recipe-quantity-${index}" data-recipe="quantityMilli" value="${decimal(item.quantityMilli, 3)}" required maxlength="18"></label><label>Unidade<select name="recipe-unit-${index}" data-recipe="unit">${Object.keys(UNITS).map(u => `<option value="${u}"${u === item.unit ? ' selected' : ''}>${u}</option>`).join('')}</select></label><button class="icon-button" type="button" data-action="remove-recipe" data-index="${index}" aria-label="Remover insumo ${index + 1}">${icon('close')}</button></div>`).join('');
}
function readProduct() {
  const form = document.querySelector('#calculator-form');
  if (!form) throw new Error('Abra a calculadora primeiro.');
  const items = [...form.querySelectorAll('.recipe-row')].map(row => ({
    materialId: row.querySelector('[data-recipe="materialId"]').value,
    quantityMilli: parseDecimal(row.querySelector('[data-recipe="quantityMilli"]').value, 3),
    unit: row.querySelector('[data-recipe="unit"]').value,
  }));
  return {
    ...draft, name: form.elements.name.value.trim(), sku: form.elements.sku.value.trim(),
    materialCents: read(form, 'materialCents'), laborMinutes: read(form, 'laborMinutes', 0),
    packagingCents: read(form, 'packagingCents'), otherCents: read(form, 'otherCents'),
    marginBp: read(form, 'marginBp'), feeBp: read(form, 'feeBp'), items,
  };
}
function updateResult(showError = true) {
  const panel = document.querySelector('#calculation-result');
  const errorBox = document.querySelector('#calculation-error');
  try {
    const p = readProduct();
    const r = calculatePrice(p, state.settings, state.materials);
    errorBox.hidden = true;
    const row = (label, value) => `<div class="result-row"><span>${label}</span><strong>${brl(value)}</strong></div>`;
    const hasCost = r.costCents > 0;
    panel.innerHTML = `<p class="eyebrow">UM PREÇO QUE VALORIZA SEU TRABALHO</p><h2>Preço de venda sugerido</h2><strong class="price-value">${brl(r.priceCents)}</strong><p class="result-caption">Por unidade · margem desejada de ${percent(p.marginBp)}</p>
      ${row('Custo total da peça', r.costCents)}${row('Preço de equilíbrio', r.breakEvenCents)}${row('Taxas da venda', r.feeCents)}${row('Encargo hipotético', r.taxCents)}<div class="result-profit"><span>Lucro estimado por peça</span><strong>${brl(r.profitCents)}</strong></div>
      <div class="breakdown-bar" aria-hidden="true"><span style="width:${hasCost ? r.costCents / r.priceCents * 100 : 100}%"></span><span style="width:${hasCost ? (r.feeCents + r.taxCents) / r.priceCents * 100 : 0}%"></span><span style="width:${hasCost ? r.profitCents / r.priceCents * 100 : 0}%"></span></div><div class="legend"><span style="--dot:#a5b892">Custos</span><span style="--dot:#d9b790">Taxas e encargo</span><span style="--dot:#e6edda">Lucro</span></div>
      <details><summary>Entenda a memória de cálculo</summary>${row('Materiais e insumos', r.materialCents)}${row('Mão de obra', r.laborCents)}${row('Embalagem', p.packagingCents)}${row('Outros custos', p.otherCents)}${row('Despesas fixas rateadas', r.overheadCents)}${row('DAS rateado (MEI)', r.dasCents)}<p>Preço = ${brl(r.costCents)} ÷ (1 − ${percent(p.feeBp)} − ${percent(r.taxBp)} − ${percent(p.marginBp)}).</p><p>Preço arredondado para cima em centavos. Taxas estimadas arredondadas para baixo em centavos. Margem realizada: ${hasCost ? (100 * r.profitCents / r.priceCents).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '0'}%. Rateio por ${state.settings.monthlyUnits} unidades/mês. Mão de obra: remuneração mensal ÷ minutos produtivos × tempo da peça.</p></details>
      <button type="button" class="button" data-action="save-product">${icon('plus')} ${state.products.some(item => item.id === p.id) ? 'Salvar alterações do produto' : 'Salvar como produto'}</button><p class="hint">${hasCost ? 'Estimativa gerencial conforme os custos informados.' : 'Informe os custos para obter uma estimativa útil.'} ${taxDescription()}</p>`;
    return { product: p, result: r };
  } catch (error) {
    panel.innerHTML = '<p class="eyebrow">RESULTADO DA SUA CRIAÇÃO</p><p class="result-placeholder">Revise os valores para calcular um preço viável. Todos os custos devem ser positivos e os percentuais precisam somar menos de 100%.</p>';
    errorBox.textContent = error.message; errorBox.hidden = !showError;
    return null;
  }
}
function products() {
  return `${heading('CADA CRIAÇÃO, UMA HISTÓRIA', 'Seus produtos.', 'Preços recalculados com os custos atuais do ateliê.', '<a class="button" href="#calculadora">' + icon('plus') + ' Novo produto</a>')}
    <section class="card"><div class="list-toolbar"><input class="search-field" type="search" aria-label="Buscar produtos por nome ou SKU" placeholder="Buscar por nome ou SKU…" id="product-search"><p>${state.products.length} produto(s) cadastrado(s)</p></div><div id="product-table">${productsTable(state.products)}</div></section><p class="notice spacer">O preço anterior é a última estimativa salva. Alterar um insumo ou as configurações recalcula a sugestão, preservando esse valor para comparação. Faça backup antes de grandes alterações.</p>`;
}
function productsTable(rows) {
  return rows.length ? `<div class="table-wrap"><table><thead><tr><th>Produto</th><th>Preço sugerido</th><th>Margem alvo</th><th>Ações</th></tr></thead><tbody>${productRows(rows)}</tbody></table></div>` : empty('Uma nova criação começa aqui', 'Calcule os custos e salve seus produtos para acompanhar os preços.', '<a class="button secondary" href="#calculadora">Calcular um produto</a>');
}
function materials() {
  return `${heading('A BASE DE CADA CRIAÇÃO', 'Materiais e insumos.', 'Cadastre o que você compra. A gente calcula o custo do que você usa.', '<button class="button" type="button" data-action="new-material">' + icon('plus') + ' Novo insumo</button>')}
    <section class="card"><div class="list-toolbar"><input class="search-field" type="search" id="material-search" aria-label="Buscar insumos" placeholder="Buscar material…"><p>${state.materials.length} insumo(s) cadastrado(s)</p></div><div id="material-table">${materialsTable(state.materials)}</div></section><p class="notice spacer">As quantidades compradas e consumidas podem usar unidades compatíveis (kg e g, L e ml, m e cm). A perda representa a parte da compra que não pode ser aproveitada.</p>`;
}
function materialsTable(rows) {
  return rows.length ? `<div class="table-wrap"><table><thead><tr><th>Material</th><th>Compra</th><th>Perda</th><th>Ações</th></tr></thead><tbody>${rows.map(m => `<tr><td><strong>${e(m.name)}</strong><small>${e(materialUnitLabel(m))}</small></td><td>${brl(m.costCents)}<small>${(m.quantityMilli / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} ${m.unit}</small></td><td>${percent(m.lossBp)}</td><td><div class="table-actions">${tableButton('edit-material', m.id, `Editar ${m.name}`, 'edit')}${tableButton('delete-material', m.id, `Excluir ${m.name}`, 'trash')}</div></td></tr>`).join('')}</tbody></table></div>` : empty('Dê nome aos seus materiais', 'Cera, tecido, fio, argila… organize seus custos para precificar com confiança.', '<button class="button secondary" type="button" data-action="new-material">Adicionar primeiro insumo</button>');
}
function materialDialog(material) {
  const m = material || { id: uid(), name: '', unit: 'un', quantityMilli: 1000, costCents: 0, lossBp: 0 };
  modal.innerHTML = `<div class="dialog-head"><h2 id="modal-title">${material ? 'Editar insumo' : 'Novo material ou insumo'}</h2><button class="icon-button" type="button" data-action="close-modal" aria-label="Fechar">${icon('close')}</button></div><p>Informe o custo total da compra, incluindo frete e demais custos não recuperáveis.</p><form id="material-form" data-id="${e(m.id)}"><div class="form-grid">${field('Nome do material', 'material-name', m.name, { full: true })}${field('Quantidade comprada', 'quantityMilli', m.quantityMilli, { digits: 3, hint: 'Até 3 casas decimais.' })}<label class="field" for="material-unit">Unidade<select id="material-unit" name="unit">${unitOptions(m.unit)}</select></label>${field('Custo total da compra (R$)', 'costCents', m.costCents, { digits: 2, money: true })}${field('Perda da compra (%)', 'lossBp', m.lossBp, { digits: 2 })}</div><div class="notice spacer">Ao alterar o custo, todos os produtos que usam este material serão recalculados. Lembre-se de fazer backup.</div><div class="form-footer"><button class="button" type="submit">Salvar insumo</button><button class="button secondary" type="button" data-action="close-modal">Cancelar</button></div></form>`;
  modal.oncancel = null; modal.showModal();
}
function settings() {
  const s = state.settings;
  return `${heading('DO SEU JEITO, NO SEU RITMO', 'Configure seu ateliê.', 'Esses valores ajudam a encontrar preços que sustentam o seu negócio.')}
    <form class="card" id="settings-form"><h2>Seu negócio</h2><div class="form-grid">${field('Nome do ateliê ou loja', 'shopName', s.shopName, { full: true })}</div>
    <h3 class="section-label">Trabalho e despesas mensais</h3><div class="form-grid">${field('Remuneração produtiva desejada (R$)', 'monthlyPayCents', s.monthlyPayCents, { digits: 2, money: true, hint: 'Pagamento pelo seu trabalho de fabricação, antes do lucro.' })}${field('Horas produtivas por mês', 'productiveHours', s.productiveMinutes / 60 * 100, { digits: 2, hint: 'Somente as horas dedicadas à fabricação; convertido para minutos inteiros.' })}${field('Outras despesas fixas (R$)', 'monthlyOverheadCents', s.monthlyOverheadCents, { digits: 2, money: true, hint: 'Aluguel, energia etc. Não repita a remuneração ou o DAS.' })}${field('Produção estimada (unidades/mês)', 'monthlyUnits', s.monthlyUnits, { digits: 0, hint: 'Usada para ratear despesas e DAS por unidade.' })}</div>
    <h3 class="section-label">Parâmetros para novos produtos</h3><div class="form-grid">${field('Margem desejada padrão (%)', 'defaultMarginBp', s.defaultMarginBp, { digits: 2 })}${field('Taxas comerciais padrão (%)', 'defaultFeeBp', s.defaultFeeBp, { digits: 2 })}</div>
    <h3 class="section-label">Tratamento gerencial de tributos</h3><div class="notice">Esta primeira versão não apura tributos nem implementa tabelas legais da reforma. Os valores abaixo são informados por você. Consulte o responsável contábil para definir os custos aplicáveis.</div><div class="form-grid spacer"><label class="field full" for="regime">Modalidade de cálculo<select id="regime" name="regime"><option value="none"${s.regime === 'none' ? ' selected' : ''}>Sem estimativa tributária — revisar antes de vender</option><option value="mei"${s.regime === 'mei' ? ' selected' : ''}>MEI — ratear o DAS mensal informado como custo fixo</option><option value="manual"${s.regime === 'manual' ? ' selected' : ''}>Simulação hipotética — percentual efetivo linear informado</option></select></label><div id="das-field" class="full">${field('DAS mensal informado (R$)', 'monthlyDASCents', s.monthlyDASCents, { digits: 2, money: true, hint: 'Não consultamos nem presumimos o valor legal do DAS.' })}</div><div id="tax-field" class="full">${field('Encargo hipotético sobre a venda (%)', 'simulationTaxBp', s.simulationTaxBp, { digits: 2, hint: 'Somente para simulação com base linear. Não adicionar tributos já incluídos neste percentual.' })}</div></div>
    <div class="form-footer"><button class="button" type="submit">Salvar configurações</button><small>Os produtos serão recalculados. As margens individuais são preservadas.</small></div></form>`;
}
function updateTaxFields() {
  const value = document.querySelector('#regime').value;
  document.querySelector('#das-field').hidden = value !== 'mei';
  document.querySelector('#tax-field').hidden = value !== 'manual';
  document.querySelector('[name=monthlyDASCents]').disabled = value !== 'mei';
  document.querySelector('[name=simulationTaxBp]').disabled = value !== 'manual';
}
function backup() {
  return `${heading('CUIDADO QUE PROTEGE SEU TRABALHO', 'Seu ateliê, em segurança.', 'Faça backup regularmente. Você é responsável por guardar uma cópia dos seus dados.')}
    <div class="notice"><strong>Importante: faça backup antes de limpar ou trocar de navegador.</strong> Os cadastros ficam apenas neste navegador e neste endereço do aplicativo. Eles não acompanham você automaticamente em outro dispositivo. Guarde o arquivo JSON em uma pasta segura e mantenha uma segunda cópia.</div>
    <div class="backup-grid spacer"><section class="card"><div class="backup-icon">${icon('backup')}</div><h2>Guardar uma cópia</h2><p>Exporte configurações, materiais e produtos em um único arquivo JSON. Faça isso ao encerrar seu dia ou após alterações importantes.</p><p><strong>${state.products.length}</strong> produtos · <strong>${state.materials.length}</strong> insumos</p><button type="button" class="button" data-action="export">${icon('backup')} Exportar backup JSON</button><p class="spacer" id="backup-export-status">${backupDownloaded ? 'Download solicitado nesta sessão. Confira se o arquivo foi salvo.' : 'Ainda não foi solicitado um backup nesta sessão.'}</p></section>
    <section class="card"><div class="backup-icon">${icon('upload')}</div><h2>Restaurar seus dados</h2><p>Selecione um backup do Preço Artesão. Confira a prévia e escolha mesclar ou substituir. Nenhum dado será alterado antes da confirmação.</p><label class="field" for="backup-file">Arquivo de backup (JSON, até 5 MB)<input type="file" id="backup-file" accept=".json,application/json"></label></section></div><div id="backup-preview" class="backup-preview"></div>`;
}
function mountBackupPreview() {
  if (!pendingBackup || route !== 'backup') return;
  const { data, exportedAt, fileName } = pendingBackup;
  const productsReplaced = data.products.filter(p => state.products.some(current => current.id === p.id)).length;
  const materialsReplaced = data.materials.filter(m => state.materials.some(current => current.id === m.id)).length;
  document.querySelector('#backup-preview').innerHTML = `<section class="card"><h2>Confira o arquivo antes de restaurar</h2><dl><dt>Arquivo</dt><dd>${e(fileName)}</dd><dt>Ateliê do backup</dt><dd>${e(data.settings.shopName)}</dd><dt>Exportado em</dt><dd>${e(displayDate(exportedAt))}</dd><dt>Registros no arquivo</dt><dd>${data.products.length} produtos · ${data.materials.length} insumos</dd><dt>IDs que coincidem ao mesclar</dt><dd>${productsReplaced} produtos · ${materialsReplaced} insumos</dd></dl>
    <form id="restore-form"><label class="radio-option"><input type="radio" name="mode" value="merge" checked><span>Mesclar cadastros<small>Mantém suas configurações atuais. Registros com o mesmo ID recebem os valores do backup; os demais são acrescentados.</small></span></label><label class="radio-option"><input type="radio" name="mode" value="replace"><span>Substituir todos os dados<small>Configurações, produtos e materiais atuais serão substituídos pelo conteúdo deste arquivo.</small></span></label>
    <div class="notice"><strong>Faça backup dos dados atuais antes de continuar.</strong> <button class="text-button" type="button" data-action="export">Exportar agora →</button></div><label class="checkbox-label"><input type="checkbox" id="restore-check" required><span>Exportei e conferi o backup dos dados atuais e entendo a alteração escolhida.</span></label><div class="actions"><button class="button" type="submit">Revisar e confirmar restauração</button><button class="button secondary" type="button" data-action="cancel-import">Cancelar</button></div></form></section>`;
}
function exportBackup() {
  if (!state) return notify('O banco ainda não está disponível.', true);
  const blob = new Blob([JSON.stringify(createBackup(state))], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `preco-artesao-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  backupDownloaded = true;
  const label = document.querySelector('#backup-export-status');
  if (label) label.textContent = 'Download solicitado agora. Confira se o arquivo foi salvo e guarde uma segunda cópia.';
  notify('Backup solicitado. Confira o arquivo na pasta de downloads e guarde uma cópia segura.');
}
function help() {
  return `${heading('INFORMAÇÃO QUE SIMPLIFICA', 'Vamos fazer as contas juntos.', 'Um guia rápido para cuidar dos preços e dos seus dados.')}<div class="help-content card">
    <section><h2>1. Configure o valor do seu tempo</h2><p>Em <a href="#configuracoes">Configurações</a>, informe a remuneração mensal pelo trabalho produtivo e quantas horas você consegue dedicar à fabricação. R$ 2.400 por 120 horas resulta em R$ 20 por hora. Uma peça feita em 45 minutos terá R$ 15 de mão de obra.</p></section>
    <section><h2>2. Registre os materiais e calcule uma peça</h2><p>Em <a href="#insumos">Materiais e insumos</a>, cadastre a compra completa. Na <a href="#calculadora">Calculadora</a>, adicione apenas a quantidade consumida em uma peça. A ferramenta converte kg para g, L para ml e m para cm. Materiais avulsos são somados à composição; não conte o mesmo custo duas vezes.</p></section>
    <section><h2>3. Entenda margem, markup e rateio</h2><p>Margem é o lucro como parte do preço de venda. Com custo de R$ 30 e margem de 25%, sem taxas, o preço é R$ 40: o lucro de R$ 10 equivale a 25% de R$ 40. Acrescentar 25% sobre o custo é markup e resulta em outra margem.</p><p>Despesas fixas e o DAS informado do MEI são divididos pela produção mensal estimada. A remuneração produtiva entra na mão de obra e deve ser excluída das outras despesas para evitar contagem dupla. O lucro é uma estimativa após os custos que você informou.</p></section>
    <section><h2>4. Confira a memória de cálculo</h2><p>Expanda “Entenda a memória de cálculo” no resultado. O preço usa custo ÷ (1 − taxas − encargo hipotético − margem) apenas para percentuais sobre a mesma base linear. O preço arredonda para cima em centavos. A simulação não atende regimes com bases distintas, créditos ou regras progressivas.</p></section>
    <section><h2>5. Faça backup. Sempre.</h2><p>Use <a href="#backup">Backup e restauração</a> para exportar o arquivo JSON ao fim do dia e antes de alterações importantes. Confira o download. Guarde uma segunda cópia em outro local seguro, pois o arquivo contém informações do seu negócio.</p><p>Trocar de dispositivo, de navegador, de perfil ou de endereço do aplicativo muda o banco acessado. Limpar os dados do site pode apagar seus cadastros. O servidor estático não tem cópia do seu banco. Em navegação privada, os dados podem desaparecer ao fechar a janela.</p><p>Para restaurar, selecione o JSON, confira a loja e a data, escolha mesclar ou substituir e confirme. Faça backup dos dados atuais primeiro. O arquivo é validado antes de qualquer gravação.</p></section>
    <section><h2>6. Use offline após o primeiro acesso</h2><p>Aguarde a indicação “Offline preparado” no primeiro acesso completo por HTTPS ou localhost. Depois, abra o mesmo endereço e perfil de navegador. Se o armazenamento do site for removido, o aplicativo e os dados locais podem ser apagados.</p></section>
    <section><h2>O que esta primeira versão entrega</h2><p>Configurações, insumos com conversão de unidades, produtos por unidade, calculadora, banco local e backup JSON. O módulo legal por regime e ano, receitas por lote, múltiplos canais e relatórios completos são etapas futuras. A opção de MEI só rateia o DAS que você informa; a simulação manual usa um percentual hipotético e não apura tributos.</p></section><div class="notice">Antes de definir o preço real de venda, revise os custos e o tratamento tributário com o responsável contábil. Não há alíquotas legais preenchidas automaticamente.</div></div>`;
}

// All dynamic strings are escaped before HTML insertion; input values never become scripts.
document.addEventListener('click', async event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const { action, id } = target.dataset;
  try {
    if (action === 'export') return exportBackup();
    if (action === 'retry') return location.reload();
    if (!state || busy) return;
    if (action === 'close-modal') return modal.close();
    if (action === 'new-material') return materialDialog();
    if (action === 'edit-material') return materialDialog(state.materials.find(m => m.id === id));
    if (action === 'edit-product') {
      if (dirty && !window.confirm('Descartar as alterações não salvas?')) return;
      dirty = false; draft = structuredClone(state.products.find(p => p.id === id)); navigate('calculadora');
    }
    if (action === 'add-recipe') {
      if (!state.materials.length) return notify('Cadastre um material em “Materiais e insumos” primeiro.', true);
      if (document.querySelectorAll('.recipe-row').length >= 100) throw new Error('Limite de 100 insumos por produto.');
      draft = readProduct(); draft.items.push({ materialId: state.materials[0].id, quantityMilli: 1000, unit: state.materials[0].unit });
      dirty = true; mountRecipe(); updateResult();
    }
    if (action === 'remove-recipe') { target.closest('.recipe-row').remove(); dirty = true; updateResult(); }
    if (action === 'save-product') {
      const computed = updateResult();
      if (!computed) return;
      const p = { ...computed.product, savedPriceCents: computed.result.priceCents, updatedAt: new Date().toISOString() };
      if (!p.name) { document.querySelector('#field-name').focus(); throw new Error('Dê um nome à criação antes de salvar.'); }
      await persist({ ...state, products: [...state.products.filter(item => item.id !== p.id), p] }, 'Produto salvo.');
      draft = null; navigate('produtos');
    }
    if (action === 'delete-product') {
      const p = state.products.find(p => p.id === id);
      if (await confirmDialog('Excluir produto?', `“${p.name}” será removido do seu ateliê.`, 'Excluir produto', true)) {
        await persist({ ...state, products: state.products.filter(p => p.id !== id) }, 'Produto excluído.'); render();
      }
    }
    if (action === 'delete-material') {
      if (state.products.some(p => p.items.some(item => item.materialId === id))) throw new Error('Este insumo está em uso. Remova-o da composição dos produtos antes de excluir.');
      const m = state.materials.find(m => m.id === id);
      if (await confirmDialog('Excluir insumo?', `“${m.name}” será removido dos materiais.`, 'Excluir insumo', true)) {
        await persist({ ...state, materials: state.materials.filter(m => m.id !== id) }, 'Insumo excluído.'); render();
      }
    }
    if (action === 'cancel-import') { pendingBackup = null; render(); }
    if (action === 'demo') {
      if (state.materials.length || state.products.length) throw new Error('O exemplo só pode ser carregado em um ateliê sem cadastros.');
      if (!await confirmDialog('Conhecer com um exemplo?', 'Será cadastrada uma vela com cera e valores fictícios. Suas configurações serão mantidas.', 'Carregar exemplo')) return;
      const wax = { id: uid(), name: 'Cera vegetal (demonstração)', unit: 'kg', quantityMilli: 1000, costCents: 4000, lossBp: 0 };
      const p = { ...newProduct(), name: 'Vela aromática (demonstração)', sku: 'DEMO-001', materialCents: 500, laborMinutes: 30, packagingCents: 300, items: [{ materialId: wax.id, quantityMilli: 150000, unit: 'g' }] };
      p.savedPriceCents = calculatePrice(p, state.settings, [wax]).priceCents;
      await persist({ ...state, materials: [wax], products: [p] }, 'Exemplo fictício carregado.'); render();
    }
  } catch (error) { fail(error); }
});

document.addEventListener('input', event => {
  if (event.target.closest('#calculator-form')) { dirty = true; updateResult(false); }
  if (event.target.closest('#settings-form')) dirty = true;
  if (event.target.id === 'product-search') {
    const term = event.target.value.toLocaleLowerCase('pt-BR');
    document.querySelector('#product-table').innerHTML = productsTable(state.products.filter(p => `${p.name} ${p.sku}`.toLocaleLowerCase('pt-BR').includes(term)));
  }
  if (event.target.id === 'material-search') {
    const term = event.target.value.toLocaleLowerCase('pt-BR');
    document.querySelector('#material-table').innerHTML = materialsTable(state.materials.filter(m => m.name.toLocaleLowerCase('pt-BR').includes(term)));
  }
});
document.addEventListener('change', async event => {
  if (event.target.id === 'regime') updateTaxFields();
  if (event.target.closest('#recipe-list')) {
    const row = event.target.closest('.recipe-row');
    if (event.target.dataset.recipe === 'materialId') row.querySelector('[data-recipe="unit"]').value = state.materials.find(m => m.id === event.target.value).unit;
    dirty = true; updateResult(false);
  }
  if (event.target.id !== 'backup-file') return;
  pendingBackup = null; document.querySelector('#backup-preview').innerHTML = '';
  try {
    const file = event.target.files[0]; if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) throw new Error('O arquivo excede 5 MB.');
    const parsed = JSON.parse(await file.text());
    pendingBackup = { data: validateBackup(parsed), exportedAt: parsed.exportedAt, fileName: file.name };
    mountBackupPreview(); notify('Arquivo validado. Confira a prévia e faça backup dos dados atuais.');
  } catch (error) { fail(error instanceof SyntaxError ? new Error('Este arquivo não contém JSON válido.') : error); }
});
document.addEventListener('submit', async event => {
  event.preventDefault(); const form = event.target;
  try {
    if (busy) return;
    if (form.id === 'calculator-form') { updateResult(); return; }
    if (form.id === 'material-form') {
      const m = { id: form.dataset.id, name: form.elements['material-name'].value.trim(), unit: form.elements.unit.value, quantityMilli: read(form, 'quantityMilli', 3), costCents: read(form, 'costCents'), lossBp: read(form, 'lossBp') };
      await persist({ ...state, materials: [...state.materials.filter(item => item.id !== m.id), m] }, 'Insumo salvo.'); modal.close(); render();
    }
    if (form.id === 'settings-form') {
      const hoursHundredths = read(form, 'productiveHours');
      const minutes = Math.round(hoursHundredths * 60 / 100);
      const s = { shopName: form.elements.shopName.value.trim(), monthlyPayCents: read(form, 'monthlyPayCents'), productiveMinutes: minutes, monthlyOverheadCents: read(form, 'monthlyOverheadCents'), monthlyUnits: read(form, 'monthlyUnits', 0), defaultMarginBp: read(form, 'defaultMarginBp'), defaultFeeBp: read(form, 'defaultFeeBp'), regime: form.elements.regime.value, monthlyDASCents: form.elements.regime.value === 'mei' ? read(form, 'monthlyDASCents') : state.settings.monthlyDASCents, simulationTaxBp: form.elements.regime.value === 'manual' ? read(form, 'simulationTaxBp') : state.settings.simulationTaxBp };
      await persist({ ...state, settings: s }, 'Configurações salvas.'); render();
    }
    if (form.id === 'restore-form') {
      if (!pendingBackup) throw new Error('Selecione e valide um arquivo primeiro.');
      if (!backupDownloaded || !document.querySelector('#restore-check').checked) throw new Error('Exporte um backup atual, confira o download e marque a confirmação antes de restaurar.');
      const replace = form.elements.mode.value === 'replace';
      const next = replace ? validateState(pendingBackup.data) : mergeStates(state, pendingBackup.data);
      if (!await confirmDialog(replace ? 'Substituir todos os dados?' : 'Mesclar os cadastros?', replace ? 'Os cadastros e configurações atuais serão substituídos pelo arquivo selecionado. Seu backup é a forma de recuperar os valores anteriores.' : 'Registros com IDs coincidentes serão atualizados pelo arquivo. As configurações atuais serão mantidas.', 'Confirmar restauração', replace)) return;
      await persist(next, 'Backup restaurado.'); pendingBackup = null; draft = null; render();
    }
  } catch (error) { fail(error); }
});
window.addEventListener('hashchange', handleRoute);
window.addEventListener('beforeunload', event => { if (dirty || busy) { event.preventDefault(); event.returnValue = ''; } });

async function init() {
  try {
    state = await loadState();
    document.querySelector('#shop-label').textContent = state.settings.shopName;
    status('Salvo neste navegador'); handleRoute();
  } catch (error) {
    status('Banco local indisponível');
    main.innerHTML = `${heading('VAMOS CUIDAR DOS SEUS DADOS', 'Não foi possível abrir o ateliê.', 'Seus dados existentes não foram substituídos.')}<div class="notice error">${e(error.message)}</div><p class="subtitle spacer">Verifique as permissões de armazenamento e abra o aplicativo em uma janela normal, pelo mesmo endereço. Não limpe o armazenamento se houver dados sem backup.</p><button class="button spacer" type="button" data-action="retry">Tentar novamente</button>`;
  }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      const offlineReady = () => { if (state && !busy) status('Salvo neste navegador · Offline preparado'); };
      if (registration.active) offlineReady();
      navigator.serviceWorker.addEventListener('controllerchange', offlineReady);
      if (registration.installing) registration.installing.addEventListener('statechange', () => {
        if (registration.installing?.state === 'activated' || registration.active) offlineReady();
      });
    } catch { notify('Não foi possível preparar o acesso offline. Mantenha o servidor acessível e faça backup.', true); }
  }
}
init();
