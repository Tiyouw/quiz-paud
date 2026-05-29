CREATE TABLE IF NOT EXISTS schools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  access_code text NOT NULL,
  created_at timestamptz DEFAULT now()
);

INSERT INTO schools (name, access_code) VALUES
  ('TK Dewi Masyithoh 69 Keting', '69'),
  ('TK Dewi Masyithoh 59 Jombang', '59'),
  ('TK DARUTTAQWA Jombang', '01'),
  ('TK Dewi Masyithoh 15 Keting', '15'),
  ('TK Dharma Wanita 02 Padomasan', '02');
