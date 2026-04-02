# Producto

Base inicial del módulo interno **Packaging Requests** para Marley Coffee.

## Stack detectado y decisión
El repositorio no tenía aplicación previa (solo `README.md`), por lo que se implementó una base mínima con:
- Next.js (App Router) para páginas/rutas internas.
- Route Handlers (`src/app/api/...`) para API.
- Prisma + PostgreSQL para persistencia.
- Capa separada en `src/modules/packaging` (service/repository/domain helpers).

## Módulo Packaging
Rutas:
- `/packaging`
- `/packaging/new`
- `/packaging/[id]`

API:
- `GET/POST /api/packaging`
- `GET/PATCH /api/packaging/:id`
- `PATCH /api/packaging/:id/checklist`
- `PATCH /api/packaging/:id/approvals`
- `POST /api/packaging/:id/file-links`
- `GET /api/packaging/:id/history`

## Base de datos
- Ver `prisma/schema.prisma`.
- Migración SQL inicial en `prisma/migrations/202604020001_packaging_requests/migration.sql`.
- Seed de `checklist_templates` en `prisma/seed-packaging.ts`.

## Ejecutar localmente
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Configurar `DATABASE_URL` en `.env`.
3. Migrar:
   ```bash
   npx prisma migrate dev
   ```
4. Seed:
   ```bash
   npm run prisma:seed
   ```
5. Levantar app:
   ```bash
   npx next dev
   ```
