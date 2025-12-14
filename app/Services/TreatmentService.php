<?php

namespace App\Services;

use App\Models\TreatmentType;
use Illuminate\Support\Collection;

class TreatmentService
{
    /**
     * List all active treatment types.
     *
     * @return Collection
     */
    public function listActiveTreatments(): Collection
    {
        return TreatmentType::where('is_active', true)
            ->select(['name', 'description', 'standard_cost', 'duration_minutes'])
            ->get();
    }

    /**
     * Find a treatment by name (partial match).
     *
     * @param string $name
     * @return Collection
     */
    public function findTreatmentsByName(string $name): Collection
    {
        return TreatmentType::where('is_active', true)
            ->where('name', 'like', '%' . $name . '%')
            ->select(['name', 'description', 'standard_cost', 'duration_minutes'])
            ->get();
    }

    /**
     * Estimate the cost for a list of treatment names.
     *
     * @param array $treatmentNames List of treatment names to look up
     * @return array Breakdown of costs and total
     */
    public function estimateCost(array $treatmentNames): array
    {
        $foundTreatments = collect();
        $missingTreatments = [];
        $totalCost = 0;

        foreach ($treatmentNames as $name) {
            // Find best match for each name
            $treatment = TreatmentType::where('is_active', true)
                ->where('name', 'like', '%' . $name . '%')
                ->first();

            if ($treatment) {
                // Prevent duplicates if user asks for "cleaning and cleaning"
                if (!$foundTreatments->contains('id', $treatment->id)) {
                    $foundTreatments->push($treatment);
                    $totalCost += $treatment->standard_cost;
                }
            } else {
                $missingTreatments[] = $name;
            }
        }

        return [
            'treatments' => $foundTreatments->map(function ($t) {
                return [
                    'name' => $t->name,
                    'cost' => $t->standard_cost,
                    'duration' => $t->duration_minutes . ' mins'
                ];
            })->toArray(),
            'total_estimated_cost' => $totalCost,
            'not_found' => $missingTreatments
        ];
    }
}
