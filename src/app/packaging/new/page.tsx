'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPackagingRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    const getTrimmed = (field: string) => String(formData.get(field) ?? '').trim();
    const assigneeName = getTrimmed('assigneeName');
    const assigneeRole = getTrimmed('assigneeRole');

    const payload: Record<string, unknown> = {
      title: getTrimmed('title'),
      requestType: getTrimmed('requestType') || 'nuevo_producto',
      brand: getTrimmed('brand'),
      category: getTrimmed('category'),
      productName: getTrimmed('productName'),
      requesterName: getTrimmed('requesterName'),
      designOwnerName: getTrimmed('designOwnerName'),
      productOwnerName: getTrimmed('productOwnerName'),
      requestDate: getTrimmed('requestDate'),
      dueDate: getTrimmed('dueDate'),
      priority: getTrimmed('priority') || 'media'
    };

    const optionalFields = [
      'projectName',
      'internalCode',
      'sku',
      'ean',
      'dun',
      'generalComments',
      'sharepointFolderUrl'
    ];

    for (const field of optionalFields) {
      const value = getTrimmed(field);
      if (value) {
        payload[field] = value;
      }
    }

    if (assigneeName) {
      payload.assignees = [
        {
          assigneeName,
          ...(assigneeRole ? { role: assigneeRole } : {})
        }
      ];
    }

    setLoading(true);
    const response = await fetch('/api/packaging', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'No se pudo crear la solicitud' }));
      setError(data.message ?? 'No se pudo crear la solicitud');
      return;
    }

    const created = await response.json();
    router.push(`/packaging/${created.id}`);
  }

  return (
    <main style={{ padding: 24, maxWidth: 980, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 4 }}>Nueva solicitud de packaging</h1>
      <p style={{ marginTop: 0, color: '#475569' }}>Completa los datos mínimos para generar la solicitud.</p>

      {error ? (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 10, borderRadius: 8, color: '#991b1b', marginBottom: 12 }}>
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
        <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, display: 'grid', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Datos generales</h2>
          <label>Título<input required name="title" placeholder="Ej: Cambio frente paquete 250g" /></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>Marca<input required name="brand" placeholder="Marley Coffee" defaultValue="Marley Coffee" /></label>
            <label>Categoría<input required name="category" placeholder="Café molido / cápsulas..." /></label>
          </div>
          <label>Producto<input required name="productName" placeholder="Producto objetivo" /></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <label>Proyecto<input name="projectName" placeholder="(Opcional)" /></label>
            <label>Código interno<input name="internalCode" placeholder="(Opcional)" /></label>
            <label>SKU<input name="sku" placeholder="(Opcional)" /></label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>EAN<input name="ean" placeholder="(Opcional)" /></label>
            <label>DUN<input name="dun" placeholder="(Opcional)" /></label>
          </div>
        </section>

        <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, display: 'grid', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Responsables y prioridad</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <label>Solicitante<input required name="requesterName" placeholder="Nombre" /></label>
            <label>Responsable diseño<input required name="designOwnerName" placeholder="Nombre" defaultValue="Herman" /></label>
            <label>Responsable producto<input required name="productOwnerName" placeholder="Nombre" defaultValue="Nicole" /></label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>Encargado adicional<input name="assigneeName" placeholder="(Opcional)" /></label>
            <label>Rol encargado<input name="assigneeRole" placeholder="(Opcional)" /></label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>
              Tipo de solicitud
              <select name="requestType" defaultValue="nuevo_producto">
                <option value="nuevo_producto">Nuevo producto</option>
                <option value="cambio_actualizacion">Cambio / actualización</option>
                <option value="correccion">Corrección</option>
                <option value="reimpresion">Reimpresión</option>
                <option value="urgencia">Urgencia</option>
                <option value="correccion_post_original">Corrección post original</option>
              </select>
            </label>
            <label>
              Prioridad
              <select name="priority" defaultValue="media">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </label>
          </div>
        </section>

        <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, display: 'grid', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Fechas y comentarios</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>
              Fecha de solicitud
              <input required type="date" name="requestDate" defaultValue={new Date().toISOString().slice(0, 10)} />
            </label>
            <label>
              Fecha de vencimiento
              <input required type="date" name="dueDate" />
            </label>
          </div>
          <label>Comentarios generales<textarea name="generalComments" placeholder="Información adicional para el equipo..." rows={4} /></label>
          <label>Carpeta SharePoint<input name="sharepointFolderUrl" placeholder="https://..." /></label>
        </section>

        <button type="submit" disabled={loading} style={{ width: 190, padding: '10px 12px' }}>
          {loading ? 'Guardando...' : 'Crear solicitud'}
        </button>
      </form>
    </main>
  );
}
