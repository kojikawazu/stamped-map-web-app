import { prisma } from "@/lib/prisma";
import { verifyAuth, AuthError } from "@/lib/auth";
import { updateCategorySchema } from "@/lib/validations/category";
import {
  formatCategoryResponse,
  errorResponse,
  validationErrorResponse,
  isValidUuid,
} from "@/lib/api-helpers";

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
    const result = updateCategorySchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { name, color } = result.data;

    const existing = await prisma.mapCategory.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("NOT_FOUND", "カテゴリが見つかりません", 404);
    }

    const duplicate = await prisma.mapCategory.findFirst({
      where: { name, NOT: { id } },
    });
    if (duplicate) {
      return errorResponse(
        "DUPLICATE_CATEGORY",
        "同じ名前のカテゴリが既に存在します",
        400
      );
    }

    const updated = await prisma.mapCategory.update({
      where: { id },
      data: { name, color },
      include: { _count: { select: { mapSpots: true } } },
    });

    return Response.json({
      data: formatCategoryResponse(updated, updated._count.mapSpots),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse("UNAUTHORIZED", error.message, 401);
    }
    console.error("PUT /api/categories/[id] error:", error);
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

    const category = await prisma.mapCategory.findUnique({
      where: { id },
      include: { _count: { select: { mapSpots: true } } },
    });

    if (!category) {
      return errorResponse("NOT_FOUND", "カテゴリが見つかりません", 404);
    }

    if (category.isDefault) {
      return errorResponse(
        "DEFAULT_CATEGORY_DELETE",
        "デフォルトカテゴリは削除できません",
        400
      );
    }

    if (category._count.mapSpots > 0) {
      return errorResponse(
        "CATEGORY_IN_USE",
        "スポットが紐づいているカテゴリは削除できません",
        400
      );
    }

    await prisma.mapCategory.delete({ where: { id } });

    return Response.json({
      data: { id, message: "Category deleted successfully" },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse("UNAUTHORIZED", error.message, 401);
    }
    console.error("DELETE /api/categories/[id] error:", error);
    return errorResponse("INTERNAL_ERROR", "サーバーエラー", 500);
  }
}
