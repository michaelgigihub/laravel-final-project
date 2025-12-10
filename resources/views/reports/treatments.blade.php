<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Treatments Report</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #4f46e5; font-size: 24px; }
        .header p { margin: 5px 0 0; color: #666; }
        .summary { text-align: center; margin-bottom: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; }
        .summary .value { font-size: 28px; font-weight: bold; color: #4f46e5; }
        .summary .label { font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #4f46e5; color: white; padding: 10px 8px; text-align: left; font-size: 11px; }
        td { border-bottom: 1px solid #e5e7eb; padding: 8px; font-size: 11px; }
        tr:nth-child(even) { background: #f9fafb; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Treatments Report</h1>
        <p>{{ $startDate }} - {{ $endDate }}</p>
    </div>

    <div class="summary">
        <div class="value">{{ $total }}</div>
        <div class="label">Total Treatments Performed</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Dentist</th>
                <th>Treatment</th>
            </tr>
        </thead>
        <tbody>
            @foreach($records as $record)
            <tr>
                <td>{{ $record['date'] }}</td>
                <td>{{ $record['patient'] }}</td>
                <td>{{ $record['dentist'] }}</td>
                <td>{{ $record['treatment'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Generated on {{ $generatedAt }} | Dental Clinic Management System
    </div>
</body>
</html>
