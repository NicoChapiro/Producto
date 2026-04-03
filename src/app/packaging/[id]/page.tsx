'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

type RequestDetail = any;
type FeedbackType = 'success' | 'error';

const checklistStatuses = ['pendiente', 'en_proceso', 'completado', 'rechazado', 'no_aplica'] as const;

function statusLabel(status: string) {
  return status.replaceAll('_', ' ');
}

function statusBadgeStyle(status: string) {
  if (status === 'completado' || status === 'aprobado' || status === 'cerrado') {
    return { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' };
  }
  if (status === 'rechazado' || status === 'cancelado') {
    return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
  }
  if (status === 'en_proceso' || status === 'en_revision' || status === 'propuesta_enviada') {
    return { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' };
  }
  return { background: '#e2e8f0', color: '#1e293b', border: '1px solid #cbd5e1' };
}

export default function PackagingRequestDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id ?? '');
  const [data, setData] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [checklistDrafts, setChecklistDrafts] = useState<Record<string, { status: string; comment: string }>>({});
  const [checklistFeedback, setChecklistFeedback] = useState<Record<string, { type: FeedbackType; message: string }>>({});
  const [savingChecklistId, setSavingChecklistId] = useState<string | null>(null);

  const [approvalComments, setApprovalComments] = useState<Record<string, string>>({});
  const [approvalFeedback, setApprovalFeedback] = useState<Record<string, { type: FeedbackType; message: string }>>({});
  const [savingApprovalStage, setSavingApprovalStage] = useState<string | null>(null);

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

  useEffect(() => {
    if (!data) return;
    const nextChecklistDrafts = Object.fromEntries(
      (data.checklistItems ?? []).map((item: any) => [
        item.id,
        {
          status: item.status,
          comment: item.comment ?? ''
        }
      ])
    );
    setChecklistDrafts(nextChecklistDrafts);

    const nextApprovalComments = Object.fromEntries(
      (data.approvals ?? []).map((approval: any) => [approval.approvalStage, approval.comment ?? ''])
    );
    setApprovalComments(nextApprovalComments);
  }, [data]);

  async function updateGeneralData(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
  }

  async function updateDates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
  }

  async function addFileLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
  }

  async function saveChecklistItem(checklistItemId: string) {
    const draft = checklistDrafts[checklistItemId];
    if (!draft) return;

    setSavingChecklistId(checklistItemId);
    setChecklistFeedback((prev) => {
      const next = { ...prev };
      delete next[checklistItemId];
      return next;
    });

    const response = await fetch(`/api/packaging/${id}/checklist`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checklistItemId,
        status: draft.status,
        comment: draft.comment
      })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'No se pudo actualizar el checklist.' }));
      setChecklistFeedback((prev) => ({
        ...prev,
        [checklistItemId]: {
          type: 'error',
          message: body.message ?? 'No se pudo actualizar el checklist.'
        }
      }));
      setSavingChecklistId(null);
      return;
    }

    setChecklistFeedback((prev) => ({
      ...prev,
      [checklistItemId]: {
        type: 'success',
        message: 'Checklist actualizado.'
      }
    }));

    setSavingChecklistId(null);
    await refresh();
  }

  async function submitApproval(stage: string, status: 'aprobado' | 'rechazado') {
    setSavingApprovalStage(stage);
    setApprovalFeedback((prev) => {
      const next = { ...prev };
      delete next[stage];
      return next;
    });

    const response = await fetch(`/api/packaging/${id}/approvals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage,
        status,
        comment: approvalComments[stage] ?? ''
      })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'No se pudo actualizar la aprobación.' }));
      setApprovalFeedback((prev) => ({
        ...prev,
        [stage]: {
          type: 'error',
          message: body.message ?? 'No se pudo actualizar la aprobación.'
        }
      }));
      setSavingApprovalStage(null);
      return;
    }

    setApprovalFeedback((prev) => ({
      ...prev,
      [stage]: {
        type: 'success',
        message: `Aprobación ${status === 'aprobado' ? 'aprobada' : 'rechazada'} correctamente.`
      }
    }));

    setSavingApprovalStage(null);
    await refresh();
  }

  const sectionCardStyle = useMemo(
    () => ({ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, background: '#fff' }),
    []
  );

  if (loading || !data) return <main style={{ padding: 24 }}>Cargando...</main>;

  return (
    <main style={{ padding: 24, display: 'grid', gap: 16, maxWidth: 1080, margin: '0 auto' }}>
      <section>
        <h1 style={{ marginBottom: 4 }}>
          {data.code} · {data.title}
        </h1>
        <p style={{ marginTop: 0 }}>
          Estado:{' '}
          <span style={{ ...statusBadgeStyle(data.status), padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
            {statusLabel(data.status)}
          </span>{' '}
          · Semáforo: <strong>{statusLabel(data.trafficLight)}</strong>
        </p>
        {error ? (
          <div
            style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 10, borderRadius: 8, color: '#991b1b' }}
          >
            {error}
          </div>
        ) : null}
      </section>

      <section style={sectionCardStyle}>
        <h2 style={{ marginTop: 0 }}>Datos generales</h2>
        <form onSubmit={updateGeneralData} style={{ display: 'grid', gap: 8, maxWidth: 640 }}>
          <label>
            Título
            <input name="title" defaultValue={data.title} />
          </label>
          <label>
            Estado general
            <select name="status" defaultValue={data.status}>
              {[
                'solicitud_ingresada',
                'en_revision',
                'en_proceso',
                'propuesta_enviada',
                'ajustes_correcciones',
                'aprobacion_diseno',
                'aprobacion_calidad',
                'aprobacion_producto',
                'enviado_final',
                'cerrado',
                'rechazado',
                'cancelado'
              ].map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Comentarios generales
            <textarea name="generalComments" defaultValue={data.generalComments ?? ''} />
          </label>
          <button type="submit">Guardar cambios</button>
        </form>
      </section>

      <section style={sectionCardStyle}>
        <h2 style={{ marginTop: 0 }}>Fechas</h2>
        <form onSubmit={updateDates} style={{ display: 'grid', gap: 8, maxWidth: 380 }}>
          <label>
            Fecha de vencimiento
            <input type="date" name="dueDate" defaultValue={data.dueDate.slice(0, 10)} />
          </label>
          <button type="submit">Actualizar vencimiento</button>
        </form>
        <ul>
          <li>Fecha de solicitud: {data.requestDate?.slice(0, 10)}</li>
          <li>Fecha de brief: {data.briefDate?.slice(0, 10) ?? '-'}</li>
          <li>Fecha de propuesta: {data.proposalDate?.slice(0, 10) ?? '-'}</li>
          <li>Fecha de corrección: {data.correctionDate?.slice(0, 10) ?? '-'}</li>
          <li>Fecha final: {data.finalDate?.slice(0, 10) ?? '-'}</li>
        </ul>
      </section>

      <section style={sectionCardStyle}>
        <h2 style={{ marginTop: 0 }}>Responsables</h2>
        <ul>
          <li>Solicitante: {data.requesterName}</li>
          <li>Diseño: {data.designOwnerName}</li>
          <li>Producto: {data.productOwnerName}</li>
          {data.assignees.map((assignee: any) => (
            <li key={assignee.id}>
              {assignee.assigneeName} {assignee.role ? `(${assignee.role})` : ''}
            </li>
          ))}
        </ul>
      </section>

      <section style={sectionCardStyle}>
        <h2 style={{ marginTop: 0 }}>Checklist</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {data.checklistItems.map((item: any) => {
            const draft = checklistDrafts[item.id] ?? { status: item.status, comment: item.comment ?? '' };
            const feedback = checklistFeedback[item.id];
            return (
              <article key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <strong>{item.templateItemName}</strong>
                  <span style={{ ...statusBadgeStyle(draft.status), padding: '2px 8px', borderRadius: 999, fontSize: 12 }}>
                    {statusLabel(draft.status)}
                  </span>
                </div>
                <div style={{ marginTop: 8, display: 'grid', gap: 8, maxWidth: 520 }}>
                  <label>
                    Estado
                    <select
                      value={draft.status}
                      onChange={(event) =>
                        setChecklistDrafts((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...(prev[item.id] ?? { comment: item.comment ?? '' }),
                            status: event.target.value
                          }
                        }))
                      }
                    >
                      {checklistStatuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Comentario (opcional)
                    <textarea
                      value={draft.comment}
                      onChange={(event) =>
                        setChecklistDrafts((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...(prev[item.id] ?? { status: item.status }),
                            comment: event.target.value
                          }
                        }))
                      }
                    />
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => saveChecklistItem(item.id)}
                      disabled={savingChecklistId === item.id}
                    >
                      {savingChecklistId === item.id ? 'Guardando...' : 'Guardar ítem'}
                    </button>
                    {feedback ? (
                      <span
                        style={{
                          fontSize: 13,
                          color: feedback.type === 'success' ? '#166534' : '#991b1b'
                        }}
                      >
                        {feedback.message}
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section style={sectionCardStyle}>
        <h2 style={{ marginTop: 0 }}>Aprobaciones</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {data.approvals.map((approval: any) => {
            const stage = approval.approvalStage;
            const feedback = approvalFeedback[stage];
            return (
              <article key={approval.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <strong>Etapa: {statusLabel(stage)}</strong>
                    <div style={{ fontSize: 14 }}>Aprobador: {approval.approverName}</div>
                  </div>
                  <span
                    style={{ ...statusBadgeStyle(approval.status), padding: '2px 8px', borderRadius: 999, fontSize: 12 }}
                  >
                    {statusLabel(approval.status)}
                  </span>
                </div>

                <div style={{ marginTop: 8, display: 'grid', gap: 8, maxWidth: 560 }}>
                  <label>
                    Comentario (opcional)
                    <textarea
                      value={approvalComments[stage] ?? ''}
                      onChange={(event) =>
                        setApprovalComments((prev) => ({
                          ...prev,
                          [stage]: event.target.value
                        }))
                      }
                    />
                  </label>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => submitApproval(stage, 'aprobado')}
                      disabled={savingApprovalStage === stage}
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => submitApproval(stage, 'rechazado')}
                      disabled={savingApprovalStage === stage}
                    >
                      Rechazar
                    </button>
                    {feedback ? (
                      <span
                        style={{
                          fontSize: 13,
                          color: feedback.type === 'success' ? '#166534' : '#991b1b'
                        }}
                      >
                        {feedback.message}
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section style={sectionCardStyle}>
        <h2 style={{ marginTop: 0 }}>Archivos (links)</h2>
        <form onSubmit={addFileLink} style={{ display: 'grid', gap: 8, maxWidth: 640 }}>
          <select name="fileType" defaultValue="brief">
            {['brief', 'originales', 'propuesta', 'correccion', 'final'].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input name="label" placeholder="Etiqueta" required />
          <input name="url" placeholder="https://..." required />
          <button type="submit">Agregar link</button>
        </form>
        <ul>
          {data.fileLinks.map((file: any) => (
            <li key={file.id}>
              <a href={file.url} target="_blank">
                {file.label}
              </a>{' '}
              ({file.fileType})
            </li>
          ))}
        </ul>
      </section>

      <section style={sectionCardStyle}>
        <h2 style={{ marginTop: 0 }}>Historial</h2>
        <History requestId={id} />
      </section>
    </main>
  );
}

function History({ requestId }: { requestId: string }) {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!requestId) return;
    fetch(`/api/packaging/${requestId}/history`)
      .then((response) => response.json())
      .then(setRows);
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
