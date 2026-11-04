import { describe, expect, it } from 'vitest';
import { EventCreationRequestSchema } from '../../../src/modules/events/models/dto/request/event.request.dto';

const base = {
  title: 'Taller de Docker',
  description: 'Introducción práctica a contenedores',
  category: 'ACADEMICO',
  buildingId: 'BLQ-B',
  specificLocation: 'Sala B-201',
  endTime: '2026-11-20T16:00:00.000Z',
};

const accepts = (startTime: string) => EventCreationRequestSchema.safeParse({ ...base, startTime }).success;

describe('Contrato de fechas de un evento', () => {
  it.each([
    '2026-11-20T14:00:00.000Z',
    '2026-11-20T14:00:00Z',
    '2026-11-20T14:00Z',
    '2026-11-20T14:00:00+02:00',
    '2026-11-20T14:00:00+0200',
    '2026-11-20T14:00:00-05:00',
  ])('acepta %s', (value) => {
    expect(accepts(value)).toBe(true);
  });

  it.each([
    'mañana',
    '2026-11-20',
    '2026-11-20T14:00:00',
    '2026-02-30T14:00:00Z',
    '2026-13-01T14:00:00Z',
    '2026-11-20T25:00:00Z',
  ])('rechaza %s', (value) => {
    expect(accepts(value)).toBe(false);
  });
});
