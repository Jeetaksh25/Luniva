export const darkenColor = (hex: string, amount: number) => {
  let col = hex.replace("#", "");
  let r = parseInt(col.substring(0, 2), 16);
  let g = parseInt(col.substring(2, 4), 16);
  let b = parseInt(col.substring(4, 6), 16);

  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);

  return `rgb(${r},${g},${b})`;
};
