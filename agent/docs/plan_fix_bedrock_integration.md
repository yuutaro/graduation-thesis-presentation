# AWS Bedrock 統合修正計画（構造化出力エラー対応）

## 1. 現状の問題点
`run_experiment.ts` (および `run_batch.ts`) を AWS Bedrock モデル（例: `anthropic.claude-3-haiku-20240307-v1:0`）で実行した際、`withStructuredOutput` の呼び出し部分で以下のエラーが発生し、処理が中断される。

```text
Designer Error: Error: Input is not an AIMessageChunk.
    at RunnableLambda.func (node_modules/@langchain/core/src/language_models/chat_models.ts:982:17)
    ...
```

### 原因の分析
現在使用している `@langchain/community` パッケージの `BedrockChat` クラスにおいて、LangChain Coreの最新機能である `withStructuredOutput` (Tool Calling / Function Calling) のサポートが不完全、またはバージョン間の非互換が発生している可能性が高い。

## 2. 修正方針
AWS Bedrock の新しい Converse API に対応した公式パッケージ **`@langchain/aws`** の **`ChatBedrockConverse`** クラスへ移行する。
Converse API は Tool Use (Function Calling) をネイティブサポートしているため、構造化出力が安定して動作することが期待できる。

## 3. 実装手順（未実行）

### Step 1: パッケージの入れ替え
`@langchain/community` を削除し、`@langchain/aws` をインストールする。
（`@aws-sdk/client-bedrock-runtime` は既にインストール済みだが、念のため維持する）

```bash
npm uninstall @langchain/community
npm install @langchain/aws
```

### Step 2: `agent/src/utils/model-factory.ts` の修正

**変更前:**
```typescript
import { BedrockChat } from "@langchain/community/chat_models/bedrock";

// ...

return new BedrockChat({
  model: modelName,
  region: process.env.AWS_REGION,
  credentials: { ... },
  modelKwargs: { temperature: temperature }
});
```

**変更後 (計画):**
```typescript
import { ChatBedrockConverse } from "@langchain/aws"; // 変更

// ...

return new ChatBedrockConverse({
  model: modelName,
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  temperature: temperature,
  // ChatBedrockConverse は modelKwargs ではなくトップレベルで temperature を受け取る場合があるため、
  // 型定義に従って調整が必要。
});
```

### Step 3: 動作検証
単純なチャットだけでなく、**構造化出力** が正常に動作することを確認するためのスクリプトを作成・実行する。

**検証用スクリプト案 (`scripts/verify_bedrock_structured.ts`):**
```typescript
import 'dotenv/config';
import { z } from "zod";
import { createChatModel } from '../src/utils/model-factory.js';

const TestSchema = z.object({
  answer: z.string(),
  confidence: z.number(),
});

async function main() {
  const model = createChatModel("anthropic.claude-3-haiku-20240307-v1:0", 0.7);
  const structuredModel = model.withStructuredOutput(TestSchema);
  
  const result = await structuredModel.invoke("Is the sky blue?");
  console.log(JSON.stringify(result, null, 2));
}

main();
```

## 4. 補足
この修正を行うまでは、`run_batch.ts` 等での Bedrock モデルの利用は控え、Gemini モデルまたは OpenAI モデルを使用することを推奨する。
