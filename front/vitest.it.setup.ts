import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  createError,
  defineEventHandler,
  getHeader,
  getQuery,
  getRouterParam,
  setResponseStatus,
} from "h3";
import { afterAll, beforeEach, inject, vi } from "vitest";
import {
  buildSpotWhereClause,
  formatCategoryResponse,
  formatMarkerResponse,
  formatSpotResponse,
  getValidationErrorDetails,
  isValidUuid,
} from "./server/utils/api-helpers";
import { readBodyMock } from "./__tests__/it/harness";

// globalSetup が provide した接続 URL から実 PrismaClient を生成する。
const url = inject("databaseUrl");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
(globalThis as { prisma?: PrismaClient }).prisma = prisma;

// Nitro オートインポート（H3 ユーティリティ）をグローバルに注入する。
vi.stubGlobal("defineEventHandler", defineEventHandler);
vi.stubGlobal("getQuery", getQuery);
vi.stubGlobal("getRouterParam", getRouterParam);
vi.stubGlobal("getHeader", getHeader);
vi.stubGlobal("readBody", readBodyMock);
vi.stubGlobal("createError", createError);
vi.stubGlobal("setResponseStatus", setResponseStatus);

// ★ ユニットテストと異なり、prisma は「実 PrismaClient」を注入する（IT の要点）。
vi.stubGlobal("prisma", prisma);

// server/utils（api-helpers）のオートインポート。
vi.stubGlobal("buildSpotWhereClause", buildSpotWhereClause);
vi.stubGlobal("isValidUuid", isValidUuid);
vi.stubGlobal("getValidationErrorDetails", getValidationErrorDetails);
vi.stubGlobal("formatCategoryResponse", formatCategoryResponse);
vi.stubGlobal("formatSpotResponse", formatSpotResponse);
vi.stubGlobal("formatMarkerResponse", formatMarkerResponse);

// 認証は外部 Supabase 境界のためモック維持。デフォルトはオーナーを通す。
vi.stubGlobal(
  "verifyAuth",
  vi.fn().mockResolvedValue({ id: "user-1", email: "owner@example.com" }),
);
vi.stubGlobal(
  "verifyOwner",
  vi.fn().mockResolvedValue({ id: "user-1", email: "owner@example.com" }),
);
vi.stubGlobal("getAllowedEmails", () => ["owner@example.com"]);

// IT は単一 DB を共有するため、各テスト前に全テーブルをクリアする。
beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "map_spots", "map_categories" RESTART IDENTITY CASCADE',
  );
  readBodyMock.mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});
