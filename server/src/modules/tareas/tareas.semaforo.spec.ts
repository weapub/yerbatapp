import { describe, expect, it } from 'vitest';
import { EstadoTarea, PrioridadTarea } from '@prisma/client';
import { calcularSemaforo } from './tareas.semaforo';

const addDays = (days: number): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

describe('calcularSemaforo', () => {
  it('devuelve ROJO para una tarea vencida', () => {
    expect(
      calcularSemaforo({ estado: EstadoTarea.PENDIENTE, prioridad: PrioridadTarea.BAJA, fechaProgramada: addDays(-2) }),
    ).toBe('ROJO');
  });

  it('devuelve ROJO para prioridad URGENTE aunque falten varios días', () => {
    expect(
      calcularSemaforo({
        estado: EstadoTarea.PENDIENTE,
        prioridad: PrioridadTarea.URGENTE,
        fechaProgramada: addDays(10),
      }),
    ).toBe('ROJO');
  });

  it('devuelve ROJO para prioridad ALTA', () => {
    expect(
      calcularSemaforo({ estado: EstadoTarea.PENDIENTE, prioridad: PrioridadTarea.ALTA, fechaProgramada: addDays(5) }),
    ).toBe('ROJO');
  });

  it('devuelve AMARILLO cuando está a 3 días o menos y no es urgente/alta', () => {
    expect(
      calcularSemaforo({ estado: EstadoTarea.PENDIENTE, prioridad: PrioridadTarea.MEDIA, fechaProgramada: addDays(2) }),
    ).toBe('AMARILLO');
  });

  it('devuelve VERDE cuando falta más de la ventana de aviso', () => {
    expect(
      calcularSemaforo({ estado: EstadoTarea.PENDIENTE, prioridad: PrioridadTarea.MEDIA, fechaProgramada: addDays(10) }),
    ).toBe('VERDE');
  });

  it('devuelve null para tareas completadas, sin importar la fecha', () => {
    expect(
      calcularSemaforo({
        estado: EstadoTarea.COMPLETADA,
        prioridad: PrioridadTarea.URGENTE,
        fechaProgramada: addDays(-5),
      }),
    ).toBeNull();
  });

  it('devuelve null para tareas canceladas', () => {
    expect(
      calcularSemaforo({ estado: EstadoTarea.CANCELADA, prioridad: PrioridadTarea.BAJA, fechaProgramada: addDays(-5) }),
    ).toBeNull();
  });
});
