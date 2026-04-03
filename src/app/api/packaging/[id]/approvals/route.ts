import { NextRequest, NextResponse } from 'next/server';
import { toHttpError } from '@/modules/packaging/errors';
import { packagingService } from '@/modules/packaging/service';
import { validateApprovalPayload } from '@/modules/packaging/validators';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = validateApprovalPayload(body);
    const updated = await packagingService.updateApproval(id, payload.stage, payload);
    return NextResponse.json(updated);
  } catch (error) {
    const http = toHttpError(error);
    return NextResponse.json({ message: http.message }, { status: http.status });
  }
}
