import { PackagingRequestStatus, PackagingTrafficLight } from '@prisma/client';

export function computeTrafficLight(dueDate: Date, status: PackagingRequestStatus, isClosed: boolean): PackagingTrafficLight {
  if (isClosed || status === 'cancelado' || status === 'cerrado') {
    return 'gris';
  }

  const now = new Date();
  const msRemaining = dueDate.getTime() - now.getTime();
  const daysRemaining = msRemaining / (1000 * 60 * 60 * 24);

  if (daysRemaining < 0) {
    return 'rojo';
  }

  if (daysRemaining <= 2) {
    return 'amarillo';
  }

  return 'verde';
}
