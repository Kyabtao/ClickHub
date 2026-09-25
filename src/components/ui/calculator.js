import { toolForm } from './tool-form.js';
// Field definitions are trusted static metadata. User values never become HTML.
export function calculator(container, feedback, fields, note, run) {
  const markup = fields.map(field => {
    const label = `<label class="field-label" for="${field.id}">${field.label}</label>`;
    if (field.options) return `${label}<select id="${field.id}">${field.options.map(([value, text]) => `<option value="${value}">${text}</option>`).join('')}</select>`;
    if (field.type === 'textarea') return `${label}<textarea id="${field.id}" spellcheck="false"></textarea>`;
    return `${label}<input id="${field.id}" type="${field.type || 'number'}" ${field.type === 'file' ? '' : `value="${field.value ?? ''}"`} ${!field.type || field.type === 'number' ? 'step="any"' : ''}>`;
  }).join('');
  toolForm(container, feedback, `${markup}<p>${note}</p>`, () => {
    const values = Object.fromEntries(fields.map(field => {
      const input = container.querySelector(`#${field.id}`);
      return [field.id, field.type === 'file' ? input.files[0] : input.value];
    }));
    return run(values);
  });
  container.querySelector('#run-tool').textContent = 'Calculate';
}
