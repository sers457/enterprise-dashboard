import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Download, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';

interface Column {
  key: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (item: any) => React.ReactNode;
  width?: string;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  keyExtractor: (item: Record<string, unknown>) => string;
  onRowClick?: (item: Record<string, unknown>) => void;
  searchable?: boolean;
  searchKeys?: string[];
  pageSize?: number;
  selectable?: boolean;
  onSelectionChange?: (selected: string[]) => void;
  emptyMessage?: string;
  loading?: boolean;
  exportable?: boolean;
  onExport?: () => void;
  className?: string;
}

export function DataTable({
  columns,
  data,
  keyExtractor,
  onRowClick,
  searchable = true,
  searchKeys,
  pageSize = 10,
  selectable = false,
  onSelectionChange,
  emptyMessage = 'No data found',
  loading = false,
  exportable = false,
  onExport,
  className,
}: DataTableProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return data;
    const keys = searchKeys || (columns.length > 0 ? [columns[0].key] : []);
    return data.filter((item) =>
      keys.some((key) => {
        const val = item[key];
        return String(val || '').toLowerCase().includes(search.toLowerCase());
      })
    );
  }, [data, search, searchKeys, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), 'en', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
      onSelectionChange?.(next);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.length === paginated.length) {
      setSelected([]);
      onSelectionChange?.([]);
    } else {
      const all = paginated.map(keyExtractor);
      setSelected(all);
      onSelectionChange?.(all);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {(searchable || exportable) && (
        <div className="flex items-center gap-3">
          {searchable && (
            <div className="flex-1">
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          {exportable && (
            <Button variant="secondary" size="sm" onClick={onExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 dark:bg-dark-800/50">
                {selectable && (
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={paginated.length > 0 && selected.length === paginated.length}
                      onChange={toggleSelectAll}
                      className="rounded border-neutral-300 dark:border-neutral-600"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider',
                      col.sortable && 'cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-200'
                    )}
                    style={{ width: col.width }}
                    onClick={() => col.sortable && toggleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && sortKey === col.key && (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {selectable && <td className="px-4 py-3"><div className="skeleton h-4 w-4 rounded" /></td>}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3"><div className="skeleton h-4 w-full rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center text-neutral-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      'transition-colors hover:bg-neutral-50 dark:hover:bg-dark-800/30',
                      onRowClick && 'cursor-pointer',
                      selected.includes(keyExtractor(item)) && 'bg-primary-50 dark:bg-primary-900/10'
                    )}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(keyExtractor(item))}
                          onChange={() => toggleSelect(keyExtractor(item))}
                          className="rounded border-neutral-300 dark:border-neutral-600"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                        {col.render ? col.render(item) : String(item[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, page - 2);
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <Button
                  key={p}
                  variant={p === page ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setPage(p)}
                  className="min-w-[2rem]"
                >
                  {p}
                </Button>
              );
            })}
            <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
