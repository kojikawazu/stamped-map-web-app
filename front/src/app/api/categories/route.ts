import { prisma } from "@/lib/prisma";
import { verifyAuth, AuthError } from "@/lib/auth";
import { createCategorySchema } from "@/lib/validations/category";
import {
  formatCategoryResponse,
  errorResponse,
  validationErrorResponse,
} from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    await verifyAuth(request);

    const categories = await prisma.mapCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { mapSpots: true } } },
    });

    const data = categories.map((cat) =>
      formatCategoryResponse(cat, cat._count.mapSpots)
    );

    return Response.json({ data });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse("UNAUTHORIZED", error.message, 401);
    }
    console.error("GET /api/categories error:", error);
    return errorResponse("INTERNAL_ERROR", "サーバーエラー", 500);
  }
}

export async function POST(request: Request) {
  try {
    await verifyAuth(request);

    const body = await request.json();
    const result = createCategorySchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { name, color } = result.data;

    const existing = await prisma.mapCategory.findUnique({ where: { name } });
    if (existing) {
      return errorResponse(
        "DUPLICATE_CATEGORY",
        "同じ名前のカテゴリが既に存在します",
        400
      );
    }

    const maxSort = await prisma.mapCategory.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = (maxSort._max.sortOrder ?? 0) + 1;

    const category = await prisma.mapCategory.create({
      data: { name, color, isDefault: false, sortOrder },
    });

    return Response.json(
      { data: formatCategoryResponse(category, 0) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse("UNAUTHORIZED", error.message, 401);
    }
    console.error("POST /api/categories error:", error);
    return errorResponse("INTERNAL_ERROR", "サーバーエラー", 500);
  }
}
