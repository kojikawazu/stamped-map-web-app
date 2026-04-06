import { updateCategorySchema } from "~/lib/validations/category";

export default defineEventHandler(async (event) => {
  await verifyOwner(event);

  const id = getRouterParam(event, "id");
  if (!id || !isValidUuid(id)) {
    throw createError({ statusCode: 400, data: { code: "VALIDATION_ERROR", message: "無効なID形式です" } });
  }

  const body = await readBody(event);
  const result = updateCategorySchema.safeParse(body);

  if (!result.success) {
    throw createError({
      statusCode: 400,
      data: {
        code: "VALIDATION_ERROR",
        message: "入力内容に誤りがあります",
        details: getValidationErrorDetails(result.error),
      },
    });
  }

  const { name, color } = result.data;

  const existing = await prisma.mapCategory.findUnique({ where: { id } });
  if (!existing) {
    throw createError({ statusCode: 404, data: { code: "NOT_FOUND", message: "カテゴリが見つかりません" } });
  }

  const duplicate = await prisma.mapCategory.findFirst({
    where: { name, NOT: { id } },
  });
  if (duplicate) {
    throw createError({
      statusCode: 400,
      data: { code: "DUPLICATE_CATEGORY", message: "同じ名前のカテゴリが既に存在します" },
    });
  }

  const updated = await prisma.mapCategory.update({
    where: { id },
    data: { name, color },
    include: { _count: { select: { mapSpots: true } } },
  });

  return { data: formatCategoryResponse(updated, updated._count.mapSpots) };
});
