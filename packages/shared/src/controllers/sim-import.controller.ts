/**
 * SIM Import Controller
 *
 * SIMインポートAPIリクエストを受け取り、Service層を呼び出す
 */

import { NextRequest, NextResponse } from 'next/server';
import { SimImportService, ImportRow } from '../services/sim-import.service';
import { logger } from '../shared/utils/logger';

/**
 * SIM一括インポートコントローラー
 */
export async function importSims(
  request: NextRequest,
  prisma: any,
  simImportRowSchema: any
): Promise<NextResponse> {
  // 1. リクエストボディパース
  const body = await request.json();
  const rows: ImportRow[] = body.data;

  // 2. Service呼び出し
  const simImportService = new SimImportService(prisma, simImportRowSchema);
  const result = await simImportService.importSims(rows);

  // 3. レスポンス
  return NextResponse.json(result);
}
