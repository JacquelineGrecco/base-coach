-- Add gender field to categories
-- Allows filtering categories by male/female/mixed

ALTER TABLE categories
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('masculino', 'feminino', 'misto'));

COMMENT ON COLUMN categories.gender IS 'Category gender: masculino, feminino, or misto';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_categories_gender ON categories(gender);

