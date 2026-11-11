import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { CalendarDays, ChevronDown, ChevronLeft, FileSearch, RefreshCw, Users } from 'lucide-react';
import { useLiveNodes } from '@/hooks/use-live-nodes';
import { getFieldLabel, getFieldValue, getTitle, updateNode } from '@/lib/genesis-data';
import { useGenesisRole } from '@/lib/genesis-auth';

const ORDERS = 'e5U6GqDFbNC3knaF';
const WRITERS = 'YDK5JEC9oADeJMCt';
const ISSUES = 'y5JXMtf6M1NK9Rcv';
const statuses = ['New', 'Paid', 'In progress', 'Draft sent', 'Revision', 'Done', 'Cancelled'];
const statusIds: Record<string, string> = { New: 'new', Paid: 'paid', 'In progress': 'progress', 'Draft sent': 'draft', Revision: 'revision', Done: 'done', Cancelled: 'cancelled' };
const statusLabels: Record<string, string> = { New: 'Neu', Paid: 'Bezahlt', 'In progress': 'In Bearbeitung', 'Draft sent': 'Entwurf gesendet', Revision: 'Überarbeitung', Done: 'Abgeschlossen', Cancelled: 'Storniert' };

type Order = { id: string; customer: string; status: string; service: string; due: string; paidOn: string; writer: string; sample: boolean };

function friendlyDate(value: string | undefined) {
  if (!value) return 'Termin noch offen';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Termin noch offen' : date.toLocaleDateString('de-CH', { month: 'short', day: 'numeric' });
}

function SignInCard() {
  const auth = useAuth();
  return <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 pb-28"><section className="w-full rounded-2xl border bg-card p-6 shadow-lg"><p className="text-sm font-medium text-muted-foreground">Mitarbeiterbereich</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Willkommen zurück.</h1><p className="mt-3 leading-7 text-muted-foreground">Melden Sie sich an, um Kundenanfragen zu sehen.</p><button onClick={() => auth.signinRedirect()} className="mt-6 min-h-11 rounded-xl bg-primary px-5 py-2 font-semibold text-primary-foreground transition-all duration-150 hover:brightness-110 active:scale-[.98] motion-reduce:transform-none">Anmelden</button></section></main>;
}

