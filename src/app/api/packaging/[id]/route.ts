import { NextRequest, NextResponse } from 'next/server';
import { packagingService } from '@/modules/packaging/service';
import { NotFoundError, toHttpError } from '@/modules/packaging/errors';
import { validateUpdateRequestPayload } from '@/modules/packaging/validators';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await packagingService.getRequestDetail(id);
    if (!data) {
      throw new NotFoundError('Solicitud no encontrada.');
    }
    return NextResponse.json(data);
  } catch (error) {
    const http = toHttpError(error);
    return NextResponse.json({ message: http.message }, { status: http.status });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = validateUpdateRequestPayload(body);
    const updated = await packagingService.updateRequest(id, payload);
    return NextResponse.json(updated);
  } catch (error) {
    const http = toHttpError(error);
    return NextResponse.json({ message: http.message }, { status: http.status });
  }
}
