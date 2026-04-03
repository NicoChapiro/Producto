import { NextRequest, NextResponse } from 'next/server';
import { toHttpError } from '@/modules/packaging/errors';
import { packagingService } from '@/modules/packaging/service';
import { validateFileLinkPayload } from '@/modules/packaging/validators';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = validateFileLinkPayload(body);
    const created = await packagingService.addFileLink(id, payload);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const http = toHttpError(error);
    return NextResponse.json({ message: http.message }, { status: http.status });
  }
}
