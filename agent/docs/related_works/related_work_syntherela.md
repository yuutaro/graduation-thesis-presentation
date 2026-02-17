# 関連研究調査メモ: SyntheRela (ICLR 2025 Workshop)

## 論文情報
- **タイトル:** SyntheRela: A Benchmark For Synthetic Relational Database Generation
- **著者:** Martin Jurkovic, et al. (University of Ljubljana)
- **出典:** ICLR 2025 Workshop on SynthData
- **リンク:** [OpenReview](https://openreview.net/forum?id=ZfQofWYn6n) / [GitHub](https://github.com/martinjurkovic/syntherela)

## 研究の概要
リレーショナルデータベース（RDB）の合成データ生成手法を評価するためのベンチマークフレームワーク「**SyntheRela**」を提案した研究。
SDV, RC-TGAN, REaLTabFormer, ClavaDDPM, RGCLD, TabularARGN といった主要な生成手法を、8つの実データセット（Airbnb, Walmart等）を用いて比較評価した。
評価指標として、テーブル間の関係性を考慮した **C2ST-Agg**（集約特徴量を用いた分類器による二標本検定）や、GNNを用いた有用性評価 **RDL-utility** を提案している。

## 本研究（卒論）への導入・位置づけ

### 1. 引用すべき文脈
「統計的・機械学習的なアプローチによるリレーショナルデータ生成」の現状と課題を示すために引用する。

### 2. 決定的な違い（差別化ポイント）
「**Data-driven (データ駆動)**」か「**Scenario-driven (シナリオ駆動)**」か、というアプローチの違い。

| 特徴 | SyntheRela (Jurkovic et al., 2025) | 本研究 (卒論) |
| :--- | :--- | :--- |
| **アプローチ** | 既存データを学習して分布を模倣する (Data-driven) | LLMが知識と創造性でゼロから生成する (Scenario-driven) |
| **前提条件** | **学習元の実データが存在すること** | **学習元データが不要 (コールドスタート)** |
| **目的** | プライバシー保護、データ共有、アップサンプリング | 新規開発時の動作検証、UI/UXテスト |
| **評価軸** | 統計的分布の一致度 (Fidelity) | 文脈的整合性とリアリティ (Reality) |

### 3. 論文内での記述案（第2章 関連研究）

> 「リレーショナルデータベースの合成データ生成に関しては、Jurkovicら[Ref]がベンチマーク『SyntheRela』を提案し、SDVやREaLTabFormerといった主要な生成手法を比較評価している。彼らの研究は、元データの統計的特性（Fidelity）や機械学習モデルへの有用性（Utility）を維持することに主眼を置いている。
> しかし、これらの手法は『学習元となる大量の既存データ』が存在することを前提としており、本研究が対象とするような『新規サービス開発時（コールドスタート）において、ゼロからテストデータを生成する』という課題には適用できない。
> また、統計的な数値の分布は模倣できても、『ユーザーAがなぜ作品Bを作ったのか』という個別の意味的文脈（社会的シナリオ）までは再現できないため、UX検証には不向きである。」

## 補足
- 統計的手法では「テーブル間の整合性（外部キー制約）」の維持が依然として課題であると報告されており、本研究の「プロセス分解アプローチ（Scenarist -> Designer）」の優位性を間接的に支持している。
