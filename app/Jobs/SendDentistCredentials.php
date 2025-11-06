<?php

namespace App\Jobs;

use App\Mail\DentistCredentials;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendDentistCredentials implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     *
     * @param  string  $dentistEmail  The dentist's email address
     * @param  string  $dentistFullName  The dentist's full name
     * @param  string  $passwordDigits  The 4-digit password suffix
     */
    public function __construct(
        public string $dentistEmail,
        public string $dentistFullName,
        public string $passwordDigits
    ) {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Mail::to($this->dentistEmail)->send(
            new DentistCredentials(
                $this->dentistFullName,
                $this->dentistEmail,
                $this->passwordDigits
            )
        );
    }
}
