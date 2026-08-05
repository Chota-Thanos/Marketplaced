<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // pg_trgm powers fuzzy/typo-tolerant matching; the generated tsvector
        // column gives proper relevance-ranked full-text search. Together they
        // replace the previous naive ILIKE '%term%' scan.
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        DB::statement("
            ALTER TABLE products
            ADD COLUMN search_vector tsvector
            GENERATED ALWAYS AS (
                setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                setweight(to_tsvector('english', coalesce(brand, '')), 'B') ||
                setweight(to_tsvector('english', coalesce(description, '')), 'C')
            ) STORED
        ");

        DB::statement('CREATE INDEX products_search_vector_idx ON products USING GIN (search_vector)');
        DB::statement('CREATE INDEX products_title_trgm_idx ON products USING GIN (title gin_trgm_ops)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS products_title_trgm_idx');
        DB::statement('DROP INDEX IF EXISTS products_search_vector_idx');
        DB::statement('ALTER TABLE products DROP COLUMN IF EXISTS search_vector');
    }
};
