# 第2章 関連研究 (Related Work) 改訂計画

## 概要
最新の関連論文調査（OmniSQL, SQUiD, SyntheRela, ReFuGe）に基づき、本研究の独自性と貢献をより明確にするための構成案。
既存手法の分類を整理し、「なぜ既存の手法では不十分なのか（Gap）」と「本研究がどう解決するか（Niche）」を論理的に展開する。

## 構成案

### 2.1 ソフトウェアテストデータの生成 (Software Test Data Generation)
- **概要:** 伝統的なルールベースの手法。
- **代表例:** Faker.js [4], Mockaroo
- **限界:** 形式的な整合性（メールアドレスのフォーマット等）は担保できるが、**意味的な文脈（Context）**や**社会的整合性（Social Consistency）**を持たない。
- **本研究との対比:** CtoCプラットフォームのような「ユーザー間の関係性」や「作品の背景ストーリー」が重要なシステムの検証には不十分である。

### 2.2 統計的・機械学習的なデータ合成 (Statistical & ML-based Data Synthesis)
- **概要:** 既存の実データを学習し、その統計的分布を模倣したデータを生成する手法。
- **代表例:** CTGAN (Xu et al., 2019) [Add], **SyntheRela (Jurkovic et al., 2025)** [Add]
- **限界:** **コールドスタート問題 (Cold Start Problem)**。学習元となる大量の実データが存在することを前提としているため、新規サービスの立ち上げ時には適用できない。
- **本研究との対比:** 本研究は、学習データが存在しない「0 -> 1」のフェーズにおいて、LLMの知識と創造性を利用してデータを生成するアプローチをとる。

### 2.3 LLMを用いたリレーショナルデータの構築・操作 (LLM for Relational Data)
- **概要:** LLMの言語理解能力を活かし、複雑なスキーマ構造を持つデータを扱う近年の研究。
- **分類A: 学習データ生成 (Synthesis for Training)**
    - **OmniSQL (Li et al., 2025)** [Add]: Text-to-SQLモデルの学習用に、Webテーブルから多様なスキーマとクエリを合成。
    - *限界:* スキーマの多様性は高いが、レコード（行データ）は最小限のサンプルに留まり、アプリ検証用の密度がない。
- **分類B: 情報抽出・構造化 (Extraction / Structuring)**
    - **SQUiD (Sadia et al., 2025)** [Add]: 非構造化テキストからRDBを構築。スキーマ設計とデータ投入を分離するアーキテクチャを提案。
    - *関連性:* 「直接SQLを書かせると整合性が保てないため、プロセスを分解すべき」という知見は本研究と一致。
- **分類C: データ分析・操作 (Analytics / Feature Engineering)**
    - **ReFuGe (Kim et al., 2026)** [Add]: LLMエージェントによる特徴量生成。
    - *関連性:* LLMが複雑なRDB構造を理解できることを示唆。
- **本研究との対比:** これらの研究は「学習データの作成」や「既存情報の抽出・分析」を目的としている。本研究は、これらと技術基盤（LLM, Agent, Process Decomposition）を共有しつつ、目的を**「架空の社会的シナリオに基づく新規データの創造」**に置く点で独自性がある。

### 2.4 社会シミュレーションと生成的エージェント (Generative Agents)
- **概要:** LLMを用いて人間らしい振る舞いをシミュレートする研究。
- **代表例:** **Generative Agents (Park et al., 2023)** [Add]
- **関連性:** 「記憶」と「計画」に基づく一貫した行動生成という概念は本研究の基礎となっている。
- **限界:** 出力が自然言語のログ（非構造化データ）であることが多く、そのままではリレーショナルデータベースの厳密な制約（外部キー等）を満たすテストデータとして利用できない。
- **本研究の貢献:** Generative Agentsのような「人間らしさ」を維持しつつ、SQUiDのような「構造的整合性」を両立させるシステムアーキテクチャ（Director-Scenarist-Designer）を提案する。

## 必要な作業 (Action Items)
1.  `thesis/references.bib` に以下の文献を追加する。
    - Generative Agents (Park et al., 2023)
    - CTGAN (Xu et al., 2019)
    - OmniSQL (Li et al., 2025)
    - SQUiD (Sadia et al., 2025)
    - SyntheRela (Jurkovic et al., 2025)
    - ReFuGe (Kim et al., 2026)
2.  `thesis/chapters/02_related_work.tex` を上記の構成に従って全面的に書き換える。
