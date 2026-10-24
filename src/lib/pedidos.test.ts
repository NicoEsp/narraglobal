import { describe, expect, it, vi } from 'vitest';

// pedidos.ts arma el cliente de Supabase al importarse y ese cliente pide
// localStorage; acá se prueba lógica pura, así que el cliente se reemplaza.
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

const { PAISES, telefonoConPais, telefonoValido } = await import('./pedidos');

describe('telefonoConPais · Argentina', () => {
  const ar = (s: string) => telefonoConPais(s, 'Argentina');

  it('arma el número como se marca en el país', () => {
    expect(ar('341 555 1234')).toBe('+5493415551234');
    expect(ar('0341 15 555 1234')).toBe('+5493415551234');
    expect(ar('011 15 1234 5678')).toBe('+5491112345678');
    expect(ar('9 341 555 1234')).toBe('+5493415551234');
  });

  it('reconoce el código sin el «+» y suma el 9 igual', () => {
    expect(ar('54 341 555 1234')).toBe('+5493415551234');
    expect(ar('549 341 555 1234')).toBe('+5493415551234');
  });

  it('saca el 15 aunque venga también el 9', () => {
    expect(ar('9 11 15 1234 5678')).toBe('+5491112345678');
  });

  it('no toca un 15 que es parte del número', () => {
    expect(ar('11 1512 3456')).toBe('+5491115123456');
  });

  it('respeta el «+» y el «00»', () => {
    expect(ar('+54 9 341 555-1234')).toBe('+5493415551234');
    expect(ar('00 54 9 341 555 1234')).toBe('+5493415551234');
  });

  it('rechaza lo que no llega a un número nacional de 10 dígitos', () => {
    expect(ar('15 555 1234')).toBeNull();
    expect(ar('123')).toBeNull();
    expect(ar('341 555 12345')).toBeNull();
  });
});

describe('telefonoConPais · otros países', () => {
  it('Brasil: el DDD 55 no se confunde con el código de país', () => {
    expect(telefonoConPais('55 99999 9999', 'Brasil')).toBe('+5555999999999');
    expect(telefonoConPais('(55) 3222-1234', 'Brasil')).toBe('+555532221234');
    expect(telefonoConPais('55 11 99999 9999', 'Brasil')).toBe('+5511999999999');
    expect(telefonoConPais('11 99999 9999', 'Brasil')).toBe('+5511999999999');
  });

  it('Perú: el 51 de Puno tampoco', () => {
    expect(telefonoConPais('51 123456', 'Perú')).toBe('+5151123456');
    expect(telefonoConPais('51 987 654 321', 'Perú')).toBe('+51987654321');
  });

  it('saca el 0 de marcado y reconoce el código sin «+»', () => {
    expect(telefonoConPais('099 123 456', 'Uruguay')).toBe('+59899123456');
    expect(telefonoConPais('598 99 123 456', 'Uruguay')).toBe('+59899123456');
    expect(telefonoConPais('0981 123 456', 'Paraguay')).toBe('+595981123456');
    expect(telefonoConPais('55 1234 5678', 'México')).toBe('+525512345678');
    expect(telefonoConPais('809 555 1234', 'República Dominicana')).toBe('+18095551234');
    expect(telefonoConPais('1 809 555 1234', 'República Dominicana')).toBe('+18095551234');
  });

  it('sin país conocido no inventa un internacional', () => {
    expect(telefonoConPais('341 555 1234', 'Francia')).toBeNull();
    expect(telefonoConPais('+33 6 12 34 56 78', 'Francia')).toBe('+33612345678');
  });
});

describe('PAISES', () => {
  it('sale de la misma tabla que los códigos', () => {
    expect(PAISES).toHaveLength(18);
    expect(PAISES[0]).toBe('Argentina');
    expect(PAISES).toContain('República Dominicana');
    for (const p of PAISES) expect(telefonoConPais('+1 555 123 4567', p)).toBe('+15551234567');
  });
});

describe('telefonoValido', () => {
  it('exige el «+» y entre 8 y 15 dígitos', () => {
    expect(telefonoValido('+5493415551234')).toBe(true);
    expect(telefonoValido('3415551234')).toBe(false);
    expect(telefonoValido('+0123456789')).toBe(false);
    expect(telefonoValido('+1234567')).toBe(false);
  });
});
