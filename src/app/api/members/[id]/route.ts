import { NextResponse } from "next/server";

// Placeholder for individual member API routes
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { message: `Member ${params.id} API - Coming soon` },
    { status: 501 }
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { message: `Member ${params.id} API - Coming soon` },
    { status: 501 }
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { message: `Member ${params.id} API - Coming soon` },
    { status: 501 }
  );
}

