import { z } from "zod";

// --- Response Formatters ---

export function formatSpotResponse(spot: {
  id: string;
  name: string;
  category: { id: string; name: string; color: string };
  latitude: number;
  longitude: number;
  visitedAt: Date;
  memo: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: spot.id,
    name: spot.name,
    category: {
      id: spot.category.id,
      name: spot.category.name,
      color: spot.category.color,
    },
    latitude: spot.latitude,
    longitude: spot.longitude,
    visitedAt: spot.visitedAt.toISOString().split("T")[0],
    memo: spot.memo,
    imageUrl: spot.imageUrl,
    createdAt: spot.createdAt.toISOString(),
    updatedAt: spot.updatedAt.toISOString(),
  };
}

export function formatMarkerResponse(spot: {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  categoryId: string;
  category: { color: string };
}) {
  return {
    id: spot.id,
    name: spot.name,
    latitude: spot.latitude,
    longitude: spot.longitude,
    categoryId: spot.categoryId,
    categoryColor: spot.category.color,
  };
}

export function formatCategoryResponse(
  category: {
    id: string;
    name: string;
    color: string;
    isDefault: boolean;
    sortOrder: number;
  },
  spotCount: number
) {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    isDefault: category.isDefault,
    sortOrder: category.sortOrder,
    spotCount,
  };
}

// --- Query Builders ---

export function buildSpotWhereClause(searchParams: URLSearchParams) {
  const where: Record<string, unknown> = {};
  const conditions: Record<string, unknown>[] = [];

  const category = searchParams.get("category");
  if (category) {
    const ids = category.split(",").filter(Boolean);
    if (ids.length > 0) {
      conditions.push({ categoryId: { in: ids } });
    }
  }

  const q = searchParams.get("q");
  if (q) {
    conditions.push({ name: { contains: q, mode: "insensitive" } });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  return where;
}

// --- Error Helpers ---

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string>
) {
  return Response.json(
    { error: { code, message, ...(details && { details }) } },
    { status }
  );
}

export function validationErrorResponse(zodError: z.core.$ZodError) {
  const details: Record<string, string> = {};
  for (const issue of zodError.issues) {
    const field = issue.path.join(".");
    if (!details[field]) {
      details[field] = issue.message;
    }
  }
  return errorResponse("VALIDATION_ERROR", "入力内容に誤りがあります", 400, details);
}

// --- Param Validation ---

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string): boolean {
  return uuidRegex.test(id);
}
