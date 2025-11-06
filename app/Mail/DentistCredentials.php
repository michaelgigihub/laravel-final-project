<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DentistCredentials extends Mailable
{
    use Queueable, SerializesModels;

    public $dentistName;

    public $email;

    public $passwordDigits;

    /**
     * Create a new message instance.
     */
    public function __construct(string $dentistName, string $email, string $passwordDigits)
    {
        $this->dentistName = $dentistName;
        $this->email = $email;
        $this->passwordDigits = $passwordDigits;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Dentist Account Credentials',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.dentist-credentials',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
