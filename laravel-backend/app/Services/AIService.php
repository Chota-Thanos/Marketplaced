<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AIService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key', 'mock_key_for_now');
    }

    /**
     * Translates a natural language query into a structured search intent.
     */
    public function extractSearchIntent(string $query): array
    {
        // Mock implementation for when key is missing or we're in local dev
        if ($this->apiKey === 'mock_key_for_now' || blank($this->apiKey)) {
            Log::info("Mock AI Search Intent Extracted for query: $query");
            return [
                'categories' => [],
                'max_price' => null,
                'min_price' => null,
                'is_gift' => str_contains(strtolower($query), 'gift'),
                'target_audience' => 'general'
            ];
        }

        $prompt = "You are an e-commerce search assistant. Extract the search intent from the user query: '{$query}'. " .
            "Return JSON with keys: categories (array), max_price (int or null), min_price (int or null), is_gift (bool), target_audience (string).";

        try {
            $response = Http::post("{$this->baseUrl}/gemini-1.5-flash:generateContent?key={$this->apiKey}", [
                'contents' => [
                    ['parts' => [['text' => $prompt]]]
                ]
            ]);

            if ($response->successful()) {
                $text = $response->json('candidates.0.content.parts.0.text', '{}');
                $text = str_replace(['```json', '```'], '', $text);
                return json_decode(trim($text), true) ?? [];
            }
        } catch (\Exception $e) {
            Log::error('Gemini API Error: ' . $e->getMessage());
        }

        return [];
    }

    /**
     * Generates a summary for a product based on its reviews.
     */
    public function summarizeReviews(string $productTitle, array $reviews): string
    {
        if (empty($reviews)) {
            return '';
        }

        // Without a model key we still return a *truthful* summary derived from
        // the actual review rows, rather than a canned "customers love it"
        // string that would misrepresent negative feedback.
        if ($this->apiKey === 'mock_key_for_now' || blank($this->apiKey)) {
            return $this->extractiveSummary($reviews);
        }

        $reviewsText = implode("\n", array_map(fn($r) => "- {$r['rating']} Stars: {$r['body']}", $reviews));
        $prompt = "Summarize these customer reviews for the product '{$productTitle}' into a concise, 2-3 sentence paragraph highlighting pros and cons:\n\n{$reviewsText}";

        try {
            $response = Http::post("{$this->baseUrl}/gemini-1.5-flash:generateContent?key={$this->apiKey}", [
                'contents' => [
                    ['parts' => [['text' => $prompt]]]
                ]
            ]);

            if ($response->successful()) {
                return $response->json('candidates.0.content.parts.0.text', '');
            }
        } catch (\Exception $e) {
            Log::error('Gemini API Error: ' . $e->getMessage());
        }

        return $this->extractiveSummary($reviews);
    }

    /**
     * Signal-based spam score (0–100). Catches the patterns that actually
     * characterise incentivised/fake reviews: no specifics, keyboard mash,
     * copy-paste marketing language, contact details, and excessive caps.
     */
    private function heuristicFraudScore(string $body): int
    {
        $text = trim($body);
        $lower = mb_strtolower($text);
        $len = mb_strlen($text);
        $score = 0;

        // Too short to contain any real detail.
        if ($len < 15) {
            $score += 45;
        } elseif ($len < 40) {
            $score += 20;
        }

        // Keyboard mash / a single character repeated.
        if (preg_match('/(.)\1{4,}/', $text)) {
            $score += 35;
        }

        // Generic praise with no product specifics.
        $generic = ['nice product', 'good product', 'very good', 'awesome product', 'best product',
            'value for money', 'fast delivery', 'highly recommend', 'must buy', 'super'];
        $genericHits = 0;
        foreach ($generic as $phrase) {
            if (str_contains($lower, $phrase)) {
                $genericHits++;
            }
        }
        if ($genericHits >= 2 && $len < 120) {
            $score += 30;
        } elseif ($genericHits >= 1 && $len < 60) {
            $score += 20;
        }

        // Solicitation / contact details — a strong spam signal.
        if (preg_match('/https?:\/\/|www\.|@[a-z0-9.-]+\.[a-z]{2,}|\b\d{10}\b|whatsapp|telegram/i', $text)) {
            $score += 40;
        }

        // Shouting.
        $letters = preg_replace('/[^a-z]/i', '', $text);
        if (mb_strlen($letters) > 12 && $letters === mb_strtoupper($letters)) {
            $score += 15;
        }

        // Very low lexical variety relative to length.
        $words = preg_split('/\s+/', $lower, -1, PREG_SPLIT_NO_EMPTY);
        if (count($words) >= 8 && count(array_unique($words)) / count($words) < 0.5) {
            $score += 20;
        }

        return max(0, min(100, $score));
    }

    /**
     * Deterministic summary computed from the real review rows: rating split
     * plus the themes reviewers actually mention most. No model required, and
     * it can only say what the data supports.
     */
    private function extractiveSummary(array $reviews): string
    {
        $count = count($reviews);
        $ratings = array_map(fn ($r) => (int) ($r['rating'] ?? 0), $reviews);
        $avg = round(array_sum($ratings) / max($count, 1), 1);
        $positive = count(array_filter($ratings, fn ($r) => $r >= 4));
        $negative = count(array_filter($ratings, fn ($r) => $r <= 2));

        $sentiment = match (true) {
            $avg >= 4.3 => 'Reviewers are largely positive',
            $avg >= 3.5 => 'Reviews are mostly favourable but mixed',
            $avg >= 2.5 => 'Reviews are mixed',
            default => 'Reviewers report significant problems',
        };

        $summary = "{$sentiment} — {$avg}★ across {$count} verified ".Str::plural('review', $count).'. ';
        $summary .= "{$positive} rated it 4★ or higher";
        $summary .= $negative > 0 ? ", while {$negative} rated it 2★ or lower. " : '. ';

        if ($themes = $this->commonThemes($reviews)) {
            $summary .= 'Most mentioned: '.implode(', ', $themes).'.';
        }

        return trim($summary);
    }

    /** Most frequent meaningful words across review bodies. */
    private function commonThemes(array $reviews, int $limit = 4): array
    {
        $stop = ['this', 'that', 'with', 'have', 'from', 'they', 'been', 'very', 'just', 'good',
            'product', 'item', 'would', 'about', 'which', 'their', 'there', 'when', 'what',
            'really', 'also', 'much', 'more', 'after', 'them', 'were', 'your', 'will', 'because'];

        $counts = [];
        foreach ($reviews as $r) {
            $words = preg_split('/[^a-z]+/i', mb_strtolower($r['body'] ?? ''), -1, PREG_SPLIT_NO_EMPTY);
            foreach (array_unique($words) as $w) {
                if (mb_strlen($w) >= 4 && ! in_array($w, $stop, true)) {
                    $counts[$w] = ($counts[$w] ?? 0) + 1;
                }
            }
        }

        arsort($counts);

        // Only surface a theme if more than one reviewer raised it.
        return array_slice(array_keys(array_filter($counts, fn ($c) => $c > 1)), 0, $limit);
    }

    /**
     * Evaluates a review for potential fraud/spam. Returns a score 0-100 (100 = highly likely fraud).
     */
    public function detectReviewFraud(string $body): int
    {
        if ($this->apiKey === 'mock_key_for_now' || blank($this->apiKey)) {
            return $this->heuristicFraudScore($body);
        }

        $prompt = "You are a fraud detection AI. Rate the following review text from 0 to 100 on how likely it is to be fake, spam, or incentivized. Return ONLY an integer between 0 and 100. Review: '{$body}'";

        try {
            $response = Http::post("{$this->baseUrl}/gemini-1.5-flash:generateContent?key={$this->apiKey}", [
                'contents' => [
                    ['parts' => [['text' => $prompt]]]
                ]
            ]);

            if ($response->successful()) {
                $text = trim($response->json('candidates.0.content.parts.0.text', '0'));
                return (int) $text;
            }
        } catch (\Exception $e) {
            Log::error('Gemini API Error: ' . $e->getMessage());
        }

        return 0;
    }
}
