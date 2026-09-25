export function color(hex) {
 hex = hex.trim().replace(/^#/, '');
 if (!/^(?:[a-f0-9]{3}|[a-f0-9]{6})$/i.test(hex)) throw new Error('Enter a 3- or 6-digit HEX color, such as #4a90e2.');
 if (hex.length === 3) hex = [...hex].map(c => c + c).join('');
 const rgb = [0,2,4].map(i => parseInt(hex.slice(i, i + 2), 16));
 const [r,g,b] = rgb.map(x => x / 255), max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min, l = (max + min) / 2;
 let h = 0; if (d) { h = max === r ? ((g-b)/d) % 6 : max === g ? (b-r)/d + 2 : (r-g)/d + 4; h = (h * 60 + 360) % 360; }
 const s = d === 0 ? 0 : d / (1 - Math.abs(2*l - 1));
 return { hex: '#' + hex.toUpperCase(), rgb: `rgb(${rgb.join(', ')})`, hsl: `hsl(${+h.toFixed(2)}, ${+(s*100).toFixed(2)}%, ${+(l*100).toFixed(2)}%)` };
}
