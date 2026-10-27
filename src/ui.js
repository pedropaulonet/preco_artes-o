import { UNITS, materialCost } from './pricing.js';

const paths = {
  home: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  calculator: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 10h1m6 0h1m-8 4h1m6 0h1m-8 4h1m6 0h1"/>',
  box: '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10L3 7m9 5 9-5m-9 5v10M7.5 4.5l9 5"/>',
  leaf: '<path d="M20 3c1 11-3 16-9 16a7 7 0 0 1-7-7C4 6 11 5 20 3ZM3 21 15 9"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="white"/><circle cx="15" cy="17" r="3" fill="white"/>',
  backup: '<path d="M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5"/>',
  upload: '<path d="M12 16V4m-4 4 4-4 4 4M4 16v4h16v-4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  chart: '<path d="M4 20V10m8 10V4m8 16v-7"/>',
};
export const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.box}</svg>`;
export const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
export const brl = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
export const percent = bp => `${(bp / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
export const decimal = (value, digits = 2) => (value / 10 ** digits).toFixed(digits);
export const displayDate = value => new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
export function field(label, name, value = '', options = {}) {
  const { hint = '', full = false, digits, money = false, required = true, maxLength = 120 } = options;
  const numeric = digits !== undefined;
  const input = `<input id="field-${name}" name="${name}" type="text" ${numeric ? 'inputmode="decimal"' : ''} value="${escapeHTML(numeric ? decimal(value, digits) : value)}" maxlength="${numeric ? 18 : maxLength}" ${required ? 'required' : ''} ${hint ? `aria-describedby="hint-${name}"` : ''} autocomplete="off">`;
  return `<label class="field${full ? ' full' : ''}" for="field-${name}">${label}${money ? `<span class="input-unit"><span aria-hidden="true">R$</span>${input}</span>` : input}${hint ? `<small id="hint-${name}">${hint}</small>` : ''}</label>`;
}
export function unitOptions(selected) {
  return Object.entries(UNITS).map(([key, value]) => `<option value="${key}"${key === selected ? ' selected' : ''}>${key} · ${value.label}</option>`).join('');
}
export function empty(title, description, action = '') {
  return `<div class="empty-state"><div class="empty-symbol">${icon('box')}</div><h3>${title}</h3><p>${description}</p>${action}</div>`;
}
export function heading(eyebrow, title, description, action = '') {
  return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="subtitle">${description}</p></div>${action}</div>`;
}
export const tableButton = (action, id, label, symbol) => `<button type="button" class="icon-button" data-action="${action}" data-id="${escapeHTML(id)}" aria-label="${escapeHTML(label)}" title="${escapeHTML(label)}">${icon(symbol)}</button>`;
export const illustration = `<svg viewBox="0 0 250 200" fill="none" aria-hidden="true"><circle cx="132" cy="104" r="81" fill="#e0e7d1"/><ellipse cx="129" cy="176" rx="92" ry="8" fill="#d4dec3"/><path d="M43 106h66l-5 63H49l-6-63Z" fill="#bb7856"/><ellipse cx="76" cy="107" rx="33" ry="8" fill="#d89672"/><path d="M76 104V56m0 31c-26 0-34-18-29-35 23 1 31 17 29 35Zm0-15c24-1 33-20 27-36-22 2-29 19-27 36Z" fill="#75875e" stroke="#60754e" stroke-width="2"/><path d="M135 97h62v73h-62z" fill="#f5eee0" stroke="#bcae8d" stroke-width="2"/><ellipse cx="166" cy="97" rx="31" ry="9" fill="#e4d6bb" stroke="#bcae8d" stroke-width="2"/><path d="M166 88V75" stroke="#6e7158" stroke-width="2"/><path d="M167 77c-11-7-7-15-1-21 7 7 12 16 1 21Z" fill="#d29b58"/><rect x="147" y="121" width="38" height="27" rx="2" fill="#e2dbc6"/><path d="M160 140c-1-7 2-13 11-14-1 9-5 13-11 14Z" stroke="#8b9974" stroke-width="2"/><path d="m214 42 3 9 9 3-9 3-3 9-3-9-9-3 9-3 3-9Z" fill="#b68d60"/><circle cx="119" cy="37" r="3" fill="#b68d60"/><path d="m32 143-5 5m1-12-5-1M210 139l8-4m-5 13 7 3" stroke="#9aab87" stroke-width="2" stroke-linecap="round"/></svg>`;

export function materialUnitLabel(material) {
  try { return `${brl(materialCost(material, { quantityMilli: 1000, unit: material.unit }))} / ${material.unit}, com perda`; }
  catch { return 'Custo unitário acima do limite; revise quantidade e perda.'; }
}
