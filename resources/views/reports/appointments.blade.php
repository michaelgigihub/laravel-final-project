<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Appointments Report</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #4f46e5; font-size: 24px; }
        .header p { margin: 5px 0 0; color: #666; }
        .stats { display: flex; justify-content: space-around; margin-bottom: 20px; }
        .stat-box { text-align: center; padding: 10px 20px; background: #f3f4f6; border-radius: 8px; display: inline-block; width: 22%; }
        .stat-box .value { font-size: 24px; font-weight: bold; color: #4f46e5; }
        .stat-box .label { font-size: 11px; color: #666; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #4f46e5; color: white; padding: 10px 8px; text-align: left; font-size: 11px; }
        td { border-bottom: 1px solid #e5e7eb; padding: 8px; font-size: 11px; }
        tr:nth-child(even) { background: #f9fafb; }
        .status { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .status-completed { background: #dcfce7; color: #166534; }
        .status-scheduled { background: #dbeafe; color: #1e40af; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Appointments Report</h1>
        <p>{{ $startDate }} - {{ $endDate }}</p>
    </div>

    <div class="stats">
        <div class="stat-box">
            <div class="value">{{ $stats['total'] }}</div>
            <div class="label">Total</div>
        </div>
        <div class="stat-box">
            <div class="value">{{ $stats['scheduled'] }}</div>
            <div class="label">Scheduled</div>
        </div>
        <div class="stat-box">
            <div class="value">{{ $stats['completed'] }}</div>
            <div class="label">Completed</div>
        </div>
        <div class="stat-box">
            <div class="value">{{ $stats['cancelled'] }}</div>
            <div class="label">Cancelled</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Date & Time</th>
                <th>Patient</th>
                <th>Dentist</th>
                <th>Status</th>
                <th>Treatments</th>
            </tr>
        </thead>
        <tbody>
            @foreach($appointments as $apt)
            <tr>
                <td>{{ $apt['date'] }}</td>
                <td>{{ $apt['patient'] }}</td>
                <td>{{ $apt['dentist'] }}</td>
                <td>
                    <span class="status status-{{ strtolower($apt['status']) }}">
                        {{ $apt['status'] }}
                    </span>
                </td>
                <td>{{ $apt['treatments'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Generated on {{ $generatedAt }} | Dental Clinic Management System
    </div>
</body>
</html>
