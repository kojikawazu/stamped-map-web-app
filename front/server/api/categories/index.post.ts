import { createCategorySchema } from "~/lib/validations/category";

export default defineEventHandler(async (event) => {
  await verifyAuth(event);

  const body = await readBody(event);
  const result = createCategorySchema.safeParse(body);

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

  // name は schema.prisma で @unique 制約あり → findUnique が使用可能
  const existing = await prisma.mapCategory.findUnique({ where: { name } });
  if (existing) {
    throw createError({
      statusCode: 400,
      data: { code: "DUPLICATE_CATEGORY", message: "同じ名前のカテゴリが既に存在します" },
    });
  }

  const maxSort = await prisma.mapCategory.aggregate({
    _max: { sortOrder: true },
  });
  const sortOrder = (maxSort._max.sortOrder ?? 0) + 1;

  const category = await prisma.mapCategory.create({
    data: { name, color, isDefault: false, sortOrder },
  });

  setResponseStatus(event, 201);
  return { data: formatCategoryResponse(category, 0) };
});
