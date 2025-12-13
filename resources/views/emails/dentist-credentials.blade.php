<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dentist Account Credentials</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #334155; line-height: 1.6;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%; background-color: #f1f5f9;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Main Container -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color: #3A9FCB; padding: 32px 20px;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Welcome to the Team!</h1>
                            <p style="margin: 8px 0 0; color: #e0f2fe; font-size: 16px;">BlueTooth Dental Clinic</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 24px; font-size: 16px; color: #334155;">Hello <strong>{{ $dentistName }}</strong>,</p>
                            
                            <p style="margin: 0 0 24px; font-size: 16px; color: #475569;">
                                Your account for the BlueTooth Dental Clinic portal has been successfully created. You can now access your dashboard to manage appointments and patient records.
                            </p>

                            <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Your Login Credentials</p>

                            <!-- Credentials Box -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 32px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
                                                    <p style="margin: 0 0 4px; font-size: 12px; color: #64748b; text-transform: uppercase;">Email Address</p>
                                                    <p style="margin: 0; font-size: 16px; font-weight: 500; color: #0f172a; font-family: monospace;">{{ $email }}</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding-top: 16px;">
                                                    <p style="margin: 0 0 4px; font-size: 12px; color: #64748b; text-transform: uppercase;">Reference Digits</p>
                                                    <p style="margin: 0 0 8px; font-size: 16px; font-weight: 500; color: #0f172a; font-family: monospace;">{{ $passwordDigits }}</p>
                                                    
                                                    <!-- Password Format Note -->
                                                    <div style="background-color: #fff7ed; border-left: 3px solid #f97316; padding: 12px;">
                                                        <p style="margin: 0; font-size: 13px; color: #9a3412;">
                                                            <strong>Password Format:</strong> <code>lastname_{{ $passwordDigits }}</code><br>
                                                            <span style="font-size: 12px; opacity: 0.9;">Example: If your last name is "Doe", your password is <code>doe_{{ $passwordDigits }}</code></span>
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Security Alert -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                                <tr>
                                    <td style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px;">
                                        <p style="margin: 0; font-size: 14px; color: #166534;">
                                            <strong>Security Action Required</strong><br>
                                            For security purposes, you will be prompted to change your password immediately upon your first login.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0; font-size: 15px; color: #475569;">
                                Best regards,<br>
                                <strong style="color: #3A9FCB;">BlueTooth Dental Clinic Administration</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 8px; font-size: 12px; color: #94a3b8;">
                                This is an automated system message. Please do not reply.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #cbd5e1;">
                                &copy; {{ date('Y') }} BlueTooth Dental Clinic. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
