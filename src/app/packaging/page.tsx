import Link from 'next/link';
import { packagingService } from '@/modules/packaging/service';
import { PRIORITIES, REQUEST_TYPES, STATUSES } from '@/modules/packaging/constants';

const badgeStyle: Record<string, { background: string; color: string }> = {
  baja: { background: '#eef2ff', color: '#3730a3' },
  media: { background: '#f1f5f9', color: '#0f172a' },
  alta: { background: '#fff7ed', color: '#9a3412' },
  urgente: { background: '#fef2f2', color: '#991b1b' }
};

const statusLabel: Record<string, string> = {
  solicitud_ingresada: 'Solicitud ingresada',
  en_revision: 'En revisión',
  en_proceso: 'En proceso',
  propuesta_enviada: 'Propuesta enviada',
  ajustes_correcciones: 'Ajustes/correcciones',
  aprobacion_diseno: 'Aprobación diseño',
  aprobacion_calidad: 'Aprobación calidad',
  aprobacion_producto: 'Aprobación producto',
  enviado_final: 'Enviado final',
  cerrado: 'Cerrado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado'
};

function trafficDot(color: string) {
  const map: Record<string, string> = {
    verde: '#16a34a',
    amarillo: '#eab308',
    rojo: '#dc2626',
    gris: '#64748b'
  };
  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: 999,
        marginRight: 6,
        background: map[color] ?? '#64748b'
      }}
    />
  );
}

export default async function PackagingBoardPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const rows = await packagingService.listRequests({
    q: typeof searchParams.q === 'string' ? searchParams.q : undefined,
    status: typeof searchParams.status === 'string' ? searchParams.status : undefined,
    priority: typeof searchParams.priority === 'string' ? searchParams.priority : undefined,
    requestType: typeof searchParams.requestType === 'string' ? searchParams.requestType : undefined,
    owner: typeof searchParams.owner === 'string' ? searchParams.owner : undefined
  });

  return (
    <main style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Packaging Requests</h1>
          <p style={{ margin: '6px 0 0', color: '#334155' }}>Tablero general de solicitudes internas.</p>
        </div>
        <Link href="/packaging/new" style={{ background: '#0f172a', color: 'white', padding: '10px 12px', borderRadius: 8 }}>
          + Nueva solicitud
        </Link>
      </header>

      <form method="GET" style={{ display: 'grid', gap: 10, gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', marginBottom: 18 }}>
        <input defaultValue={typeof searchParams.q === 'string' ? searchParams.q : ''} name="q" placeholder="Buscar por código, título o producto" />
        <select name="status" defaultValue={typeof searchParams.status === 'string' ? searchParams.status : ''}>
          <option value="">Todos los estados</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel[status] ?? status}
            </option>
          ))}
        </select>
        <select name="priority" defaultValue={typeof searchParams.priority === 'string' ? searchParams.priority : ''}>
          <option value="">Todas las prioridades</option>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
        <select name="requestType" defaultValue={typeof searchParams.requestType === 'string' ? searchParams.requestType : ''}>
          <option value="">Todos los tipos</option>
          {REQUEST_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input defaultValue={typeof searchParams.owner === 'string' ? searchParams.owner : ''} name="owner" placeholder="Responsable" />
        <button type="submit" style={{ gridColumn: '1 / -1', width: 140 }}>
          Aplicar filtros
        </button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #e2e8f0' }}>
        <thead style={{ background: '#f8fafc' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: 10 }}>Código</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Título</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Tipo</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Marca / Producto</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Responsables</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Estado</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Prioridad</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Vence</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Semáforo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{ borderTop: '1px solid #e2e8f0' }}>
              <td style={{ padding: 10 }}>
                <Link href={`/packaging/${row.id}`}>{row.code}</Link>
              </td>
              <td style={{ padding: 10 }}>{row.title}</td>
              <td style={{ padding: 10, textTransform: 'capitalize' }}>{row.requestType}</td>
              <td style={{ padding: 10 }}>
                <div>{row.brand}</div>
                <small style={{ color: '#64748b' }}>{row.productName}</small>
              </td>
              <td style={{ padding: 10 }}>
                <div>Diseño: {row.designOwnerName}</div>
                <small style={{ color: '#64748b' }}>Producto: {row.productOwnerName}</small>
              </td>
              <td style={{ padding: 10 }}>{statusLabel[row.status] ?? row.status}</td>
              <td style={{ padding: 10 }}>
                <span style={{ borderRadius: 999, padding: '3px 8px', fontSize: 12, ...(badgeStyle[row.priority] ?? {}) }}>{row.priority}</span>
              </td>
              <td style={{ padding: 10 }}>{row.dueDate.toISOString().slice(0, 10)}</td>
              <td style={{ padding: 10 }}>
                {trafficDot(row.trafficLight)}
                {row.trafficLight}
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ padding: 16, color: '#64748b' }}>
                No hay resultados para los filtros aplicados.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </main>
  );
}
