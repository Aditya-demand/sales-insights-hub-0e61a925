import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Database, FileSpreadsheet } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import type { SalesRow } from "@/lib/sample-data";

type Props = {
  onData: (rows: SalesRow[], source: string) => void;
  onSample: () => void;
};

function normalizeRow(r: Record<string, unknown>): SalesRow | null {
  const lower: Record<string, unknown> = {};
  for (const k of Object.keys(r)) lower[k.toLowerCase().trim()] = r[k];
  const date = String(lower.date ?? lower["order date"] ?? lower.order_date ?? "");
  const product = String(lower.product ?? lower["product name"] ?? lower.item ?? "Unknown");
  const category = String(lower.category ?? lower.dept ?? "General");
  const region = String(lower.region ?? lower.country ?? "Global");
  const channel = String(lower.channel ?? lower.source ?? "Online");
  const units = Number(lower.units ?? lower.quantity ?? lower.qty ?? 1);
  const revenue = Number(
    lower.revenue ?? lower.sales ?? lower.amount ?? lower.total ?? 0,
  );
  if (!date || isNaN(revenue)) return null;
  // Try to coerce date
  let iso = date;
  if (!/^\d{4}-\d{2}-\d{2}/.test(date)) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) iso = d.toISOString().slice(0, 10);
    else return null;
  } else {
    iso = date.slice(0, 10);
  }
  return { date: iso, product, category, region, channel, units, revenue };
}

export function DataImport({ onData, onSample }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const name = file.name.toLowerCase();
    try {
      let raw: Record<string, unknown>[] = [];
      if (name.endsWith(".csv")) {
        const text = await file.text();
        const parsed = Papa.parse<Record<string, unknown>>(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });
        raw = parsed.data;
      } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
      } else {
        toast.error("Unsupported file format. Use CSV or Excel.");
        return;
      }
      const rows = raw.map(normalizeRow).filter((x): x is SalesRow => !!x);
      if (rows.length === 0) {
        toast.error("No valid rows found. Expected columns: date, product, category, region, channel, units, revenue.");
        return;
      }
      onData(rows, file.name);
      toast.success(`Imported ${rows.length.toLocaleString()} rows from ${file.name}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to parse file.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <Button onClick={() => fileRef.current?.click()} className="gap-2">
        <Upload className="h-4 w-4" />
        Import CSV / Excel
      </Button>
      <Button variant="outline" onClick={onSample} className="gap-2">
        <FileSpreadsheet className="h-4 w-4" />
        Load sample data
      </Button>
      <Button variant="ghost" disabled className="gap-2">
        <Database className="h-4 w-4" />
        Connect database
      </Button>
    </div>
  );
}