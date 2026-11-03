-- =============================================================================
-- SEED 06-infra-seed-domains-asset-types.sql
-- Référentiels ouverts pour le modèle générique multi-réseaux
-- =============================================================================

BEGIN;

INSERT INTO infra.domains(code, label_fr, label_ar, label_en, description) VALUES
  ('electricity', 'Électricité', 'كهرباء', 'Electricity', 'Réseau électrique HT/MT/BT'),
  ('water',       'Eau potable', 'ماء الشرب', 'Drinking Water', 'Réseau d''eau potable'),
  ('sanitation',  'Assainissement', 'صرف صحي', 'Sanitation', 'Réseau d''assainissement'),
  ('road',        'Route', 'طريق', 'Road', 'Réseau routier'),
  ('gas',         'Gaz', 'غاز', 'Gas', 'Réseau de gaz'),
  ('telecom',     'Télécom', 'اتصالات', 'Telecom', 'Réseau de télécommunications')
ON CONFLICT (code) DO NOTHING;

INSERT INTO infra.asset_types(code, domain_code, asset_group, asset_type, label_fr, label_ar, label_en, geometry_kind) VALUES
  ('line_ht',           'electricity', 'line',      'HT_Line',            'Ligne HT',              'خط عالي الجهد',   'HT Line',            'LineString'),
  ('line_mt',           'electricity', 'line',      'MT_Line',            'Ligne MT',              'خط متوسط الجهد',  'MT Line',            'LineString'),
  ('line_bt',           'electricity', 'line',      'BT_Line',            'Ligne BT',              'خط منخفض الجهد',  'BT Line',            'LineString'),
  ('substation_ht',     'electricity', 'assembly',  'HT_Substation',      'Poste HT',              'محطة عالية الجهد','HT Substation',      'Point'),
  ('substation_mt',     'electricity', 'assembly',  'MT_Substation',      'Poste MT',              'محطة متوسطة',     'MT Substation',      'Point'),
  ('transformer',       'electricity', 'device',    'Transformer',        'Transformateur',        'محول',            'Transformer',        'Point'),
  ('breaker',           'electricity', 'device',    'CircuitBreaker',     'Disjoncteur',           'قاطع',            'Circuit Breaker',    'Point'),
  ('meter',             'electricity', 'device',    'Meter',              'Compteur',              'عداد',            'Meter',              'Point'),
  ('pole',              'electricity', 'structure', 'Pole',               'Poteau',                'عمود',            'Pole',               'Point'),
  ('tower',             'electricity', 'structure', 'Tower',              'Pylône',                'برج',             'Tower',              'Point'),
  ('pipe_main',         'water',       'line',      'Main_Pipe',          'Conduite principale',   'أنبوب رئيسي',     'Main Pipe',          'LineString'),
  ('pipe_distribution', 'water',       'line',      'Distribution_Pipe',  'Conduite de distribution','أنبوب توزيع',   'Distribution Pipe',  'LineString'),
  ('valve',             'water',       'device',    'Valve',              'Vanne',                 'صمام',            'Valve',              'Point'),
  ('pump',              'water',       'device',    'Pump',               'Pompe',                 'مضخة',            'Pump',               'Point'),
  ('reservoir',         'water',       'assembly',  'Reservoir',          'Réservoir',             'خزان',            'Reservoir',          'Polygon'),
  ('water_meter',       'water',       'device',    'Water_Meter',        'Compteur d''eau',       'عداد ماء',        'Water Meter',        'Point'),
  ('sewer_main',        'sanitation',  'line',      'Sewer_Main',         'Collecteur principal',  'مجمع رئيسي',      'Sewer Main',         'LineString'),
  ('sewer_secondary',   'sanitation',  'line',      'Sewer_Secondary',    'Collecteur secondaire', 'مجمع ثانوي',      'Sewer Secondary',    'LineString'),
  ('manhole',           'sanitation',  'structure', 'Manhole',            'Regard',                'فتحة تفتيش',      'Manhole',            'Point'),
  ('lift_station',      'sanitation',  'assembly',  'Lift_Station',       'Station de relevage',   'محطة رفع',        'Lift Station',       'Point'),
  ('road_segment',      'road',        'line',      'Road_Segment',       'Tronçon routier',       'مقطع طريق',       'Road Segment',       'LineString'),
  ('road_bridge',       'road',        'assembly',  'Bridge',             'Pont',                  'جسر',             'Bridge',             'LineString'),
  ('road_tunnel',       'road',        'assembly',  'Tunnel',             'Tunnel',                'نفق',             'Tunnel',             'LineString'),
  ('road_sign',         'road',        'device',    'Road_Sign',          'Panneau routier',       'لافتة طريق',      'Road Sign',          'Point'),
  ('gas_pipeline',      'gas',         'line',      'Gas_Pipeline',       'Conduite de gaz',       'أنبوب غاز',       'Gas Pipeline',       'LineString'),
  ('gas_valve',         'gas',         'device',    'Gas_Valve',          'Vanne gaz',             'صمام غاز',        'Gas Valve',          'Point'),
  ('gas_meter',         'gas',         'device',    'Gas_Meter',          'Compteur de gaz',       'عداد غاز',        'Gas Meter',          'Point'),
  ('fiber_cable',       'telecom',     'line',      'Fiber_Cable',        'Câble fibre optique',   'كابل ألياف',      'Fiber Cable',        'LineString'),
  ('telecom_tower',     'telecom',     'structure', 'Telecom_Tower',      'Pylône télécom',        'برج اتصالات',     'Telecom Tower',      'Point'),
  ('telecom_box',       'telecom',     'device',    'Telecom_Box',        'Boîtier télécom',       'صندوق اتصالات',   'Telecom Box',        'Point')
ON CONFLICT (code) DO NOTHING;

COMMIT;
