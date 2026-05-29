ALTER TABLE scores ADD COLUMN school_id uuid REFERENCES schools(id);
