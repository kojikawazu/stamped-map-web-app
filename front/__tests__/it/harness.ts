import { IncomingMessage, ServerResponse } from "node:http";
import { createEvent } from "h3";
import { vi } from "vitest";
import type { PrismaClient } from "@prisma/client";

/**
 * `readBody` のモック。IT でも HTTP ボディの実ストリーム構築は避け、
 * 各テストで戻り値を設定する（vitest.it.setup.ts が global の readBody に割り当てる）。
 */
export const readBodyMock = vi.fn();

/**
 * IT 用の実 PrismaClient を返す。`vitest.it.setup.ts` が globalThis に設定する。
 *
 * @returns テスト DB へ接続済みの PrismaClient
 * @throws セットアップ前に呼ばれた場合
 */
export function db(): PrismaClient {
  const p = (globalThis as { prisma?: PrismaClient }).prisma;
  if (!p) throw new Error("test prisma is not initialized");
  return p;
}

/**
 * ハンドラー呼び出し用の H3 イベントを生成する。
 *
 * @param method - HTTP メソッド
 * @param path - リクエストパス
 * @param params - ルートパラメータ（`:id` など）
 * @returns 構築した H3 イベント
 */
export function makeEvent(
  method: string,
  path: string,
  params?: Record<string, string>,
) {
  const req = Object.assign(new IncomingMessage(null as never), {
    method,
    url: path,
    headers: { authorization: "Bearer test-token" },
  });
  const res = new ServerResponse(req);
  const event = createEvent(req, res);
  if (params) {
    (event.context as Record<string, unknown>).params = params;
  }
  return event;
}
