<?php

namespace App\Providers;

use App\Services\Contracts\LogisticsProvider;
use App\Services\Contracts\PaymentGateway;
use App\Services\Delivery\Carriers\DelhiveryCarrier;
use App\Services\Delivery\Carriers\OlaCarrier;
use App\Services\Delivery\Carriers\PorterCarrier;
use App\Services\Delivery\Carriers\RapidoCarrier;
use App\Services\Delivery\Carriers\ShiprocketCarrier;
use App\Services\Delivery\CarrierRegistry;
use App\Services\Delivery\DeliveryAllocator;
use App\Services\Delivery\MultiCarrierLogistics;
use App\Services\Mock\MockPaymentGateway;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Sandbox drivers — replace these bindings with real implementations
        // once API credentials are configured.
        $this->app->singleton(PaymentGateway::class, MockPaymentGateway::class);

        $this->registerDeliveryCarriers();
        $this->app->singleton(\App\Services\Contracts\SearchEngine::class, \App\Services\PostgresSearchEngine::class);

        // Bulk-import parser: use the LLM driver when a key is configured,
        // otherwise the heuristic one. GeminiProductParser also falls back to
        // heuristic at runtime if a call fails, so import never hard-stops.
        $this->app->singleton(\App\Services\Contracts\ProductParser::class, function () {
            return filled(config('services.gemini.key'))
                ? new \App\Services\Import\GeminiProductParser()
                : new \App\Services\Import\HeuristicProductParser();
        });
        $this->app->singleton(\App\Services\AIService::class, function ($app) {
            return new \App\Services\AIService();
        });
    }

    /**
     * Delivery partners, the registry that holds them, and the allocator that
     * chooses between them.
     *
     * Which partners are live is a config question (`DELIVERY_CARRIERS`), so
     * signing a new courier is an env change plus one adapter class — nothing
     * in the controllers or the clients moves. Every adapter runs in sandbox
     * until its credentials are present, and says so in every response.
     */
    protected function registerDeliveryCarriers(): void
    {
        $this->app->singleton(CarrierRegistry::class, fn () => new CarrierRegistry([
            new RapidoCarrier(),
            new OlaCarrier(),
            new PorterCarrier(),
            new ShiprocketCarrier(),
            new DelhiveryCarrier(),
        ]));

        $this->app->singleton(
            DeliveryAllocator::class,
            fn ($app) => new DeliveryAllocator($app->make(CarrierRegistry::class)),
        );

        // The pre-existing single-courier interface now resolves to the
        // multi-carrier implementation, so the order/return/serviceability
        // controllers gain carrier selection without being rewritten.
        $this->app->singleton(LogisticsProvider::class, fn ($app) => new MultiCarrierLogistics(
            $app->make(CarrierRegistry::class),
            $app->make(DeliveryAllocator::class),
        ));
    }

    public function boot(): void
    {
        $this->registerRateLimiters();
    }

    /**
     * Named rate limiters, applied in routes/api.php.
     *
     * Credential and OTP endpoints are limited on two keys at once: a per-identity
     * key (email / phone) so one account can't be ground down from a botnet, and a
     * per-IP key so one host can't sweep many identities. Laravel applies every
     * Limit in the returned array, so whichever trips first wins.
     */
    protected function registerRateLimiters(): void
    {
        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(5)->by('login:' . strtolower((string) $request->input('email')) . '|' . $request->ip()),
            Limit::perHour(30)->by('login-ip:' . $request->ip()),
        ]);

        RateLimiter::for('register', fn (Request $request) => [
            Limit::perHour(10)->by('register-ip:' . $request->ip()),
        ]);

        // An OTP is 6 digits with a 5-minute life and no attempt counter of its
        // own, so the throttle is the only thing standing between an attacker and
        // a full sweep of the code space. Verify is deliberately tighter than send.
        RateLimiter::for('otp-send', fn (Request $request) => [
            Limit::perMinutes(5, 3)->by('otp-send:' . $request->input('phone')),
            Limit::perHour(20)->by('otp-send-ip:' . $request->ip()),
        ]);

        RateLimiter::for('otp-verify', fn (Request $request) => [
            Limit::perMinutes(5, 5)->by('otp-verify:' . $request->input('phone')),
            Limit::perHour(30)->by('otp-verify-ip:' . $request->ip()),
        ]);

        // Blanket ceiling for everything else — generous enough that normal
        // browsing never sees it, low enough to blunt scraping and abuse.
        RateLimiter::for('api', fn (Request $request) => [
            Limit::perMinute(120)->by($request->user()?->id ?: $request->ip()),
        ]);

        // Writes that cost money, storage or someone's inbox.
        RateLimiter::for('sensitive-write', fn (Request $request) => [
            Limit::perMinute(20)->by($request->user()?->id ?: $request->ip()),
        ]);
    }
}
