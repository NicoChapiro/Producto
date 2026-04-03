'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DesignRoundDecision } from '@prisma/client';
import { ROUND_DECISIONS, STATUSES } from '@/modules/packaging/constants';

type UiMessage = { kind: 'success' | 'error'; text: string } | null;

type Assignee = {
  id: string;
  assigneeName: string;
  role?: string | null;
};

type ChecklistItem = {
  id: string;
  templateItemName: string;
  status: string;
};

type Approval = {
  id: string;
  approvalStage: string;
  approverName: string;
  status: string;
};

type FileLink = {
  id: string;
  fileType: string;
  label: string;
  url: string;
};

type DesignRound = {
  id: string;
  roundNumber: number;
  status: string;
  proposalUrl?: string | null;
  designComment?: string | null;
  productComment?: string | null;
  qualityComment?: string | null;
  productDecision?: DesignRoundDecision | null;
  qualityDecision?: DesignRoundDecision | null;
  roundResult?: string | null;
  minorObservationsResolved: boolean;
  closedAt?: string | null;
};

type RequestDetail = {
  id: string;
  code: string;
  title: string;
  status: string;
  trafficLight: string;
  generalComments?: string | null;
  dueDate: string;
  requestDate?: string;
  briefDate?: string | null;
  proposalDate?: string | null;
  correctionDate?: string | null;
  finalDate?: string | null;
  deliveredAt?: string | null;
  receivedByProductAt?: string | null;
  completedAt?: string | null;
  requesterName: string;
  designOwnerName: string;
  productOwnerName: string;
  assignees: Assignee[];
  checklistItems: ChecklistItem[];
  approvals: Approval[];
  designRounds: DesignRound[];
  fileLinks: FileLink[];
};

