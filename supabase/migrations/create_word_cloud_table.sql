-- Create word_cloud table for storing words and their descriptions
CREATE TABLE IF NOT EXISTS word_cloud (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_word_cloud_word ON word_cloud(word);
CREATE INDEX IF NOT EXISTS idx_word_cloud_is_active ON word_cloud(is_active);

-- Enable RLS
ALTER TABLE word_cloud ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all authenticated users to read, only admins can modify)
CREATE POLICY "Allow read access for all authenticated users" ON word_cloud
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON word_cloud
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_word_cloud_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS word_cloud_updated_at ON word_cloud;
CREATE TRIGGER word_cloud_updated_at
  BEFORE UPDATE ON word_cloud
  FOR EACH ROW
  EXECUTE FUNCTION update_word_cloud_updated_at();
