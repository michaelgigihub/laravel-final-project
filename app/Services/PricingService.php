<?php

namespace App\Services;

use App\Models\TreatmentRecord;
use Illuminate\Support\Collection;

class PricingService
{
    /**
     * Calculate the price for a single treatment record.
     * Takes into account per-tooth pricing when applicable.
     *
     * @param TreatmentRecord $record Treatment record with treatmentType and teeth loaded
     * @return float Calculated price for the treatment
     */
    public function calculateTreatmentPrice(TreatmentRecord $record): float
    {
        if (!$record->treatmentType) {
            return 0.0;
        }

        $baseCost = (float) $record->treatmentType->standard_cost;
        $isPerTooth = $record->treatmentType->is_per_tooth ?? false;
        $teethCount = $record->teeth->count();

        // If per-tooth and teeth are recorded, multiply by teeth count
        // Minimum of 1 if per-tooth but no teeth selected yet
        if ($isPerTooth) {
            return $baseCost * max(1, $teethCount);
        }

        return $baseCost;
    }

    /**
     * Calculate the price for a treatment record from array data.
     * Used when processing already-transformed array data.
     *
     * @param array $record Array with treatment_type and teeth data
     * @return float Calculated price for the treatment
     */
    public function calculatePriceFromArray(array $record): float
    {
        $treatmentType = $record['treatment_type'] ?? null;
        if (!$treatmentType) {
            return 0.0;
        }

        $baseCost = (float) ($treatmentType['standard_cost'] ?? 0);
        $isPerTooth = $treatmentType['is_per_tooth'] ?? false;
        $teethCount = count($record['teeth'] ?? []);

        if ($isPerTooth) {
            return $baseCost * max(1, $teethCount);
        }

        return $baseCost;
    }

    /**
     * Calculate the total price for multiple treatment records.
     *
     * @param Collection<TreatmentRecord>|array $records Collection or array of treatment records
     * @return float Total calculated price for all treatments
     */
    public function calculateTotalPrice($records): float
    {
        if ($records instanceof Collection) {
            return $records->reduce(function ($sum, $record) {
                return $sum + $this->calculateTreatmentPrice($record);
            }, 0.0);
        }

        // Handle array of arrays
        return array_reduce($records, function ($sum, $record) {
            if ($record instanceof TreatmentRecord) {
                return $sum + $this->calculateTreatmentPrice($record);
            }
            return $sum + $this->calculatePriceFromArray($record);
        }, 0.0);
    }

    /**
     * Format a price as Philippine Peso currency string.
     *
     * @param float $amount The amount to format
     * @return string Formatted string like "₱1,200.00"
     */
    public function formatPeso(float $amount): string
    {
        return '₱' . number_format($amount, 2);
    }
}
