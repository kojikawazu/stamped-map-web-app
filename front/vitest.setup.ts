import { vi } from "vitest";
import {
  defineEventHandler,
  getQuery,
  getRouterParam,
  getHeader,
  readBody,
  createError,
  setResponseStatus,
} from "h3";
import {
  buildSpotWhereClause,
  isValidUuid,
  getValidationErrorDetails,
  formatCategoryResponse,
  formatSpotResponse,
  formatMarkerResponse,
} from "./server/utils/api-helpers";

// Nitro サーバーグローバル（H3 ユーティリティ）
// Server Routes は defineEventHandler 等を import なしで使うため、
// テスト環境では h3 の実装を直接グローバルとして注入する。
vi.stubGlobal("defineEventHandler", defineEventHandler);
vi.stubGlobal("getQuery", getQuery);
vi.stubGlobal("getRouterParam", getRouterParam);
vi.stubGlobal("getHeader", getHeader);
vi.stubGlobal("readBody", readBody);
vi.stubGlobal("createError", createError);
vi.stubGlobal("setResponseStatus", setResponseStatus);

// Server Utils のオートインポート（api-helpers）
vi.stubGlobal("buildSpotWhereClause", buildSpotWhereClause);
vi.stubGlobal("isValidUuid", isValidUuid);
vi.stubGlobal("getValidationErrorDetails", getValidationErrorDetails);
vi.stubGlobal("formatCategoryResponse", formatCategoryResponse);
vi.stubGlobal("formatSpotResponse", formatSpotResponse);
vi.stubGlobal("formatMarkerResponse", formatMarkerResponse);

// verifyAuth・prisma のデフォルトスタブ（各テストファイルで vi.stubGlobal で上書き可能）
vi.stubGlobal("verifyAuth", vi.fn().mockResolvedValue({ id: "user-1" }));
vi.stubGlobal("prisma", {});
