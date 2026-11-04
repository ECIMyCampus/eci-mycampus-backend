import type { Prisma } from '@prisma/client';
import type { EventCategory } from '../../models/domain/enums';
import type { RadarCriteria } from '../../models/domain/types';

type EventWhere = Prisma.EventWhereInput;

/**
 * Specification pattern sobre Prisma: cada filtro es un predicado atómico
 * y `radar()` los compone con AND, incluyendo solo los que aplican.
 * El filtrado ocurre SIEMPRE en la base de datos, nunca en memoria.
 */
export const EventSpecs = {
  isPublished(): EventWhere {
    return { status: 'PUBLICADO' };
  },

  notEndedBefore(now: Date): EventWhere {
    return { endTime: { gte: now } };
  },

  hasCategory(category?: EventCategory): EventWhere | undefined {
    return category ? { category } : undefined;
  },

  belongsToFaculty(facultyId?: string): EventWhere | undefined {
    return facultyId ? { facultyId } : undefined;
  },

  /** Eventos que se solapan con el día indicado (00:00 - 23:59:59.999). */
  occursOn(day?: Date): EventWhere | undefined {
    if (!day) return undefined;
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { startTime: { lt: end }, endTime: { gte: start } };
  },

  /** Los eventos privados solo son visibles para miembros de su facultad. */
  visibleTo(viewerFacultyId?: string | null): EventWhere {
    return viewerFacultyId
      ? { OR: [{ isPublic: true }, { facultyId: viewerFacultyId }] }
      : { isPublic: true };
  },

  radar(criteria: RadarCriteria, now: Date): EventWhere {
    const predicates = [
      EventSpecs.isPublished(),
      EventSpecs.notEndedBefore(now),
      EventSpecs.visibleTo(criteria.viewerFacultyId),
      EventSpecs.hasCategory(criteria.category),
      EventSpecs.belongsToFaculty(criteria.facultyId),
      EventSpecs.occursOn(criteria.date),
    ].filter((p): p is EventWhere => p !== undefined);

    return { AND: predicates };
  },
};

