import { prisma } from "@/lib/prisma";
import { verifyAuth, AuthError } from "@/lib/auth";
import { createSpotSchema } from "@/lib/validations/spot";
import {
  formatSpotResponse,
  buildSpotWhereClause,
  errorResponse,
  validationErrorResponse,
} from "@/lib/api-helpers";

const SORT_FIELD_MAP: Record<string, string> = {
  visited_at: "visitedAt",
  created_at: "createdAt",
};

export async function GET(request: Request) {
  try {
    await verifyAuth(request);

    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
    const sortParam = searchParams.get("sort") ?? "visited_at";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const sortField = SORT_FIELD_MAP[sortParam] ?? "visitedAt";
    const where = buildSpotWhereClause(searchParams);

    const [spots, total] = await Promise.all([
      prisma.mapSpot.findMany({
        where,
        include: { category: true },
        orderBy: { [sortField]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.mapSpot.count({ where }),
    ]);

    return Response.json({
      data: spots.map(formatSpotResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse("UNAUTHORIZED", error.message, 401);
    }
    console.error("GET /api/spots error:", error);
    return errorResponse("INTERNAL_ERROR", "サーバーエラー", 500);
  }
}

export async function POST(request: Request) {
  try {
    await verifyAuth(request);

    const body = await request.json();
    const result = createSpotSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { name, categoryId, latitude, longitude, visitedAt, memo } =
      result.data;

    const categoryExists = await prisma.mapCategory.findUnique({
      where: { id: categoryId },
    });
    if (!categoryExists) {
      return errorResponse("VALIDATION_ERROR", "入力内容に誤りがあります", 400, {
        categoryId: "指定されたカテゴリが存在しません",
      });
    }

    const spot = await prisma.mapSpot.create({
      data: {
        name,
        categoryId,
        latitude,
        longitude,
        visitedAt: new Date(visitedAt),
        memo: memo || null,
      },
      include: { category: true },
    });

    return Response.json({ data: formatSpotResponse(spot) }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse("UNAUTHORIZED", error.message, 401);
    }
    console.error("POST /api/spots error:", error);
    return errorResponse("INTERNAL_ERROR", "サーバーエラー", 500);
  }
}
