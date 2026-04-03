import test from 'node:test';
import assert from 'node:assert/strict';
import { canCloseRound, canMoveToFinalApprovals, isAllowedStatusTransition } from '../flow-rules';

test('bloquea transición v2 inválida', () => {
  const allowed = isAllowedStatusTransition({ from: 'pendiente_insumos', to: 'propuesta_enviada' });
  assert.equal(allowed, false);
});

test('permite cerrar ronda sin comentarios si hay decisiones de producto y calidad', () => {
  const canClose = canCloseRound('aprobado', 'aprobado_con_observaciones_menores');
  assert.equal(canClose, true);
});

test('bloquea aprobaciones finales cuando observaciones menores no están resueltas', () => {
  const allowed = canMoveToFinalApprovals('aprobada_con_observaciones_menores', false);
  assert.equal(allowed, false);
});