export default function PackagingRequestDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id ?? '');
  const [data, setData] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<UiMessage>(null);

  async function refresh() {
    if (!id) {
      setError('No se encontró el identificador de la solicitud');
      setLoading(false);
      return;
    }
    setLoading(true);
    const response = await fetch(`/api/packaging/${id}`);
    if (response.ok) {
      setData(await response.json());
      setError(null);
    } else {
      const body = await response.json().catch(() => ({ message: 'No se pudo cargar la solicitud' }));
      setError(body.message ?? 'No se pudo cargar la solicitud');
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [id]);

  async function updateGeneralData(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const fd = new FormData(event.currentTarget);
    const response = await fetch(`/api/packaging/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: String(fd.get('title') ?? ''),
        status: String(fd.get('status') ?? ''),
        generalComments: String(fd.get('generalComments') ?? '')
      })
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'No se pudo actualizar la solicitud' }));
      setError(body.message ?? 'No se pudo actualizar la solicitud');
      return;
    }
    await refresh();
    setMessage({ kind: 'success', text: 'Solicitud actualizada.' });
  }

  async function updateDates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const fd = new FormData(event.currentTarget);
    const response = await fetch(`/api/packaging/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dueDate: String(fd.get('dueDate') ?? '')
      })
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'No se pudo actualizar la fecha' }));
      setError(body.message ?? 'No se pudo actualizar la fecha');
      return;
    }
    await refresh();
    setMessage({ kind: 'success', text: 'Fecha actualizada.' });
  }

  async function addFileLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) return;
    const fd = new FormData(form);
    const response = await fetch(`/api/packaging/${id}/file-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileType: String(fd.get('fileType') ?? 'brief'),
        label: String(fd.get('label') ?? ''),
        url: String(fd.get('url') ?? '')
      })
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'No se pudo agregar el archivo' }));
      setError(body.message ?? 'No se pudo agregar el archivo');
      return;
    }
    form?.reset();
    await refresh();
    setMessage({ kind: 'success', text: 'Link agregado.' });
  }

  async function createRound(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = event.currentTarget;
    const fd = new FormData(form);
    const response = await fetch(`/api/packaging/${id}/rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposalUrl: String(fd.get('proposalUrl') ?? ''),
        designComment: String(fd.get('designComment') ?? ''),
        createdBy: String(fd.get('createdBy') ?? '')
      })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'No se pudo crear la ronda' }));
      setMessage({ kind: 'error', text: body.message ?? 'No se pudo crear la ronda' });
      return;
    }

    form.reset();
    await refresh();
    setMessage({ kind: 'success', text: 'Ronda creada.' });
  }

  async function saveRound(roundId: string, payload: Record<string, unknown>) {
    setMessage(null);
    const response = await fetch(`/api/packaging/${id}/rounds/${roundId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'No se pudo guardar la ronda' }));
      setMessage({ kind: 'error', text: body.message ?? 'No se pudo guardar la ronda' });
      return;
    }

    await refresh();
    setMessage({ kind: 'success', text: 'Ronda guardada.' });
  }

  if (loading || !data) return <main style={{ padding: 24 }}>Cargando...</main>;

  return (
    <main style={{ padding: 24, display: 'grid', gap: 16, maxWidth: 1080, margin: '0 auto' }}>
      <section>
        <h1 style={{ marginBottom: 4 }}>{data.code} · {data.title}</h1>
        <p style={{ marginTop: 0 }}>Estado: <strong>{data.status}</strong> · Semáforo: <strong>{data.trafficLight}</strong></p>
        {error ? (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 10, borderRadius: 8, color: '#991b1b' }}>
            {error}
          </div>
        ) : null}
        {message ? (
          <div
            style={{
              background: message.kind === 'success' ? '#ecfeff' : '#fff7ed',
              border: `1px solid ${message.kind === 'success' ? '#67e8f9' : '#fdba74'}`,
              padding: 10,
              borderRadius: 8,
              color: message.kind === 'success' ? '#155e75' : '#9a3412',
              marginTop: 8
            }}
          >
            {message.text}
          </div>
        ) : null}
      </section>

      <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
        <h2 style={{ marginTop: 0 }}>Datos generales</h2>
        <form onSubmit={updateGeneralData} style={{ display: 'grid', gap: 8, maxWidth: 640 }}>
          <label>Título<input name="title" defaultValue={data.title} /></label>
          <select name="status" defaultValue={data.status}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <label>Comentarios generales<textarea name="generalComments" defaultValue={data.generalComments ?? ''} /></label>
          <button type="submit">Guardar cambios</button>
        </form>
      </section>

      <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
        <h2 style={{ marginTop: 0 }}>Fechas</h2>
        <form onSubmit={updateDates} style={{ display: 'grid', gap: 8, maxWidth: 380 }}>
          <label>Fecha de vencimiento<input type="date" name="dueDate" defaultValue={data.dueDate.slice(0, 10)} /></label>
          <button type="submit">Actualizar vencimiento</button>
        </form>
        <ul>
          <li>Request date: {data.requestDate?.slice(0, 10)}</li>
          <li>Brief date: {data.briefDate?.slice(0, 10) ?? '-'}</li>
          <li>Proposal date: {data.proposalDate?.slice(0, 10) ?? '-'}</li>
          <li>Correction date: {data.correctionDate?.slice(0, 10) ?? '-'}</li>
          <li>Final date: {data.finalDate?.slice(0, 10) ?? '-'}</li>
          <li>Delivered at: {data.deliveredAt?.slice(0, 10) ?? '-'}</li>
          <li>Received by product at: {data.receivedByProductAt?.slice(0, 10) ?? '-'}</li>
          <li>Completed at: {data.completedAt?.slice(0, 10) ?? '-'}</li>
        </ul>
      </section>

      <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
        <h2>Responsables</h2>
        <ul>
          <li>Solicitante: {data.requesterName}</li>
          <li>Diseño: {data.designOwnerName}</li>
          <li>Producto: {data.productOwnerName}</li>
          {data.assignees.map((assignee) => (
            <li key={assignee.id}>{assignee.assigneeName} {assignee.role ? `(${assignee.role})` : ''}</li>
          ))}
        </ul>
      </section>

      <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
        <h2>Checklist</h2>
        <ul>
          {data.checklistItems.map((item) => (
            <li key={item.id}>{item.templateItemName} - {item.status}</li>
          ))}
        </ul>
      </section>

      <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
        <h2>Aprobaciones</h2>
        <ul>
          {data.approvals.map((approval) => (
            <li key={approval.id}>{approval.approvalStage} - {approval.approverName} - {approval.status}</li>
          ))}
        </ul>
      </section>

      <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
        <h2>Rondas</h2>
        <form onSubmit={createRound} style={{ display: 'grid', gap: 8, maxWidth: 700, marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>Crear nueva ronda</h3>
          <input name="createdBy" placeholder="Creado por" />
          <input name="proposalUrl" placeholder="https://..." />
          <textarea name="designComment" placeholder="Comentario de diseño" rows={2} />
          <button type="submit">Crear ronda</button>
        </form>

        {data.designRounds?.length ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {data.designRounds.map((round) => (
              <RoundCard key={round.id} round={round} onSave={saveRound} />
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>Aún no hay rondas registradas.</p>
        )}
      </section>

      <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
        <h2>Archivos (links)</h2>
        <form onSubmit={addFileLink} style={{ display: 'grid', gap: 8, maxWidth: 640 }}>
          <select name="fileType" defaultValue="brief">
            {['brief', 'originales', 'propuesta', 'correccion', 'final'].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input name="label" placeholder="Etiqueta" required />
          <input name="url" placeholder="https://..." required />
          <button type="submit">Agregar link</button>
        </form>
        <ul>
          {data.fileLinks.map((file) => (
            <li key={file.id}><a href={file.url} target="_blank">{file.label}</a> ({file.fileType})</li>
          ))}
        </ul>
      </section>

      <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
        <h2>Historial</h2>
        <History requestId={id} />
      </section>
    </main>
  );
}

function RoundCard({ round, onSave }: { round: DesignRound; onSave: (roundId: string, payload: Record<string, unknown>) => Promise<void> }) {
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    await onSave(round.id, {
      proposalUrl: String(fd.get('proposalUrl') ?? ''),
      designComment: String(fd.get('designComment') ?? ''),
      productComment: String(fd.get('productComment') ?? ''),
      qualityComment: String(fd.get('qualityComment') ?? ''),
      productDecision: String(fd.get('productDecision') ?? ''),
      qualityDecision: String(fd.get('qualityDecision') ?? ''),
      minorObservationsResolved: fd.get('minorObservationsResolved') === 'on'
    });
  }

  async function closeRound() {
    await onSave(round.id, { status: 'cerrada' });
  }

  return (
    <article style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 10 }}>
      <h3 style={{ marginTop: 0 }}>Ronda {round.roundNumber} · {round.status}</h3>
      <p style={{ marginTop: 0, color: '#475569' }}>
        Resultado: <strong>{round.roundResult ?? '-'}</strong> · Cerrada: {round.closedAt ? new Date(round.closedAt).toLocaleString() : 'No'}
      </p>
      <form onSubmit={save} style={{ display: 'grid', gap: 8 }}>
        <input name="proposalUrl" placeholder="https://..." defaultValue={round.proposalUrl ?? ''} />
        <textarea name="designComment" placeholder="Comentario diseño" rows={2} defaultValue={round.designComment ?? ''} />
        <textarea name="productComment" placeholder="Comentario producto" rows={2} defaultValue={round.productComment ?? ''} />
        <textarea name="qualityComment" placeholder="Comentario calidad" rows={2} defaultValue={round.qualityComment ?? ''} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <select name="productDecision" defaultValue={round.productDecision ?? ''}>
            <option value="">Decisión producto</option>
            {ROUND_DECISIONS.map((decision) => <option key={decision} value={decision}>{decision}</option>)}
          </select>
          <select name="qualityDecision" defaultValue={round.qualityDecision ?? ''}>
            <option value="">Decisión calidad</option>
            {ROUND_DECISIONS.map((decision) => <option key={decision} value={decision}>{decision}</option>)}
          </select>
        </div>
        <label>
          <input type="checkbox" name="minorObservationsResolved" defaultChecked={Boolean(round.minorObservationsResolved)} />
          Observaciones menores resueltas
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit">Guardar ronda</button>
          <button type="button" onClick={closeRound}>Cerrar ronda</button>
        </div>
      </form>
    </article>
  );
}

type AuditRow = {
  id: string;
  createdAt: string;
  action: string;
  actor: string;
};

function History({ requestId }: { requestId: string }) {
  const [rows, setRows] = useState<AuditRow[]>([]);

  useEffect(() => {
    if (!requestId) return;
    fetch(`/api/packaging/${requestId}/history`)
      .then((response) => response.json())
      .then((json) => setRows(json as AuditRow[]));
  }, [requestId]);

  return (
    <ul>
      {rows.map((row) => (
        <li key={row.id}>
          {new Date(row.createdAt).toLocaleString()} · {row.action} · {row.actor}
        </li>
      ))}
    </ul>
  );
}
