const FONDO = require('../assets/images/fondos/desgranados.webp');
export { FONDO };

export const NOMBRE_ZONA: Record<string, string> = {
  terraza: 'Terraza',
  salon: 'Salón',
};

export const CATEGORIA_INFO: Record<string, { label: string; icon: string }> = {
  entradas: { label: 'Entradas', icon: 'fast-food' },
  'menu-infantil': { label: 'Menú Infantil', icon: 'happy' },
  pizzas: { label: 'Pizzas', icon: 'pizza' },
  desgranados: { label: 'Desgranados', icon: 'layers' },
  papas: { label: 'Papas Ikónicas', icon: 'return-up-back' },
  lasana: { label: 'Lasaña', icon: 'pizza' },
  granizados: { label: 'Granizados', icon: 'snow' },
  sodas: { label: 'Sodas', icon: 'water' },
  bebidas: { label: 'Bebidas Frías', icon: 'cafe' },
  cerveza: { label: 'Cerveza', icon: 'beer' },
  cocteles: { label: 'Cócteles', icon: 'wine' },
  postres: { label: 'Postres', icon: 'ice-cream' },
  almuerzos: { label: 'Menú Almuerzos', icon: 'restaurant' },
  congelados: { label: 'Congelados', icon: 'snow' },
};

export const COLORES = {
  fondo: '#0D1826',
  card: 'rgba(22, 28, 38, 0.92)',
  cardSuave: 'rgba(255, 255, 255, 0.06)',
  linea: 'rgba(255, 255, 255, 0.10)',
  ambar: '#F2A03F',
  crema: '#F5EFE6',
  texto: '#F5EFE6',
  textoSuave: '#9DA9B7',
  verde: '#3ED598',
  rojo: '#FF5A5A',
};
