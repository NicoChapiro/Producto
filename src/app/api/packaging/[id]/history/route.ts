import { NextRequest, NextResponse } from 'next/server';
import { NotFoundError, toHttpError } from '@/modules/packaging/errors';
import { packagingService } from '@/modules/packaging/service';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const request = await packagingService.getRequestDetail(params.id);
    if (!request) {
      throw new NotFoundError('Solicitud no encontrada.');
    }
    const data = await packagingService.getRequestHistory(params.id);
    return NextResponse.json(data);
  } catch (error) {
    const http = toHttpError(error);
    return NextResponse.json({ message: http.message }, { status: http.status });
  }
}
