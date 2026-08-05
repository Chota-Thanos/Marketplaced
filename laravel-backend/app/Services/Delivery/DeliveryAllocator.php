<?php

namespace App\Services\Delivery;

use App\Models\Order;
use App\Models\Product;
use App\Services\Contracts\DeliveryCarrier;
use Illuminate\Support\Facades\Log;

/**
 * Decides who ships what.
 *
 * The rules encode how Indian fulfilment actually splits:
 *
 *   - A 40kg washing machine cannot go on a bike. It needs a Porter truck, and
 *     it needs a scheduled slot rather than a next-day promise.
 *   - A ₹900 phone case going 4km across the same city is absurd to hand to a
 *     surface 3PL for a 4-day transit when a rider does it in 45 minutes.
 *   - Anything crossing cities goes to an aggregator, because rider networks
 *     are intracity only.
 *
 * The allocator never picks *for* the customer at checkout — it produces the
 * option list and the customer chooses. It picks unilaterally only when an
 * order is being booked and the chosen carrier has since become unavailable.
 */
class DeliveryAllocator
{
    public function __construct(private readonly CarrierRegistry $registry) {}

    /**
     * Every bookable option for this shipment, cheapest-within-fastest first.
     *
     * @return DeliveryQuote[]
     */
    public function quotes(Shipment $shipment): array
    {
        $quotes = [];

        foreach ($this->registry->enabled() as $carrier) {
            if (! $carrier->canCarry($shipment)) {
                continue;
            }

            try {
                foreach ($carrier->quote($shipment) as $quote) {
                    $quotes[] = $quote;
                }
            } catch (\Throwable $e) {
                // One partner being down must cost that partner its slot, not
                // break checkout. Logged loudly because a carrier that quietly
                // stops quoting is revenue leaking to its competitors.
                Log::warning('[DeliveryAllocator] carrier quote failed', [
                    'carrier' => $carrier->key(),
                    'error' => $e->getMessage(),
                    'shipment' => $shipment->toArray(),
                ]);
            }
        }

        // Cheapest within each tier, then fastest tier first. Sorting has to
        // happen after the dedupe as well as before it — the dedupe rebuilds
        // the list keyed by service level, which does not preserve order.
        usort($quotes, fn (DeliveryQuote $a, DeliveryQuote $b) => $a->pricePaise <=> $b->pricePaise);

        $best = $this->dedupeByServiceLevel($quotes);

        usort(
            $best,
            fn (DeliveryQuote $a, DeliveryQuote $b) => ServiceLevel::rank($a->serviceLevel)
                <=> ServiceLevel::rank($b->serviceLevel),
        );

        return $best;
    }

    /**
     * One option per service level — the cheapest. Showing a customer four
     * different "standard delivery" rows from four aggregators is noise; they
     * are choosing a speed, not a logistics vendor.
     *
     * @param  DeliveryQuote[]  $quotes
     * @return DeliveryQuote[]
     */
    private function dedupeByServiceLevel(array $quotes): array
    {
        $best = [];

        foreach ($quotes as $quote) {
            $existing = $best[$quote->serviceLevel] ?? null;
            if (! $existing || $quote->pricePaise < $existing->pricePaise) {
                $best[$quote->serviceLevel] = $quote;
            }
        }

        return array_values($best);
    }

    /**
     * The carrier to actually book with for a chosen service level, re-quoting
     * at booking time.
     *
     * A quote shown at checkout can be minutes old; by the time payment clears,
     * the rider network may be saturated. Re-quoting here means we book what is
     * actually available rather than what was available when the page rendered.
     */
    public function carrierFor(Shipment $shipment, string $serviceLevel): ?DeliveryCarrier
    {
        foreach ($this->quotes($shipment) as $quote) {
            if ($quote->serviceLevel === $serviceLevel) {
                return $this->registry->get($quote->carrier);
            }
        }

        // Nothing at the promised speed any more. Fall back to the slowest
        // option that exists rather than failing the order outright — a late
        // delivery is recoverable, a dropped order is not.
        $fallback = $this->quotes($shipment);

        return $fallback ? $this->registry->get(end($fallback)->carrier) : null;
    }

    /**
     * Build a Shipment from an order. Weight and dimensions come off the
     * products; anything missing falls back to a conservative per-item default
     * so a catalogue gap under-promises rather than under-charges.
     */
    public function shipmentForOrder(Order $order, string $pickupPincode = null): Shipment
    {
        $weight = 0;
        $longest = 0;
        $girth = 0;
        $count = 0;

        foreach ($order->items as $item) {
            $product = $item->product;
            $qty = (int) $item->quantity;
            $count += $qty;

            $weight += ($product?->weight_grams ?? config('delivery.default_item_weight_grams')) * $qty;
            $longest = max($longest, (int) ($product?->length_cm ?? 25));
            $girth = max($girth, (int) (
                ($product?->length_cm ?? 25) + ($product?->width_cm ?? 20) + ($product?->height_cm ?? 12)
            ));
        }

        return new Shipment(
            pickupPincode: $pickupPincode ?? config('delivery.pickup_pincode'),
            dropPincode: (string) ($order->shipping_address['pincode'] ?? ''),
            weightGrams: $weight,
            longestSideCm: $longest,
            girthCm: $girth,
            valuePaise: (int) round($order->total_amount * 100),
            cod: $order->payment_method === 'COD',
            itemCount: $count,
            order: $order,
        );
    }

    /**
     * Build a Shipment from a cart payload, before an order exists — this is
     * what the checkout screen quotes against.
     *
     * @param  array<int, array{product_id: string, quantity: int}>  $items
     */
    public function shipmentForCart(array $items, string $dropPincode, bool $cod, int $valuePaise): Shipment
    {
        $products = Product::whereIn('id', array_column($items, 'product_id'))->get()->keyBy('id');

        $weight = 0;
        $longest = 0;
        $girth = 0;
        $count = 0;

        foreach ($items as $line) {
            $product = $products->get($line['product_id']);
            $qty = (int) ($line['quantity'] ?? 1);
            $count += $qty;

            $weight += ($product?->weight_grams ?? config('delivery.default_item_weight_grams')) * $qty;
            $longest = max($longest, (int) ($product?->length_cm ?? 25));
            $girth = max($girth, (int) (
                ($product?->length_cm ?? 25) + ($product?->width_cm ?? 20) + ($product?->height_cm ?? 12)
            ));
        }

        return new Shipment(
            pickupPincode: config('delivery.pickup_pincode'),
            dropPincode: $dropPincode,
            weightGrams: $weight,
            longestSideCm: $longest,
            girthCm: $girth,
            valuePaise: $valuePaise,
            cod: $cod,
            itemCount: $count,
        );
    }
}
