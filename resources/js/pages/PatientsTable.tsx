import * as React from "react";
import { DataTable } from "../components/ui/data-table";
import { ThemeToggle } from "../components/ui/theme-toggle";

type Patient = {
  patient_id: number;
  patient_fname: string;
  patient_mname: string;
  patient_lname: string;
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
    { accessorKey: "patient_id", header: "ID" },
    { accessorKey: "patient_fname", header: "First Name" },
    { accessorKey: "patient_mname", header: "Middle Name" },
    { accessorKey: "patient_lname", header: "Last Name" },
    { accessorKey: "date_of_birth", header: "Date of Birth" },
    { accessorKey: "gender", header: "Gender" },
    { accessorKey: "contact_number", header: "Contact Number" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "address", header: "Address" },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Patients</h1>
        <ThemeToggle />
      </div>
      <DataTable columns={columns} data={patients} />
    </div>
  );
}
