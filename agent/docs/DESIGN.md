# AIデータ生成エージェント (ArtSquare Agent) 仕様書

## 1. はじめに

本ドキュメントでは、ArtSquareプラットフォーム向けに開発された「AIデータ生成エージェント」の構造と仕様について解説します。このエージェントは、単なるランダムデータではなく、**「シナリオ（コンセプト）」に基づいた文脈のあるテストデータ**を自律的に生成・保存するために設計されています。

## 2. システムの目的

- **リアリティの担保**: ユーザー、プロジェクト、商品（Item）が相互に整合性を持った「小さな社会（シナリオクラスター）」を生成する。
- **多様性の確保**: 過去に生成したデータを記憶し、それらと被らない新しいコンセプトを自律的に考案する。
- **自律運用**: 目標とするデータ分布（例: ガンダム系 50件、手芸系 30件）を与えるだけで、不足分を自動で補う。

## 3. アーキテクチャ概要

本システムは **LangGraph** を用いたステートマシンとして実装されており、以下のノード（工程）が連携して動作します。

```mermaid
graph TD
    subgraph Agent [Agent Process (LangGraph)]
        Director[Director<br>監督]

        subgraph Generator [Generator Subgraph<br>並列生成]
            Designer[Designer<br>構成作家]
            Scenarist[Scenarist<br>脚本家]
            Designer --> Scenarist
        end

        Saver[Saver<br>保存担当]
    end

    subgraph Storage [Agent Storage]
        AgentDB[(SQLite<br>Vector DB)]
    end

    subgraph Backend [Backend System]
        MCPClient[MCP Client]
        MCPServer[MCP Server]
        ProdDB[(PostgreSQL)]
    end

    Director -->|Tasks| Generator
    Generator -->|Results| Director
    Director -->|Done| Saver

    Designer <-->|Vector Search| AgentDB

    Saver -->|Save Scenarios & Logs| AgentDB
    Saver -->|Commit Data| MCPClient

    MCPClient <-->|IPC| MCPServer
    MCPServer -->|Transaction| ProdDB
```

### 3.1 状態管理 (State)

システムは `OverallState` というオブジェクトで全体の進捗状況を管理し、各ノード間でリレーのように受け渡します。

| State変数名            | 型                       | 説明                                                                                                       |
| :--------------------- | :----------------------- | :--------------------------------------------------------------------------------------------------------- |
| **targetDistribution** | `Record<string, number>` | **ユーザー入力**。最終的に達成したい「カテゴリごとの目標件数」。<br>例: `{ "GUNDAM": 10, "HANDCRAFT": 5 }` |
| **pendingTasks**       | `GenerationTask[]`       | Directorが発行した「これから実行すべき生成タスク」のリスト。Generatorに渡される。                          |
| **generatedClusters**  | `ScenarioCluster[]`      | Scenaristによって生成された成果物リスト。タスクが完了するたびに追記される。                                |

### 3.2 各ノードの詳細解説

#### 1. Director (監督)

全体の指揮官です。

- **入力**: `targetDistribution`（目標）と `generatedClusters`（現状の成果）
- **処理**:
  1.  現在の生成数をカテゴリごとに集計します。
  2.  目標数と比較し、不足している分だけタスクを発行します。
  3.  **構造タイプの決定**: タスク発行時、後述の「確率マトリクス」に基づいて、どのような構造（組織型、個人型など）にするかを決定します。
  4.  全ての目標が達成されていれば Saver へ、不足があれば Generator へ遷移します。
- **確率マトリクス (Distribution Matrix)**:
  - カテゴリごとに「どの構造タイプ（Structure Type）が生成されやすいか」を定義した設定値です（現在はコード内に記述）。
  - 例: `GUNDAM` カテゴリなら「組織型(ORGANIZATION)」や「個人型(INDIVIDUAL)」になりやすく、「プロキシ型(PROXY)」は少ない、といった重み付けを行います。これにより、カテゴリらしいデータの偏りを再現します。

#### 2. Generator Subgraph (並列生成部)

Directorから渡されたタスクを1つずつ処理するパイプラインです。並列実行可能です。

- **Designer (構成作家)**
  - **役割**: 「何を作るか」を決めます。
  - **ベクトル検索**: タスクのカテゴリ情報を元に Agent DB を検索し、過去に作った類似シナリオを5件ほど取得します。
  - **コンセプト立案**: 過去のデータと**被らない**ように、新しいテーマ、キーワード、トーン（雰囲気）をLLMに指示させます。これが「コンセプト」となります。

- **Scenarist (脚本家)**
  - **役割**: コンセプトを元に「具体的なデータ」を作ります。
  - **詳細生成**: コンセプトに従い、ユーザー(User)、プロジェクト(Project)、作品(Item)の具体的なフィールド（名前、説明文など）を埋めます。
  - **整合性**: データ同士の結びつき（誰がどのプロジェクトのリーダーか）を `tempId` で定義し、矛盾のないJSONデータを出力します。

#### 3. Saver (保存担当)

生成されたデータを永続化します。

