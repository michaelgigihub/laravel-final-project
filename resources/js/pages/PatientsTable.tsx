import { DataTable } from '../components/ui/data-table';
import { ThemeToggle } from '../components/ui/theme-toggle';

type Patient = {
    patient_id: number;
    fname: string;
    mname: string;
    lname: string;
    date_of_birth: string;
    gender: string;
    contact_number: string;
    email: string;
    address: string;
};

interface PatientsTableProps {
    patients: Patient[];
}

export default function PatientsTable({ patients }: PatientsTableProps) {
    const columns = [
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'fname', header: 'First Name' },
        { accessorKey: 'mname', header: 'Middle Name' },
        { accessorKey: 'lname', header: 'Last Name' },
        { accessorKey: 'date_of_birth', header: 'Date of Birth' },
        { accessorKey: 'gender', header: 'Gender' },
        { accessorKey: 'contact_number', header: 'Contact Number' },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'address', header: 'Address' },
    ];

    return (
        <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Patients</h1>
                <ThemeToggle />
            </div>
            <DataTable columns={columns} data={patients} />
        </div>
    );
}
