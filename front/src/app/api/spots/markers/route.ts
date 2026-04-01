import { prisma } from "@/lib/prisma";
import { verifyAuth, AuthError } from "@/lib/auth";
import {
  formatMarkerResponse,
  buildSpotWhereClause,
  errorResponse,
} from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    await verifyAuth(request);

    const { searchParams } = new URL(request.url);
    const where = buildSpotWhereClause(searchParams);

    const spots = await prisma.mapSpot.findMany({
      where,
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        categoryId: true,
        category: { select: { color: true } },
      },
    });

    return Response.json({ data: spots.map(formatMarkerResponse) });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse("UNAUTHORIZED", error.message, 401);
    }
    console.error("GET /api/spots/markers error:", error);
    return errorResponse("INTERNAL_ERROR", "サーバーエラー", 500);
  }
}
