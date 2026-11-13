<?php

namespace App\Console\Commands;

use App\Support\Analytics\AnalyticsPeriod;
use App\Support\Analytics\AnalyticsReport;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('analytics:refresh')]
#[Description('Fetch the GA4 figures of the dashboard for every period, so the page never waits for Google')]
class RefreshAnalyticsReports extends Command
{
    /**
     * Run every half hour by the scheduler (ADM-ANA-5). Google takes seconds, sometimes more, to compute a report it
     * has not seen lately and answers at once to one it has: refreshing in the background keeps both its cache and
     * ours warm, and a failure keeps the previous figures until the next run.
     */
    public function handle(AnalyticsReport $report): int
    {
        $failed = false;

        foreach (AnalyticsPeriod::cases() as $period) {
            if ($report->forPeriod($period, refresh: true) === null) {
                $this->error("{$period->label()}: Google Analytics gave no answer.");
                $failed = true;

                continue;
            }

            $this->info("{$period->label()}: refreshed.");
        }

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
