import { NextRequest, NextResponse } from 'next/server';
import { toHttpError } from '@/modules/packaging/errors';
import { packagingService } from '@/modules/packaging/service';
import { validateApprovalPayload } from '@/modules/packaging/validators';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const payload = validateApprovalPayload(body);
    const updated = await packagingService.updateApproval(params.id, payload.stage, payload);
    return NextResponse.json(updated);
  } catch (error) {
    const http = toHttpError(error);
    return NextResponse.json({ message: http.message }, { status: http.status });
  }
}
