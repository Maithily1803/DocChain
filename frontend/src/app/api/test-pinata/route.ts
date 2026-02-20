import { NextResponse } from "next/server";

export async function GET() {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;

  if (!jwt) {
    return NextResponse.json(
      {
        success: false,
        error: "NEXT_PUBLIC_PINATA_JWT is not set in .env.local",
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      "https://api.pinata.cloud/data/testAuthentication",
      {
        headers: { Authorization: `Bearer ${jwt}` },
      }
    );

    const data: unknown = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Pinata connected!",
        pinata: data,
      });
    } else {
      return NextResponse.json(
        { success: false, error: data },
        { status: response.status }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}