export default function StaffPage() {
  const auth = useAuth();
  const role = useGenesisRole();
  const ordersState = useLiveNodes(ORDERS);
  const writersState = useLiveNodes(WRITERS);
  const issuesState = useLiveNodes(ISSUES);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');

  const orders = useMemo<Order[]>(() => {
    const ownId = String(auth.user?.profile.sub ?? '');
    const all = ordersState.nodes.map((row) => ({
      id: row.id,
      customer: getFieldValue(row, 'Customer') ?? getTitle(row, 'Customer') ?? 'Anfrage',
      status: getFieldLabel(row, 'Status') ?? getFieldValue(row, 'Status') ?? 'New',
      service: getFieldValue(row, 'Service requested') ?? getFieldLabel(row, 'Package') ?? getFieldValue(row, 'Package') ?? 'Leistung noch offen',
      due: friendlyDate(getFieldValue(row, 'Due date')),
      paidOn: getFieldValue(row, 'Paid on') ?? '',
      writer: getFieldValue(row, 'Writer') ?? 'Noch nicht zugewiesen',
      sample: Boolean(getFieldValue(row, 'Sample data')),
    }));
    return role === 'admin' ? all : all.filter((order) => getFieldValue(ordersState.nodes.find((row) => row.id === order.id)!, 'Owner ID') === ownId);
  }, [auth.user?.profile.sub, ordersState.nodes, role]);

  if (!auth.isAuthenticated) return <SignInCard />;

  async function moveOrder(order: Order, nextStatus: string) {
    setSavingId(order.id);
    setSaveError('');
    try {
      const fields: Record<string, string> = { Status: statusIds[nextStatus] ?? nextStatus };
      if (nextStatus === 'Paid' && !order.paidOn) fields['Paid on'] = new Date().toISOString();
      const result = await updateNode(ORDERS, order.id, fields);
      if (result.ignoredKeys.length) throw new Error('Der Auftragsstatus wurde nicht gespeichert.');
      await ordersState.refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Der Auftragsstatus wurde nicht gespeichert. Bitte versuchen Sie es erneut.');
    } finally {
      setSavingId(null);
    }
  }

  const loading = ordersState.loading || writersState.loading || issuesState.loading;
  const initialError = (ordersState.error && ordersState.updatedAt == null) || (writersState.error && writersState.updatedAt == null) || (issuesState.error && issuesState.updatedAt == null);
  const sampleVisible = orders.some((order) => order.sample);

  return <main className="mx-auto min-h-screen max-w-7xl px-4 pb-28 pt-7 sm:px-6"><header className="flex min-h-11 items-center justify-between gap-3"><Link to="/" className="brand flex min-h-11 min-w-0 items-center gap-2 truncate text-sm font-semibold"><ChevronLeft size={18} />Zur Kundenseite</Link><button onClick={() => { void ordersState.refresh(); void writersState.refresh(); void issuesState.refresh(); }} className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-all duration-150 hover:bg-accent active:scale-[.98] motion-reduce:transform-none"><RefreshCw size={16} />Aktualisieren</button></header>
    <section className="mt-8"><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight">Auftragsübersicht</h1>{sampleVisible && <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-foreground">Beispieldaten</span>}</div><p className="mt-2 text-muted-foreground">{role === 'admin' ? 'Alle Anfragen im Blick, damit der nächste Schritt nicht liegen bleibt.' : 'Sehen Sie die Ihnen zugewiesenen Aufträge und bringen Sie sie weiter.'}</p></section>
    {loading ? <div className="mt-8 grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />)}</div> : initialError ? <section className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/10 p-5"><p className="font-semibold">Die Aufträge konnten nicht geladen werden.</p><button onClick={() => void ordersState.refresh()} className="mt-3 min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Erneut versuchen</button></section> : <><section className="mt-8 grid gap-4 lg:grid-cols-3">{statuses.map((status) => { const lane = orders.filter((order) => order.status === status); return <article key={status} className="rounded-2xl border bg-card p-4"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{statusLabels[status]}</h2><span className="grid size-7 place-items-center rounded-full bg-accent text-sm font-semibold text-foreground">{lane.length}</span></div><div className="mt-4 space-y-3">{lane.length ? lane.map((order) => <div key={order.id} className="rounded-xl border bg-background p-3"><div className="flex items-start justify-between gap-2"><p className="min-w-0 font-medium">{order.customer}</p>{order.sample && <span className="shrink-0 rounded-full bg-accent px-2 py-1 text-[11px] font-semibold text-foreground">Beispieldaten</span>}</div><p className="mt-1 text-sm text-muted-foreground">{order.service}</p><p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground"><CalendarDays size={14} />{order.due}</p><p className="mt-1 text-sm text-muted-foreground">{order.writer}</p><label className="relative mt-3 block"><span className="sr-only">Auftragsstatus ändern</span><select aria-label={`Status für ${order.customer} ändern`} value={order.status} disabled={savingId === order.id} onChange={(event) => void moveOrder(order, event.target.value)} className="min-h-11 w-full appearance-none rounded-xl border bg-card px-3 pr-10 text-sm font-medium">{statuses.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}</select><ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-3 size-5 text-muted-foreground" /></label></div>) : <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Noch keine Anfragen in dieser Phase.</p>}</div></article>; })}</section>
      {role === 'admin' && <section className="mt-10 grid gap-4 lg:grid-cols-2"><article className="rounded-2xl border bg-card p-5"><div className="flex items-center gap-2"><Users size={18} /><h2 className="font-semibold">Team</h2></div><div className="mt-4 space-y-3">{writersState.nodes.filter((writer) => !(getFieldValue(writer, 'Sample data') ?? '').trim()).map((writer) => <div key={writer.id} className="flex items-center justify-between gap-3 rounded-xl bg-background p-3"><div className="min-w-0"><p className="truncate font-medium">{getFieldValue(writer, 'Name') ?? getTitle(writer, 'Name') ?? 'Teammitglied'}</p><p className="truncate text-sm text-muted-foreground">{getFieldValue(writer, 'Email') ?? 'E-Mail noch offen'}</p></div><span className="shrink-0 text-sm font-semibold">{getFieldValue(writer, 'Most open orders') ?? 'Nicht erfasst'} offen</span></div>)}</div>{writersState.nodes.filter((writer) => !(getFieldValue(writer, 'Sample data') ?? '').trim()).length === 0 && <p className="mt-4 rounded-xl bg-muted p-3 text-sm text-muted-foreground">Noch keine Teammitglieder eingetragen.</p>}</article><article className="rounded-2xl border bg-card p-5"><div className="flex items-center gap-2"><FileSearch size={18} /><h2 className="font-semibold">Prüfhinweise</h2></div><div className="mt-4 space-y-3">{issuesState.nodes.filter((issue) => !(getFieldValue(issue, 'Sample data') ?? '').trim()).slice(0, 6).map((issue) => <div key={issue.id} className="rounded-xl bg-background p-3"><p className="font-medium">{getFieldValue(issue, 'Issue') ?? getTitle(issue, 'Issue') ?? 'Hinweis'}</p><p className="mt-1 text-sm text-muted-foreground">{getFieldLabel(issue, 'Type') ?? getFieldValue(issue, 'Type') ?? 'Typ noch offen'}</p><p className="mt-2 text-sm text-muted-foreground">{getFieldValue(issue, 'Quoted line') ?? 'Keine Textzeile hinterlegt'}</p></div>)}</div>{issuesState.nodes.filter((issue) => !(getFieldValue(issue, 'Sample data') ?? '').trim()).length === 0 && <p className="mt-4 rounded-xl bg-muted p-3 text-sm text-muted-foreground">Noch keine Prüfhinweise vorhanden.</p>}</article></section>}</>}
    {saveError && <p role="alert" className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-foreground">{saveError}</p>}
    {(ordersState.error || writersState.error || issuesState.error) && (ordersState.updatedAt != null || writersState.updatedAt != null || issuesState.updatedAt != null) && <p className="mt-4 text-sm text-muted-foreground">Die zuletzt geladenen Daten werden angezeigt. Die letzte Aktualisierung war nicht vollständig.</p>}
  </main>;
}
