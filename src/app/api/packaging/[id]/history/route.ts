import { NextRequest, NextResponse } from 'next/server';
import { NotFoundError, toHttpError } from '@/modules/packaging/errors';
import { packagingService } from '@/modules/packaging/service';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const request = await packagingService.getRequestDetail(id);
    if (!request) {
      throw new NotFoundError('Solicitud no encontrada.');
    }
    const data = await packagingService.getRequestHistory(id);
    return NextResponse.json(data);
  } catch (error) {
    const http = toHttpError(error);
    return NextResponse.json({ message: http.message }, { status: http.status });
  }
}
