import { toolForm } from '../../../components/ui/tool-form.js';
import { units, convertUnit } from './logic.js';
export function mount(container, feedback) {
  toolForm(container, feedback, `<label class="field-label" for="dimension">Measurement</label><select id="dimension">${Object.keys(units).map(name => `<option>${name}</option>`).join('')}</select><label class="field-label" for="input">Value</label><input id="input" type="number" value="1" step="any"><div class="unit-pair"><div><label class="field-label" for="from-unit">From</label><select id="from-unit"></select></div><div><label class="field-label" for="to-unit">To</label><select id="to-unit"></select></div></div><p>Results use up to 12 significant digits. A day is defined as 24 hours.</p>`, () => {
    const from = container.querySelector('#from-unit').value;
    const to = container.querySelector('#to-unit').value;
    return `${convertUnit(container.querySelector('#input').value, container.querySelector('#dimension').value, from, to)} ${to}`;
  });
  function updateUnits() {
    const options = Object.keys(units[container.querySelector('#dimension').value]).map(name => `<option>${name}</option>`).join('');
    container.querySelector('#from-unit').innerHTML = options;
    container.querySelector('#to-unit').innerHTML = options;
    container.querySelector('#to-unit').selectedIndex = 1;
  }
  container.querySelector('#dimension').onchange = updateUnits;
  updateUnits();
}
