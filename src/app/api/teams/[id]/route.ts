import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  return NextResponse.json(
    { message: `Team ${id} API - Coming soon` },
    { status: 501 }
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  return NextResponse.json(
    { message: `Team ${id} API - Coming soon` },
    { status: 501 }
  );
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  return NextResponse.json(
    { message: `Team ${id} API - Coming soon` },
    { status: 501 }
  );
}
