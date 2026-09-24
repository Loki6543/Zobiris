import { Activity, BrainCircuit, GitBranch, Radar, ShieldAlert, ShieldCheck, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { IntelligenceOverviewApi } from './types';

function ShadowBadge() {
  return <Badge variant="outline" className="border-violet-400/40 bg-violet-500/10 text-violet-200">SHADOW ONLY</Badge>;
}

export function IntelligenceOverview({ data }: { data: IntelligenceOverviewApi }) {
  const bestRelative = [...data.relativeOpportunity].sort((a, b) => b.btcRelativeScore - a.btcRelativeScore)[0];
  const strongestEdge = [...data.ecosystemEdges].sort((a, b) => b.conditionalOpportunity - a.conditionalOpportunity)[0];
  const safestExecution = data.executionReadiness.find((item) => item.action === 'MAKER_SAFE') ?? data.executionReadiness[0];
  const hottestAttention = [...(data.attentionIgnition ?? [])].sort((a, b) => b.attentionLeadScore - a.attentionLeadScore)[0];
  const highestOwnershipRisk = [...(data.ownershipRisk ?? [])].sort((a, b) => b.riskScore - a.riskScore)[0];
  return (
    <div className="grid gap-4">
      <Card className="border-primary/30 bg-[radial-gradient(circle_at_top_right,rgba(124,92,246,.14),transparent_42%),hsl(var(--card)/.82)]">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><BrainCircuit className="size-4 text-primary" /> Intelligence Overview</CardTitle>
            <CardDescription className="mt-1">A second opinion around Strategy 2.1—not a second trading authority.</CardDescription>
          </div>
          <ShadowBadge />
        </CardHeader>
        <CardContent className="grid gap-2 text-[10px] text-muted-foreground sm:grid-cols-2">
          <span>Source: {data.provenance.source}</span><span className="sm:text-right">Mode: {data.provenance.dataMode}</span>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80 bg-card/75"><CardHeader className="p-4 pb-2"><ShieldCheck className="size-4 text-amber-300" /><CardDescription>Research trust</CardDescription><CardTitle className="text-xl">{data.researchIntegrity.overallStatus}</CardTitle></CardHeader><CardContent className="px-4 pb-4 text-[10px] text-muted-foreground">{data.researchIntegrity.experimentCount} experiments disclosed</CardContent></Card>
        <Card className="border-border/80 bg-card/75"><CardHeader className="p-4 pb-2"><Target className="size-4 text-emerald-300" /><CardDescription>Best vs BTC</CardDescription><CardTitle className="text-xl">{bestRelative?.symbol ?? '—'}</CardTitle></CardHeader><CardContent className="px-4 pb-4"><Progress value={bestRelative?.btcRelativeScore ?? 0} /><p className="mt-2 text-[10px] text-muted-foreground">{bestRelative?.btcRelativeScore ?? 0}/100 relative score</p></CardContent></Card>
        <Card className="border-border/80 bg-card/75"><CardHeader className="p-4 pb-2"><GitBranch className="size-4 text-blue-300" /><CardDescription>Strongest ecosystem edge</CardDescription><CardTitle className="text-xl">{strongestEdge ? `${strongestEdge.parentSymbol} → ${strongestEdge.childSymbol}` : '—'}</CardTitle></CardHeader><CardContent className="px-4 pb-4 text-[10px] text-muted-foreground">{strongestEdge?.state ?? 'UNKNOWN'} · {Math.round(strongestEdge?.conditionalOpportunity ?? 0)}/100</CardContent></Card>
        <Card className="border-border/80 bg-card/75"><CardHeader className="p-4 pb-2"><Activity className="size-4 text-cyan-300" /><CardDescription>Execution state</CardDescription><CardTitle className="text-xl">{safestExecution?.action.replaceAll('_', ' ') ?? '—'}</CardTitle></CardHeader><CardContent className="px-4 pb-4 text-[10px] text-muted-foreground">{safestExecution?.symbol ?? '—'} · ${safestExecution?.allowedOrderUsd.toFixed(0) ?? '0'} capacity-approved</CardContent></Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-border/80 bg-card/75"><CardHeader className="p-4 pb-2"><Radar className="size-4 text-fuchsia-300" /><CardDescription>Attention lead</CardDescription><CardTitle className="text-xl">{hottestAttention?.symbol ?? '—'}</CardTitle></CardHeader><CardContent className="px-4 pb-4 text-[10px] text-muted-foreground">{hottestAttention?.state ?? 'UNKNOWN'} · lead {hottestAttention?.attentionLeadScore.toFixed(0) ?? '0'} · {hottestAttention?.confirmingSources ?? 0} confirming sources</CardContent></Card>
        <Card className="border-border/80 bg-card/75"><CardHeader className="p-4 pb-2"><ShieldAlert className="size-4 text-rose-300" /><CardDescription>Ownership risk</CardDescription><CardTitle className="text-xl">{highestOwnershipRisk?.symbol ?? '—'}</CardTitle></CardHeader><CardContent className="px-4 pb-4 text-[10px] text-muted-foreground">{highestOwnershipRisk?.state ?? 'UNKNOWN'} · risk {highestOwnershipRisk?.riskScore.toFixed(0) ?? '0'} · shadow veto {highestOwnershipRisk?.shadowRiskVeto ? 'YES' : 'NO'}</CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/80 bg-card/75"><CardHeader><CardTitle className="text-sm">Relative allocation decisions</CardTitle><CardDescription>Positive USD return is not enough; benchmark opportunity cost is explicit.</CardDescription></CardHeader><CardContent className="grid gap-2">{data.relativeOpportunity.map((item) => <div key={item.symbol} className="rounded-lg border border-border/70 bg-secondary/20 p-3"><div className="flex items-center justify-between gap-3"><span className="font-semibold">{item.symbol}</span><Badge variant="outline">{item.recommendation}</Badge></div><p className="mt-2 text-[11px] leading-5 text-muted-foreground">{item.summary}</p></div>)}</CardContent></Card>
        <Card className="border-border/80 bg-card/75"><CardHeader><CardTitle className="text-sm">Relationship edges</CardTitle><CardDescription>Directional ecosystem evidence rather than static correlation alone.</CardDescription></CardHeader><CardContent className="grid gap-2">{data.ecosystemEdges.map((edge) => <div key={`${edge.parentSymbol}-${edge.childSymbol}`} className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/20 p-3"><div><p className="text-xs font-semibold">{edge.parentSymbol} → {edge.childSymbol}</p><p className="mt-1 text-[10px] text-muted-foreground">β {edge.rollingBeta?.toFixed(2) ?? '—'} · lag {edge.leadLagMinutes ?? '—'}m · flow {edge.capitalFlowDataMode}</p></div><Badge variant="outline">{edge.state}</Badge></div>)}</CardContent></Card>
      </div>
    </div>
  );
}