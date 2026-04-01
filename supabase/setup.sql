-- ============================================================
-- 薬局経営分析ダッシュボード Supabase セットアップ SQL
-- ============================================================

-- 1. 店舗マスタ
CREATE TABLE stores (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  store_code   text UNIQUE,          -- お客様管理番号
  level1       text,                  -- エリア
  level2       text,                  -- サブエリア
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

-- 2. ユーザー (auth.usersと連携)
CREATE TABLE users (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL,
  name       text,
  role       text NOT NULL CHECK (role IN ('admin','store_manager','individual','data_entry')),
  store_id   uuid REFERENCES stores(id),   -- store_manager / individual 用
  created_at timestamptz DEFAULT now()
);

-- 3. 収益系分析
CREATE TABLE revenue_analysis (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month               text NOT NULL,   -- 'YYYY-MM'
  store_id                 uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  total_revenue            bigint,
  prescription_revenue     bigint,
  prescription_unit_price  numeric(10,2),
  visit_count              int,
  prescription_score       int,
  dispensing_base_fee      bigint,
  drug_preparation_fee     bigint,
  addition_fee             bigint,
  guidance_mgmt_fee        bigint,
  drug_fee                 bigint,
  -- 技術料単価 = (dispensing_base_fee + drug_preparation_fee + addition_fee + guidance_mgmt_fee) / visit_count
  tech_fee_unit            numeric(10,2),
  drug_fee_unit            numeric(10,2),
  -- 新患率用 (次回再来分析から補完)
  new_patient_rate         numeric(6,4),
  created_at               timestamptz DEFAULT now(),
  UNIQUE(year_month, store_id)
);

-- 4. 次回再来分析
CREATE TABLE revisit_analysis (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month               text NOT NULL,
  store_id                 uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  overall_patient_count    int,
  overall_revisit_rate     numeric(6,4),
  overall_visited          int,
  overall_unvisited_med    int,
  overall_unvisited_drop   int,
  new_patient_count        int,
  new_revisit_rate         numeric(6,4),
  renew_patient_count      int,
  renew_revisit_rate       numeric(6,4),
  returning_patient_count  int,
  returning_revisit_rate   numeric(6,4),
  created_at               timestamptz DEFAULT now(),
  UNIQUE(year_month, store_id)
);

-- 5. 薬学管理料（外来）
CREATE TABLE pharma_mgmt_outpatient (
  id                               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month                       text NOT NULL,
  store_id                         uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  -- 服薬管理指導料
  medication_guidance_outpatient   int,
  medication_guidance_special      int,
  medication_guidance_online       int,
  -- かかりつけ薬剤師指導料
  family_pharmacist_count          int,
  family_pharmacist_possible       int,
  family_pharmacist_rate           numeric(6,4),
  -- 特定薬剤管理指導加算1
  specific_drug_count              int,
  specific_drug_target             int,
  specific_drug_rate               numeric(6,4),
  -- 重複投薬・相互作用等防止加算
  duplicate_prevention_count       int,
  duplicate_residual_count         int,
  -- 外来服薬支援料
  outpatient_support_1             int,
  outpatient_support_2_under42     int,
  outpatient_support_2_over43      int,
  -- 服薬情報提供料
  med_info_1                       int,
  med_info_2_hospital              int,  -- トレーシングレポート
  med_info_2_refill                int,
  med_info_3                       int,
  -- 調剤後薬剤管理指導料
  post_dispense_mgmt_1             int,
  post_dispense_mgmt_2             int,
  -- 医療DX推進体制整備加算
  medical_dx_1                     int,
  medical_dx_2                     int,
  medical_dx_3                     int,
  created_at                       timestamptz DEFAULT now(),
  UNIQUE(year_month, store_id)
);

-- 6. 薬学管理料（在宅）
CREATE TABLE pharma_mgmt_home (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month               text NOT NULL,
  store_id                 uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  home_visit_single        int,
  home_visit_multi         int,
  home_visit_other         int,
  home_resident_single     int,
  home_resident_multi      int,
  home_resident_other      int,
  care_home_single         int,
  care_home_multi          int,
  care_home_other          int,
  created_at               timestamptz DEFAULT now(),
  UNIQUE(year_month, store_id)
);

-- 7. 地域支援体制加算算定実績
CREATE TABLE regional_support (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month          text NOT NULL,
  store_id            uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  achievement_count   int,
  prescription_count  int,
  item1_night         int,   -- 夜間・休日等の対応
  item2_narcotics     int,   -- 麻薬の調剤
  item3_duplicate     int,   -- 重複投薬・相互作用等防止
  item4_family        int,   -- かかりつけ薬剤師指導料等
  item5_out_support   int,   -- 外来服薬支援料1
  item6_drug_adjust   int,   -- 服用薬剤調整支援料
  item7_home_single   int,   -- 単一建物診療患者1人の在宅薬剤管理
  item8_med_info      int,   -- 服薬情報等提供料
  item9_pediatric     int,   -- 小児特定加算
  created_at          timestamptz DEFAULT now(),
  UNIQUE(year_month, store_id)
);

-- 8. 偏差値・順位（毎月データ登録後に計算して保存）
CREATE TABLE deviation_scores (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month                   text NOT NULL,
  store_id                     uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  total_store_count            int,
  -- 収益系
  revenue_value                bigint,
  revenue_deviation            numeric(5,1),
  revenue_rank                 int,
  visit_count_value            int,
  visit_count_deviation        numeric(5,1),
  visit_count_rank             int,
  tech_fee_unit_value          numeric(10,2),
  tech_fee_unit_deviation      numeric(5,1),
  tech_fee_unit_rank           int,
  drug_fee_unit_value          numeric(10,2),
  drug_fee_unit_deviation      numeric(5,1),
  drug_fee_unit_rank           int,
  total_deviation              numeric(5,1),
  total_rank                   int,
  -- 次回再来
  overall_revisit_value        numeric(6,4),
  overall_revisit_deviation    numeric(5,1),
  overall_revisit_rank         int,
  new_revisit_value            numeric(6,4),
  new_revisit_deviation        numeric(5,1),
  new_revisit_rank             int,
  dropout_rate                 numeric(6,4),
  retention_value              numeric(6,4),
  retention_deviation          numeric(5,1),
  retention_rank               int,
  patient_response_deviation   numeric(5,1),
  patient_response_rank        int,
  -- 薬学管理
  duplicate_count              int,
  duplicate_rate               numeric(6,4),
  duplicate_deviation          numeric(5,1),
  duplicate_rank               int,
  one_pack_count               int,
  one_pack_rate                numeric(6,4),
  one_pack_deviation           numeric(5,1),
  one_pack_rank                int,
  one_pack_outpatient_count    int,
  one_pack_outpatient_deviation numeric(5,1),
  one_pack_outpatient_rank     int,
  tracing_report_count         int,
  tracing_report_rate          numeric(6,4),
  tracing_report_deviation     numeric(5,1),
  tracing_report_rank          int,
  specific_add_count           int,
  specific_add_rate            numeric(6,4),
  specific_add_deviation       numeric(5,1),
  specific_add_rank            int,
  created_at                   timestamptz DEFAULT now(),
  updated_at                   timestamptz DEFAULT now(),
  UNIQUE(year_month, store_id)
);

-- ============================================================
-- RLS (Row Level Security) ポリシー
-- ============================================================

ALTER TABLE stores             ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_analysis   ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisit_analysis   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharma_mgmt_outpatient ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharma_mgmt_home   ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_support   ENABLE ROW LEVEL SECURITY;
ALTER TABLE deviation_scores   ENABLE ROW LEVEL SECURITY;

-- ヘルパー関数
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_store_id()
RETURNS uuid AS $$
  SELECT store_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- stores ポリシー
CREATE POLICY "stores_select" ON stores FOR SELECT
  USING (get_my_role() IN ('admin','data_entry','store_manager','individual'));

-- users ポリシー
CREATE POLICY "users_select_self" ON users FOR SELECT
  USING (id = auth.uid() OR get_my_role() = 'admin');
CREATE POLICY "users_insert_admin" ON users FOR INSERT
  WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "users_update_admin" ON users FOR UPDATE
  USING (get_my_role() = 'admin');
CREATE POLICY "users_delete_admin" ON users FOR DELETE
  USING (get_my_role() = 'admin');

-- 分析データ共通ポリシーを生成する関数
CREATE OR REPLACE FUNCTION create_analysis_policies(tbl text) RETURNS void AS $$
BEGIN
  EXECUTE format('
    CREATE POLICY %I ON %I FOR SELECT USING (
      get_my_role() = ''admin''
      OR (get_my_role() IN (''store_manager'',''individual'') AND store_id = get_my_store_id())
    );
    CREATE POLICY %I ON %I FOR INSERT WITH CHECK (get_my_role() IN (''admin'',''data_entry''));
    CREATE POLICY %I ON %I FOR UPDATE USING (get_my_role() IN (''admin'',''data_entry''));
    CREATE POLICY %I ON %I FOR DELETE USING (get_my_role() = ''admin'');
  ',
    tbl||'_select', tbl,
    tbl||'_insert', tbl,
    tbl||'_update', tbl,
    tbl||'_delete', tbl
  );
END;
$$ LANGUAGE plpgsql;

SELECT create_analysis_policies('revenue_analysis');
SELECT create_analysis_policies('revisit_analysis');
SELECT create_analysis_policies('pharma_mgmt_outpatient');
SELECT create_analysis_policies('pharma_mgmt_home');
SELECT create_analysis_policies('regional_support');
SELECT create_analysis_policies('deviation_scores');

-- ============================================================
-- 初期管理者アカウント作成
-- auth.users へ手動でSQLから作成する場合の手順:
-- 1. Supabase Dashboard > Authentication > Users > "Invite user" で
--    管理者メールアドレスを招待
-- 2. 招待確認後、以下のSQLで users テーブルにレコードを追加:
--    INSERT INTO users (id, email, name, role)
--    VALUES ('<auth.usersのUUID>', 'admin@example.com', '管理者', 'admin');
-- ============================================================

-- インデックス
CREATE INDEX idx_revenue_ym      ON revenue_analysis(year_month);
CREATE INDEX idx_revenue_store   ON revenue_analysis(store_id);
CREATE INDEX idx_revisit_ym      ON revisit_analysis(year_month);
CREATE INDEX idx_revisit_store   ON revisit_analysis(store_id);
CREATE INDEX idx_deviation_ym    ON deviation_scores(year_month);
CREATE INDEX idx_deviation_store ON deviation_scores(store_id);
