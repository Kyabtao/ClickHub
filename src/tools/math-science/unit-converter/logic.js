export const units = {
  Length: { Metres: 1, Kilometres: 1000, Centimetres: 0.01, Millimetres: 0.001, Miles: 1609.344, Yards: 0.9144, Feet: 0.3048, Inches: 0.0254 },
  Mass: { Kilograms: 1, Grams: 0.001, Milligrams: 0.000001, Pounds: 0.45359237, Ounces: 0.028349523125 },
  Temperature: { Celsius: 1, Fahrenheit: 1, Kelvin: 1 },
  Time: { Seconds: 1, Minutes: 60, Hours: 3600, Days: 86400, Weeks: 604800 },
};
export function convertUnit(value, category, from, to) {
  const group = units[category];
  if (!group || !Object.hasOwn(group, from) || !Object.hasOwn(group, to)) throw new Error('Select compatible units.');
  if (String(value).trim() === '' || !Number.isFinite(Number(value))) throw new Error('Enter a finite number.');
  const number = Number(value);
  let result;
  if (category === 'Temperature') {
    const kelvin = from === 'Celsius' ? number + 273.15 : from === 'Fahrenheit' ? (number - 32) * 5 / 9 + 273.15 : number;
    if (kelvin < -1e-10) throw new Error('Temperature cannot be below absolute zero.');
    result = to === 'Celsius' ? kelvin - 273.15 : to === 'Fahrenheit' ? (kelvin - 273.15) * 9 / 5 + 32 : kelvin;
  } else result = number * group[from] / group[to];
  if (!Number.isFinite(result)) throw new Error('Result is too large.');
  return Number(result.toPrecision(12));
}
