<?php

namespace App\Services\Import;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * LLM-backed parser. Used only when services.gemini.key is set; on any failure
 * (no key, network error, malformed response) it delegates to the heuristic
 * parser so bulk import never hard-fails.
 *
 * Extends the heuristic parser so normalisation, category matching, variant
 * building and validation stay in one place — the model only supplies the
 * field extraction, and its output is validated the same way as any other.
 */
class GeminiProductParser extends HeuristicProductParser
{
    private const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

    public function parse(string $raw, array $context = []): array
    {
        $key = config('services.gemini.key');

        if (blank($key) || trim($raw) === '') {
            return parent::parse($raw, $context);
        }

        try {
            $records = $this->extractWithModel($raw, $key);
        } catch (\Throwable $e) {
            Log::warning('[GeminiProductParser] falling back to heuristic: '.$e->getMessage());

            return parent::parse($raw, $context);
        }

        if (! $records) {
            return parent::parse($raw, $context);
        }

        // Re-use the parent's normalisation so model output goes through the
        // exact same validation, category matching and confidence pipeline.
        $delimited = json_encode($records);

        return parent::parse($delimited, $context) + ['driver' => 'gemini'];
    }

    protected function driverName(): string
    {
        return 'gemini';
    }

    private function extractWithModel(string $raw, string $key): array
    {
        $prompt = <<<PROMPT
        Extract product records from the text below.

        Return ONLY a JSON array. Each element must use these keys, omitting any
        you cannot determine: title, description, brand, category, price, mrp,
        sku, stock, color, size, images (array of URLs), tags (array).

        Rules:
        - price is the selling price; mrp is the higher list price. Never invent one.
        - Numbers must be plain (3499, not "₹3,499").
        - Do not invent values that are not present in the text.
        - If the text contains no products, return [].

        TEXT:
        {$raw}
        PROMPT;

        $response = Http::timeout(20)
            ->post(self::ENDPOINT."?key={$key}", [
                'contents' => [['parts' => [['text' => $prompt]]]],
                'generationConfig' => ['temperature' => 0, 'responseMimeType' => 'application/json'],
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Gemini HTTP '.$response->status());
        }

        $text = $response->json('candidates.0.content.parts.0.text', '[]');
        $text = trim(str_replace(['```json', '```'], '', $text));

        $decoded = json_decode($text, true);

        return is_array($decoded) && array_is_list($decoded) ? $decoded : [];
    }
}
