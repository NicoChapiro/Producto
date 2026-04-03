'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type RequestDetail = any;

export default function PackagingRequestDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id ?? '');
  const [data, setData] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const form = event.currentTarget;
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
    form.reset();
    await refresh();
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
      </section>

      <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
        <h2 style={{ marginTop: 0 }}>Datos generales</h2>
        <form onSubmit={updateGeneralData} style={{ display: 'grid', gap: 8, maxWidth: 640 }}>
          <label>Título<input name="title" defaultValue={data.title} /></label>
          <select name="status" defaultValue={data.status}>
            {['solicitud_ingresada','en_revision','en_proceso','propuesta_enviada','ajustes_correcciones','aprobacion_diseno','aprobacion_calidad','aprobacion_producto','enviado_final','cerrado','rechazado','cancelado'].map((status) => (
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
        </ul>
      </section>

      <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
        <h2>Responsables</h2>
        <ul>
          <li>Solicitante: {data.requesterName}</li>
          <li>Diseño: {data.designOwnerName}</li>
          <li>Producto: {data.productOwnerName}</li>
          {data.assignees.map((assignee: any) => (
            <li key={assignee.id}>{assignee.assigneeName} {assignee.role ? `(${assignee.role})` : ''}</li>
          ))}
        </ul>
      </section>

      <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
        <h2>Checklist</h2>
        <ul>
          {data.checklistItems.map((item: any) => (
            <li key={item.id}>{item.templateItemName} - {item.status}</li>
          ))}
        </ul>
      </section>

      <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
        <h2>Aprobaciones</h2>
        <ul>
          {data.approvals.map((approval: any) => (
            <li key={approval.id}>{approval.approvalStage} - {approval.approverName} - {approval.status}</li>
          ))}
        </ul>
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
          {data.fileLinks.map((file: any) => (
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
