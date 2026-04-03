import { PrismaClient, PackagingRequestType } from '@prisma/client';

const prisma = new PrismaClient();

const templates: Record<PackagingRequestType, string[]> = {
  nueva: ['Brief recibido', 'EAN recibido', 'DUN recibido', 'Propuesta aprobada', 'VB producto', 'Proveedor validado', 'Artes finales enviados'],
  cambio: ['Brief recibido', 'Propuesta aprobada', 'VB producto', 'Artes finales enviados'],
  correccion: ['Ajuste solicitado', 'Ajuste aplicado', 'VB producto'],
  adaptacion: ['Brief recibido', 'Originales recibidos', 'Propuesta aprobada', 'VB producto', 'Artes finales enviados'],
  reimpresion: ['Solicitud validada', 'Archivo final confirmado', 'Enviado a proveedor'],
  urgencia: ['Brief recibido', 'Priorización confirmada', 'Propuesta aprobada', 'VB producto', 'Envío final'],
  nuevo_producto: ['Brief recibido', 'Nombre validado', 'Referencias visuales recibidas', 'Revisión interna diseño'],
  cambio_actualizacion: ['Brief recibido', 'Cambio validado', 'Revisión interna diseño'],
  correccion_post_original: ['Observaciones recibidas', 'Ajuste aplicado', 'Revisión interna diseño']
};

async function main() {
  for (const [requestType, items] of Object.entries(templates) as [PackagingRequestType, string[]][]) {
    for (const [index, itemName] of items.entries()) {
      await prisma.checklistTemplate.upsert({
        where: {
          requestType_itemName: {
            requestType,
            itemName
          }
        },
        update: {
          itemOrder: index + 1,
          isRequired: true
        },
        create: {
          requestType,
          itemName,
          itemOrder: index + 1,
          isRequired: true
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
