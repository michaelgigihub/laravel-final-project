<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Patients Report</title>
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
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Patients Report</h1>
        <p>Complete Patient List</p>
    </div>

    <div class="stats">
        <div class="stat-box">
            <div class="value">{{ $stats['total'] }}</div>
            <div class="label">Total Patients</div>
        </div>
        <div class="stat-box">
            <div class="value">{{ $stats['male'] }}</div>
            <div class="label">Male</div>
        </div>
        <div class="stat-box">
            <div class="value">{{ $stats['female'] }}</div>
            <div class="label">Female</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Age</th>
                <th>Contact</th>
                <th>Email</th>
            </tr>
        </thead>
        <tbody>
            @foreach($patients as $index => $patient)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $patient['name'] }}</td>
                <td>{{ $patient['gender'] }}</td>
                <td>{{ $patient['age'] }}</td>
                <td>{{ $patient['contact'] }}</td>
                <td>{{ $patient['email'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Generated on {{ $generatedAt }} | Dental Clinic Management System
    </div>
</body>
</html>
