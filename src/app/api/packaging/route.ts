import { NextRequest, NextResponse } from 'next/server';
import { packagingService } from '@/modules/packaging/service';
import { toHttpError } from '@/modules/packaging/errors';
import { validateCreateRequestPayload } from '@/modules/packaging/validators';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const data = await packagingService.listRequests({
      q: params.get('q') ?? undefined,
      status: params.get('status') ?? undefined,
      priority: params.get('priority') ?? undefined,
      requestType: params.get('requestType') ?? undefined,
      owner: params.get('owner') ?? undefined
    });

    return NextResponse.json(data);
  } catch (error) {
    const http = toHttpError(error);
    return NextResponse.json({ message: http.message }, { status: http.status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = validateCreateRequestPayload(body);
    const created = await packagingService.createRequest(payload);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const http = toHttpError(error);
    return NextResponse.json({ message: http.message }, { status: http.status });
  }
}
