import * as React from "react";
import { DataTable } from "../components/ui/data-table";
import { ThemeToggle } from "../components/ui/theme-toggle";

type Dentist = {
  dentist_id: number;
  dentist_fname: string;
  dentist_mname: string;
  dentist_lname: string;
  specialization: string;
  contact_number: string;
  email: string;
};

interface DentistsTableProps {
  dentists: Dentist[];
}

export default function DentistsTable({ dentists }: DentistsTableProps) {
  const columns = [
    { accessorKey: "dentist_id", header: "ID" },
    { accessorKey: "dentist_fname", header: "First Name" },
    { accessorKey: "dentist_mname", header: "Middle Name" },
    { accessorKey: "dentist_lname", header: "Last Name" },
    { accessorKey: "specialization", header: "Specialization" },
    { accessorKey: "contact_number", header: "Contact Number" },
    { accessorKey: "email", header: "Email" },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Dentists</h1>
        <ThemeToggle />
      </div>
      <DataTable columns={columns} data={dentists} />
    </div>
  );
}
