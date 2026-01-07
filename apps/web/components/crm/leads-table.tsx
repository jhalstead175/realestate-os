'use client';

import { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from '@tanstack/react-table';
import { Lead } from '@realestate-os/shared';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Mail,
  Phone,
  User,
  Clock,
  Star,
  Eye,
  Edit,
  Trash2,
  Filter,
  Download,
  Send,
  Tag,
  UserPlus,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LeadStatusBadge } from './lead-status-badge';
import { LeadScoreIndicator } from './lead-score-indicator';

interface LeadsTableProps {
  leads: Lead[];
  onEditLead?: (lead: Lead) => void;
  onDeleteLead?: (leadId: string) => void;
  onAssignLead?: (leadId: string) => void;
  onSendEmail?: (leadId: string) => void;
}

export function LeadsTable({
  leads,
  onEditLead,
  onDeleteLead,
  onAssignLead,
  onSendEmail,
}: LeadsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const columns: ColumnDef<Lead>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'first_name',
      header: 'Lead',
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                {lead.first_name?.[0]?.toUpperCase() || lead.email[0].toUpperCase()}
              </div>
            </div>
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {lead.first_name} {lead.last_name}
              </div>
              <div className="text-sm text-gray-500 truncate">{lead.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Contact',
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="space-y-1">
            {lead.phone && (
              <div className="flex items-center text-sm">
                <Phone className="h-3 w-3 mr-1 text-gray-400" />
                {lead.phone}
              </div>
            )}
            <div className="flex items-center text-sm text-gray-500">
              <Mail className="h-3 w-3 mr-1" />
              {lead.source}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'lead_score',
      header: 'Score',
      cell: ({ row }) => <LeadScoreIndicator score={row.getValue('lead_score')} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <LeadStatusBadge status={row.getValue('status')} />,
    },
    {
      accessorKey: 'budget_min',
      header: 'Budget',
      cell: ({ row }) => {
        const lead = row.original;
        const hasBudget = lead.budget_min || lead.budget_max;
        
        if (!hasBudget) return <span className="text-gray-400">Not set</span>;
        
        return (
          <div className="text-sm">
            {lead.budget_min && <div>Min: ${lead.budget_min.toLocaleString()}</div>}
            {lead.budget_max && <div>Max: ${lead.budget_max.toLocaleString()}</div>}
          </div>
        );
      },
    },
    {
      accessorKey: 'last_contacted_at',
      header: 'Last Contact',
      cell: ({ row }) => {
        const lastContacted = row.getValue('last_contacted_at') as string;
        const createdAt = row.original.created_at;
        
        if (lastContacted) {
          return (
            <div className="text-sm">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1 text-gray-400" />
                {formatDistanceToNow(new Date(lastContacted), { addSuffix: true })}
              </div>
            </div>
          );
        }
        
        return (
          <div className="text-sm text-gray-400">
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              Created {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </div>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const lead = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEditLead?.(lead)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Lead
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSendEmail?.(lead.id)}>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAssignLead?.(lead.id)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Agent
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Tag className="h-4 w-4 mr-2" />
                Add Tag
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDeleteLead?.(lead.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: leads,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  const selectedLeadIds = Object.keys(rowSelection);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search leads by name, email, or phone..."
            value={(table.getColumn('first_name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('first_name')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedLeadIds.length > 0 && (
            <div className="mr-4 text-sm text-gray-600">
              {selectedLeadIds.length} selected
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={() => table.getColumn('status')?.setFilterValue('new')}>
                New Leads
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn('status')?.setFilterValue('contacted')}>
                Contacted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn('status')?.setFilterValue('qualified')}>
                Qualified
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn('lead_score')?.setFilterValue([70, 100])}>
                Hot Leads (70+)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No leads found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {table.getRowModel().rows.length} of {leads.length} leads
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: table.getPageCount() }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={table.getState().pagination.pageIndex + 1 === page ? "default" : "outline"}
                size="sm"
                onClick={() => table.setPageIndex(page - 1)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}