<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Dentists Report</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #4f46e5; font-size: 24px; }
        .header p { margin: 5px 0 0; color: #666; }
        .stats { display: flex; justify-content: space-around; margin-bottom: 20px; }
        .stat-box { text-align: center; padding: 10px 20px; background: #f3f4f6; border-radius: 8px; display: inline-block; width: 30%; }
        .stat-box .value { font-size: 24px; font-weight: bold; color: #4f46e5; }
        .stat-box .label { font-size: 11px; color: #666; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #4f46e5; color: white; padding: 10px 8px; text-align: left; font-size: 11px; }
        td { border-bottom: 1px solid #e5e7eb; padding: 8px; font-size: 11px; }
        tr:nth-child(even) { background: #f9fafb; }
        .status { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .status-active { background: #dcfce7; color: #166534; }
        .status-un-hired { background: #fee2e2; color: #991b1b; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Dentists Report</h1>
        <p>Staff Directory</p>
    </div>

    <div class="stats">
        <div class="stat-box">
            <div class="value">{{ $stats['total'] }}</div>
            <div class="label">Total Dentists</div>
        </div>
        <div class="stat-box">
            <div class="value">{{ $stats['active'] }}</div>
            <div class="label">Active</div>
        </div>
        <div class="stat-box">
            <div class="value">{{ $stats['unhired'] }}</div>
            <div class="label">Un-hired</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Specializations</th>
            </tr>
        </thead>
        <tbody>
            @foreach($dentists as $dentist)
            <tr>
                <td>{{ $dentist['name'] }}</td>
                <td>{{ $dentist['email'] }}</td>
                <td>{{ $dentist['contact'] }}</td>
                <td>
                    <span class="status status-{{ strtolower(str_replace(' ', '-', $dentist['status'])) }}">
                        {{ $dentist['status'] }}
                    </span>
                </td>
                <td>{{ $dentist['specializations'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Generated on {{ $generatedAt }} | Dental Clinic Management System
    </div>
</body>
</html>
