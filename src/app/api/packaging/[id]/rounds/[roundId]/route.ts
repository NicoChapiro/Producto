import { NextRequest, NextResponse } from 'next/server';
import { toHttpError } from '@/modules/packaging/errors';
import { packagingService } from '@/modules/packaging/service';
import { validateUpdateRoundPayload } from '@/modules/packaging/validators';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; roundId: string }> }) {
  try {
    const { id, roundId } = await params;
    const body = await request.json();
    const payload = validateUpdateRoundPayload(body);
    const updated = await packagingService.updateDesignRound(id, roundId, payload);
    return NextResponse.json(updated);
  } catch (error) {
    const http = toHttpError(error);
    return NextResponse.json({ message: http.message }, { status: http.status });
  }
}
