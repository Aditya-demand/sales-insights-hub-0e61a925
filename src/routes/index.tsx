import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { DataImport } from "@/components/dashboard/DataImport";
import { generateSampleData, type SalesRow } from "@/lib/sample-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulse — Sales & Revenue Analytics Dashboard" },
      {
        name: "description",
        content:
          "Interactive sales and revenue dashboard. Import CSV or Excel, track KPIs, and explore trends with charts, filters, and slicers.",
      },
      { property: "og:title", content: "Pulse — Sales & Revenue Analytics" },
      {
        property: "og:description",
        content: "Import data, track KPIs, and turn sales into insight.",
      },
    ],
  }),
  component: Index,
});

const ALL = "__all__";
const fmtCurrency = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
      ? `$${(n / 1_000).toFixed(1)}K`
      : `$${n.toFixed(0)}`;
const fmtNum = (n: number) => n.toLocaleString();

function Index() {
  const [rows, setRows] = useState<SalesRow[]>(() => generateSampleData());
  const [source, setSource] = useState<string>("Sample dataset");
  const [range, setRange] = useState<"30" | "90" | "365" | "all">("90");
  const [region, setRegion] = useState<string>(ALL);
  const [category, setCategory] = useState<string>(ALL);
  const [channel, setChannel] = useState<string>(ALL);

  const regions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.region))).sort(),
    [rows],
  );
  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category))).sort(),
    [rows],
  );
  const channels = useMemo(
    () => Array.from(new Set(rows.map((r) => r.channel))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const cutoff =
      range === "all"
        ? null
        : (() => {
            const d = new Date();
            d.setDate(d.getDate() - parseInt(range));
            return d.toISOString().slice(0, 10);
          })();
    return rows.filter((r) => {
      if (cutoff && r.date < cutoff) return false;
      if (region !== ALL && r.region !== region) return false;
      if (category !== ALL && r.category !== category) return false;
      if (channel !== ALL && r.channel !== channel) return false;
      return true;
    });
  }, [rows, range, region, category, channel]);

  const prevPeriod = useMemo(() => {
    if (range === "all") return [] as SalesRow[];
    const days = parseInt(range);
    const end = new Date();
    end.setDate(end.getDate() - days);
    const start = new Date();
    start.setDate(start.getDate() - days * 2);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    return rows.filter((r) => {
      if (r.date < startStr || r.date >= endStr) return false;
      if (region !== ALL && r.region !== region) return false;
      if (category !== ALL && r.category !== category) return false;
      if (channel !== ALL && r.channel !== channel) return false;
      return true;
    });
  }, [rows, range, region, category, channel]);

  const totals = useMemo(() => {
    const revenue = filtered.reduce((s, r) => s + r.revenue, 0);
    const units = filtered.reduce((s, r) => s + r.units, 0);
    const orders = filtered.length;
    const aov = orders ? revenue / orders : 0;
    const prevRev = prevPeriod.reduce((s, r) => s + r.revenue, 0);
    const prevUnits = prevPeriod.reduce((s, r) => s + r.units, 0);
    const prevOrders = prevPeriod.length;
    const prevAov = prevOrders ? prevRev / prevOrders : 0;
    const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);
    return {
      revenue,
      units,
      orders,
      aov,
      dRev: pct(revenue, prevRev),
      dUnits: pct(units, prevUnits),
      dOrders: pct(orders, prevOrders),
      dAov: pct(aov, prevAov),
    };
  }, [filtered, prevPeriod]);

  const trend = useMemo(() => {
    const map = new Map<string, { date: string; revenue: number; units: number }>();
    for (const r of filtered) {
      const e = map.get(r.date) ?? { date: r.date, revenue: 0, units: 0 };
      e.revenue += r.revenue;
      e.units += r.units;
      map.set(r.date, e);
    }
    const arr = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    // For long ranges, downsample to weekly
    if (arr.length > 90) {
      const weekly = new Map<string, { date: string; revenue: number; units: number }>();
      for (const d of arr) {
        const dt = new Date(d.date);
        const day = dt.getUTCDay();
        dt.setUTCDate(dt.getUTCDate() - day);
        const key = dt.toISOString().slice(0, 10);
        const e = weekly.get(key) ?? { date: key, revenue: 0, units: 0 };
        e.revenue += d.revenue;
        e.units += d.units;
        weekly.set(key, e);
      }
      return Array.from(weekly.values()).sort((a, b) => a.date.localeCompare(b.date));
    }
    return arr;
  }, [filtered]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { product: string; revenue: number; units: number }>();
    for (const r of filtered) {
      const e = map.get(r.product) ?? { product: r.product, revenue: 0, units: 0 };
      e.revenue += r.revenue;
      e.units += r.units;
      map.set(r.product, e);
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 7);
  }, [filtered]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) map.set(r.category, (map.get(r.category) ?? 0) + r.revenue);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const byRegion = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) map.set(r.region, (map.get(r.region) ?? 0) + r.revenue);
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const pieColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-[1400px] px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl grid place-items-center text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Pulse Analytics</h1>
              <p className="text-xs text-muted-foreground">
                Sales & revenue intelligence
              </p>
            </div>
          </div>
          <DataImport
            onData={(r, s) => {
              setRows(r);
              setSource(s);
            }}
            onSample={() => {
              setRows(generateSampleData());
              setSource("Sample dataset");
            }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-8 space-y-6">
        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="rounded-full">
              {source} · {fmtNum(rows.length)} rows
            </Badge>
            <div className="flex-1" />
            <FilterSelect
              label="Range"
              value={range}
              onChange={(v) => setRange(v as typeof range)}
              options={[
                { value: "30", label: "Last 30 days" },
                { value: "90", label: "Last 90 days" },
                { value: "365", label: "Last 12 months" },
                { value: "all", label: "All time" },
              ]}
            />
            <FilterSelect
              label="Region"
              value={region}
              onChange={setRegion}
              options={[{ value: ALL, label: "All regions" }, ...regions.map((r) => ({ value: r, label: r }))]}
            />
            <FilterSelect
              label="Category"
              value={category}
              onChange={setCategory}
              options={[{ value: ALL, label: "All categories" }, ...categories.map((r) => ({ value: r, label: r }))]}
            />
            <FilterSelect
              label="Channel"
              value={channel}
              onChange={setChannel}
              options={[{ value: ALL, label: "All channels" }, ...channels.map((r) => ({ value: r, label: r }))]}
            />
          </div>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Revenue" value={fmtCurrency(totals.revenue)} delta={range === "all" ? undefined : totals.dRev} icon={DollarSign} accent="primary" />
          <KpiCard label="Units Sold" value={fmtNum(totals.units)} delta={range === "all" ? undefined : totals.dUnits} icon={Package} accent="accent" />
          <KpiCard label="Orders" value={fmtNum(totals.orders)} delta={range === "all" ? undefined : totals.dOrders} icon={ShoppingCart} accent="chart-3" />
          <KpiCard label="Avg Order Value" value={fmtCurrency(totals.aov)} delta={range === "all" ? undefined : totals.dAov} icon={TrendingUp} accent="chart-4" />
        </div>

        {/* Trend */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">Revenue trend</h2>
              <p className="text-sm text-muted-foreground">Revenue over time across selected filters</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={fmtCurrency} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} width={60} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => fmtCurrency(v)}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Two-up: Top products + Category mix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-base font-semibold mb-1">Top performing products</h2>
            <p className="text-sm text-muted-foreground mb-4">Ranked by revenue contribution</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 20, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tickFormatter={fmtCurrency} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="product" width={140} tick={{ fill: "var(--foreground)", fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => fmtCurrency(v)}
                  />
                  <Bar dataKey="revenue" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-semibold mb-1">Category mix</h2>
            <p className="text-sm text-muted-foreground mb-4">Revenue by category</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => fmtCurrency(v)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Region bars + table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-6">
            <h2 className="text-base font-semibold mb-1">Revenue by region</h2>
            <p className="text-sm text-muted-foreground mb-4">Geographic performance</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byRegion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={fmtCurrency} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} width={60} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => fmtCurrency(v)}
                  />
                  <Bar dataKey="value" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-semibold mb-1">Top products detail</h2>
            <p className="text-sm text-muted-foreground mb-4">Revenue, units and AOV</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2 font-medium">Product</th>
                    <th className="py-2 font-medium text-right">Units</th>
                    <th className="py-2 font-medium text-right">Revenue</th>
                    <th className="py-2 font-medium text-right">Avg / unit</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p) => (
                    <tr key={p.product} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 font-medium">{p.product}</td>
                      <td className="py-2.5 text-right tabular-nums">{fmtNum(p.units)}</td>
                      <td className="py-2.5 text-right tabular-nums">{fmtCurrency(p.revenue)}</td>
                      <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                        {fmtCurrency(p.revenue / Math.max(p.units, 1))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-4">
          Tip: Import a CSV/XLSX with columns <code className="px-1 py-0.5 rounded bg-muted">date, product, category, region, channel, units, revenue</code>.
        </p>
      </main>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-[170px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
