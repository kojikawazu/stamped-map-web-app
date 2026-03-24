import { prisma } from "@/lib/prisma";
import { verifyAuth, AuthError } from "@/lib/auth";
import { updateSpotSchema } from "@/lib/validations/spot";
import {
  formatSpotResponse,
  errorResponse,
  validationErrorResponse,
  isValidUuid,
} from "@/lib/api-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAuth(request);

    const { id } = await params;
    if (!isValidUuid(id)) {
      return errorResponse("VALIDATION_ERROR", "無効なID形式です", 400);
    }

    const spot = await prisma.mapSpot.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!spot) {
      return errorResponse("NOT_FOUND", "スポットが見つかりません", 404);
    }

    return Response.json({ data: formatSpotResponse(spot) });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse("UNAUTHORIZED", error.message, 401);
    }
    console.error("GET /api/spots/[id] error:", error);
    return errorResponse("INTERNAL_ERROR", "サーバーエラー", 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAuth(request);

    const { id } = await params;
    if (!isValidUuid(id)) {
      return errorResponse("VALIDATION_ERROR", "無効なID形式です", 400);
    }

    const body = await request.json();
    const result = updateSpotSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const existing = await prisma.mapSpot.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("NOT_FOUND", "スポットが見つかりません", 404);
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

    const updated = await prisma.mapSpot.update({
      where: { id },
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

    return Response.json({ data: formatSpotResponse(updated) });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse("UNAUTHORIZED", error.message, 401);
    }
    console.error("PUT /api/spots/[id] error:", error);
    return errorResponse("INTERNAL_ERROR", "サーバーエラー", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAuth(request);

    const { id } = await params;
    if (!isValidUuid(id)) {
      return errorResponse("VALIDATION_ERROR", "無効なID形式です", 400);
    }

    const existing = await prisma.mapSpot.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("NOT_FOUND", "スポットが見つかりません", 404);
    }

    await prisma.mapSpot.delete({ where: { id } });

    return Response.json({
      data: { id, message: "Spot deleted successfully" },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse("UNAUTHORIZED", error.message, 401);
    }
    console.error("DELETE /api/spots/[id] error:", error);
    return errorResponse("INTERNAL_ERROR", "サーバーエラー", 500);
  }
}