- **本番保存**: BackendのMCP Serverへデータを送信し、アプリケーションDBへ保存します。
- **学習 (記憶)**: 生成に使った「コンセプト」をベクトル化して Agent DB に保存します。これが次回の Designer の検索対象となり、エージェントは「自分が過去に何を作ったか」を学習していきます。

## 4. ユーザー入力と設定

### 4.1 目標の設定 (targetDistribution)

エージェントを実行する際、最初に「どのカテゴリを、合計で何件にしたいか」を指定します。現状は `src/index.ts` 内で以下のように指定します。

```typescript
const inputs = {
  targetDistribution: {
    GUNDAM: 10, // ガンダムカテゴリを累計10件にする
    HANDCRAFT: 5, // 手芸カテゴリを累計5件にする
    MECHANICAL: 3, // からくりカテゴリを累計3件にする
  },
  // ...他は空でOK
};
```

※ Directorは「不足分」のみを追加生成します。既にDBに10件あれば、何もしません。

### 4.2 確率マトリクスの調整

「ガンダムカテゴリなら組織的な活動が多いはずだ」といったドメイン知識は、`src/nodes/director.ts` 内の `DISTRIBUTION_MATRIX` 定数で調整可能です。

```typescript
const DISTRIBUTION_MATRIX = {
  "GUNDAM": {
    "ORGANIZATION": 40, // 40%の確率で組織型になる
    "INDIVIDUAL": 40,
    "COMMUNITY": 10,
    ...
  },
  ...
};
```

## 5. データ管理戦略

(以下変更なし)

## 4. データ管理戦略

エージェントは自身の記憶として **Agent DB (SQLite)** を持ち、本番DBとは独立して稼働します。

### 4.1 Agent DB (`agent/agent.db`)

- **技術スタック**: `better-sqlite3` + `sqlite-vec` (ベクトル検索拡張)
- **役割**:
  - **記憶**: 生成したシナリオのコンセプトをベクトル化して保存。
  - **判断**: 次に何を作るべきか、過去データとの類似度検索で決定。
  - **記録**: 生成時の仮ID (`tempId`) と本番ID (`realId`) の対応表を保存。

### 4.2 テーブル構造

1.  **`scenarios`**: シナリオの基本情報（ID, コンセプトテキスト, メタデータ）。
2.  **`scenarios_vec`**: コンセプトのベクトル埋め込み（768次元）。類似検索に使用。
3.  **`artifact_logs`**: IDマッピングログ。

## 5. 処理フロー詳細

### Step 1: 計画 (Director)

ユーザーが「ハンドメイド系カテゴリのデータをあと2件欲しい（目標合計5件、現状3件）」と入力すると、Directorが現状を確認し、不足分である2つの生成タスクを発行します。この際、確率マトリクスに従って「1つはコミュニティ型、もう1つは個人作家型」のように構造タイプが割り振られます。

### Step 2: 設計 (Designer)

1.  タスクを受け取ったDesignerは、Agent DBを検索します。
    - _「ハンドメイド系で過去に作ったシナリオは？」_ → *「ママ友の手芸サークル」「シルバー人材センターの木工クラブ」*などが見つかる。
2.  LLMが過去データと被らない新しいコンセプトを考案します。
    - _「じゃあ今回は、『廃材を利用したアップサイクル・アクセサリー作家（個人）』にしよう」_

### Step 3: 生成 (Scenarist)

1.  コンセプトに基づき、詳細なプロフィールや関係性をLLMが生成します。
    - ユーザー: `u_eco_artist` (環境意識の高い美大生)
    - プロジェクト: `p_upcycle_2026` (個展の準備)
    - 作品: `i_bottle_glass` (空き瓶で作ったグラス)
2.  **tempId** を使って、データ間のリレーションを構築します。

### Step 4: 保存 (Saver)

1.  **本番保存**: BackendのMCP Serverへデータを送信します。本番DBに保存され、正式なID (UUID) が発行されます。
2.  **ログ保存**: `u_eco_artist` が `user_uuid_999` になったことを `artifact_logs` に記録します。
3.  **記憶更新**: 「廃材アップサイクル作家」というシナリオをベクトル化し、Agent DBに保存します（次回の検索対象になります）。

## 6. コマンド・操作方法

### 開発用コマンド

本エージェントはCLIツールとして動作し、対話的なインターフェース（チャットボットなど）は現在実装されていません。設定ファイルやコード内のパラメータを変更して実行します。

| コマンド                   | 説明                                                                                            |
| :------------------------- | :---------------------------------------------------------------------------------------------- |
| `npm start`                | エージェントを起動し、`src/index.ts` に記述された目標設定に従って生成パイプラインを実行します。 |
| `npm run db:inspect`       | Agent DBの中身（直近のシナリオ）を確認します。                                                  |
| `npm run db:scenario <ID>` | 指定したシナリオIDに紐づくアーティファクト（生成ID一覧）を確認します。                          |
| `npm run db:clear`         | Agent DBを初期化（全削除）します。                                                              |

## 7. 今後の展望・未実装項目

- **MCP Server連携**: 現在、Backendへの保存はモック（シミュレーション）です。実稼働にはBackend側のMCP Server実装が必要です。
- **コンテンツ詳細保存**: Agent DBには現在メタデータのみ保存されています。生成されたテキスト本文も保存するか検討が必要です。
