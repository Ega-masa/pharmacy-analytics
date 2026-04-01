# 薬局経営分析ダッシュボード

薬局グループ向け月次経営KPI分析・偏差値評価Webアプリ。

## 機能

- **データ入力**: 5種類の管理システムレポートをペーストするだけで登録
- **偏差値計算**: 全店を母集団とした自動偏差値・順位算出
- **店舗ダッシュボード**: レーダーチャート・12ヶ月トレンドグラフ
- **全店比較表**: ソート可能な偏差値ランキング表
- **バブルチャート**: 軸切替対応の散布図比較
- **ロール管理**: 管理者 / 店舗 / 個人 / 入力担当の4ロール

## 偏差値計算対象 KPI

| カテゴリ | 項目 |
|---|---|
| 収益 | 収益・受付回数・技術料単価・薬剤料単価・総合 |
| 次回再来 | 全体再来率・新患再来率・継続率・患者対応（離脱率逆） |
| 薬学管理 | 重複防止・一包化・外来一包化・トレーシングレポート・特定加算 |

## 技術スタック

| 層 | 技術 |
|---|---|
| フロントエンド | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| チャート | Recharts |
| バックエンド/DB | Supabase (PostgreSQL + Auth + RLS) |
| ホスティング | Vercel |

## セットアップ手順

### 1. Supabase セットアップ

1. [supabase.com](https://supabase.com) でプロジェクト作成
2. SQL Editor で `supabase/setup.sql` を実行
3. Authentication > Settings > Email confirm をオフ（任意）
4. Project Settings > API から URL と anon key、service_role key をコピー

### 2. 管理者アカウント作成

Supabase Dashboard > Authentication > Users から管理者メールアドレスでユーザー招待後、
SQL Editor で以下を実行:

```sql
INSERT INTO users (id, email, name, role)
VALUES (
  '<auth.users から UUID をコピー>',
  'admin@your-company.com',
  '管理者',
  'admin'
);
```

### 3. 店舗マスタ登録

管理画面から1店舗ずつ登録するか、SQL で一括挿入:

```sql
INSERT INTO stores (name, store_code, level1) VALUES
  ('〇〇薬局 △△店', '管理番号', 'エリア名'),
  ...;
```

> **重要**: `store_code` はデータCSVの「お客様管理番号」列の値と完全一致させてください。

### 4. ローカル開発

```bash
cp .env.example .env.local
# .env.local に Supabase の値を入力

npm install
npm run dev
```

### 5. Vercel デプロイ

```bash
# GitHub にプッシュ後、Vercel でインポート
# Environment Variables に以下を設定:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

## データ入力の流れ（毎月）

1. ログイン（管理者）
2. 「データ入力」メニュー → 対象年月を選択
3. 管理システムから各レポートをコピー（Ctrl+A → Ctrl+C）
4. 対応するタブを選択してペースト（Ctrl+V）
5. プレビューで内容を確認 → 「保存」ボタン
6. 5種類すべて保存後「偏差値を計算・保存」ボタンをクリック

## ロール権限

| ロール | 閲覧範囲 | データ入力 | ユーザー管理 |
|---|---|---|---|
| admin | 全店 | ○ | ○ |
| store_manager | 自店 + 全店比較 | ✗ | ✗ |
| individual | 自店のみ | ✗ | ✗ |
| data_entry | なし | ○ | ✗ |
