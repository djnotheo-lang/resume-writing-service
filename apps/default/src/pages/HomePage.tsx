import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Check, FileText, Loader2, RefreshCw } from 'lucide-react';
import { useLiveNodes } from '@/hooks/use-live-nodes';
import { createNode, getFieldNumber, getFieldValue, getTitle, uploadFile } from '@/lib/genesis-data';
import { cn } from '@/lib/utils';

const ORDERS = 'e5U6GqDFbNC3knaF';
const SERVICES = 'Y2BYLspCw2uzL5LL';

export default function HomePage() {
  const serviceState = useLiveNodes(SERVICES);
  const [form, setForm] = useState({ name: '', email: '', service: '', role: '', link: '' });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const services = useMemo(() => serviceState.nodes
    .filter((row) => !(getFieldValue(row, 'Sample data') ?? '').trim())
    .map((row) => ({
      id: row.id,
      name: getTitle(row) ?? 'Leistung',
      price: getFieldNumber(row, 'Price'),
      days: getFieldNumber(row, 'Business days'),
      detail: getFieldValue(row, 'What is included') ?? '',
    })), [serviceState.nodes]);
  const selectedService = services.find((service) => service.name === form.service);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.service.trim()) {
      setError('Bitte wählen oder beschreiben Sie die gewünschte Leistung.');
      return;
    }
    if (!file) {
      setError('Bitte laden Sie Ihren aktuellen Lebenslauf hoch.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Bitte wählen Sie eine Datei unter 10 MB.');
      return;
    }
    setSaving(true);
    try {
      const uploaded = await uploadFile(file);
      const orderNumber = `CV-${Date.now().toString().slice(-6)}`;
      const values: Record<string, string> = {
        '/text': `Anfrage von ${form.name}`,
        'Order number': orderNumber,
        Customer: form.name,
        Email: form.email,
        'Service requested': form.service,
        'Resume file': uploaded.url,
        Status: 'new',
        'File status': 'Datei eingegangen',
      };
      if (form.role.trim()) values['Target role'] = form.role.trim();
      if (form.link.trim()) values['Job posting link'] = form.link.trim();
      const result = await createNode(ORDERS, values);
      if (result.ignoredKeys.length) throw new Error('Einige Angaben konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ihre Anfrage konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'USD' }).format(price);

  return (
    <main className="min-h-screen overflow-hidden pb-20">
      <header className="kit-glass sticky top-0 z-30 border-x-0 border-t-0">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="brand flex min-h-11 min-w-0 items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><FileText size={16} /></span>
            <span className="truncate">Enviar seu Curriculo Vitate</span>
          </Link>
          <Link to="/staff" className="ml-3 inline-flex min-h-11 shrink-0 items-center rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ease-out hover:bg-accent active:scale-[.98] motion-reduce:transform-none">Mitarbeiterbereich</Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-14">
        <div aria-hidden className="kit-glow absolute right-0 top-4 h-[32rem] w-[32rem] sm:right-8" />
        <div className="kit-glass relative overflow-hidden rounded-2xl p-6 shadow-lg sm:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,.72fr)] lg:gap-12">
            <div className="relative z-10 min-w-0">
              <p className="kit-eyebrow text-sm font-semibold tracking-wide">Ihr nächster Schritt beginnt mit einem starken Lebenslauf</p>
              <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">Ihr Lebenslauf. Ihre nächste Chance.</h1>
              <p className="mt-5 max-w-xl leading-7 text-muted-foreground">Teilen Sie Ihren Lebenslauf und sagen Sie uns, wobei Sie Unterstützung brauchen. Wir melden uns mit den nächsten Schritten.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#anfrage" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 ease-out hover:brightness-110 active:scale-[.98] motion-reduce:transform-none">Anfrage starten</a>
                <a href="#leistungen" className="inline-flex min-h-11 items-center justify-center rounded-xl border bg-background/60 px-5 py-2 text-sm font-semibold transition-all duration-200 ease-out hover:bg-accent active:scale-[.98] motion-reduce:transform-none">Leistungen ansehen</a>
              </div>
            </div>
            <article className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-primary/50 bg-card p-6 shadow-[0_18px_48px_-22px_hsl(var(--primary)/0.5)] lg:mx-0">
              <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Persönliche Unterstützung</p>
              <h2 className="mt-3 text-2xl font-semibold">Ein guter Eindruck beginnt auf dem Papier.</h2>
              <p className="mt-3 leading-6 text-muted-foreground">Beschreiben Sie Ihr Ziel, laden Sie Ihren Lebenslauf hoch und wir kümmern uns um den nächsten Schritt.</p>
              <p className="mt-5 border-t pt-4 text-sm text-muted-foreground">Ihre Anfrage wird im Mitarbeiterbereich bearbeitet.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="leistungen" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div><p className="kit-eyebrow text-sm font-semibold">Für Ihren nächsten Schritt</p><h2 className="mt-1 text-2xl font-semibold">Leistungen</h2></div>
          {services.length > 0 && <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-foreground">{services.length} Angebote</span>}
        </div>
        {serviceState.loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />)}</div> : services.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const selected = form.service === service.name;
              return <button key={service.id} type="button" aria-pressed={selected} onClick={() => setForm({ ...form, service: service.name })} className={cn('relative min-h-44 rounded-2xl border bg-card p-5 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/50 motion-reduce:hover:translate-y-0', selected && 'border-primary shadow-[0_14px_36px_-24px_hsl(var(--primary)/0.8)]')}>
                <span className="absolute right-4 top-4 grid size-6 place-items-center rounded-full border border-border">{selected && <Check size={15} className="text-primary" />}</span>
                <span className="block pr-8 text-xl font-semibold">{service.name}</span>
                <span className="mt-2 block min-h-12 text-sm leading-6 text-muted-foreground">{service.detail || 'Details erhalten Sie auf Anfrage.'}</span>
                <span className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold"><span>{service.price != null ? formatPrice(service.price) : 'Preis auf Anfrage'}</span><span className="text-muted-foreground">{service.days != null && service.days > 0 ? `${service.days} Werktage` : 'Termin nach Absprache'}</span></span>
              </button>;
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-card/60 p-6 sm:p-8"><p className="font-semibold">Ihre Angebote werden hier angezeigt.</p><p className="mt-2 max-w-2xl leading-6 text-muted-foreground">Die bisherigen Beispieldaten werden nicht als echte Preise oder Leistungen ausgegeben. Bis Ihre Angebote eingetragen sind, können Kund:innen eine individuelle Anfrage senden.</p></div>
        )}
        {serviceState.error && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-destructive/5 p-3 text-sm"><span className="inline-flex items-center gap-2"><AlertCircle size={16} />Die Angebotsliste konnte nicht aktualisiert werden.</span><button type="button" onClick={() => void serviceState.refresh()} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-semibold hover:bg-accent"><RefreshCw size={15} />Erneut laden</button></div>}
      </section>

      <section id="anfrage" className="mx-auto max-w-2xl scroll-mt-20 px-4 sm:px-6">
        <div className="rounded-2xl border bg-card p-5 shadow-lg sm:p-7">
          <p className="kit-eyebrow text-sm font-semibold">Wir hören Ihnen zu</p>
          <h2 className="mt-1 text-2xl font-semibold">Ihre Anfrage</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Senden Sie uns die wichtigsten Angaben. Ihre Datei wird zur Bearbeitung gespeichert.</p>
          {sent ? <div className="mt-6 rounded-xl bg-accent p-5"><Check className="mb-2 text-foreground" /><h3 className="font-semibold">Anfrage eingegangen</h3><p className="mt-1 text-sm text-muted-foreground">Vielen Dank. Wir melden uns per E-Mail mit den nächsten Schritten.</p></div> : (
            <form data-genesis-form onSubmit={submit} className="mt-6 grid gap-4">
              <label className="text-sm font-medium">Gewünschte Leistung oder Ihr Anliegen<textarea required rows={3} value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })} placeholder={services.length ? 'Wählen Sie oben eine Leistung oder beschreiben Sie Ihren Wunsch.' : 'Wobei können wir Sie unterstützen?'} className="mt-2 w-full rounded-xl border bg-background px-3 py-2 leading-6" /></label>
              {selectedService && <p className="-mt-2 text-sm text-muted-foreground">Ausgewählt: {selectedService.name}{selectedService.price != null ? ` · ${formatPrice(selectedService.price)}` : ''}</p>}
              <label className="text-sm font-medium">Name<input required autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border bg-background px-3" /></label>
              <label className="text-sm font-medium">E-Mail<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border bg-background px-3" /></label>
              <label className="text-sm font-medium">Zielposition, falls bekannt<input value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border bg-background px-3" /></label>
              <label className="text-sm font-medium">Link zur Stellenausschreibung, falls vorhanden<input type="url" inputMode="url" value={form.link} onChange={(event) => setForm({ ...form, link: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border bg-background px-3" /></label>
              <label className="text-sm font-medium">Lebenslauf, PDF oder Word<input required type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => { const next = event.target.files?.[0] ?? null; setFile(next); if (next && next.size > 10 * 1024 * 1024) setError('Bitte wählen Sie eine Datei unter 10 MB.'); }} className="mt-2 block min-h-11 w-full rounded-xl border bg-background p-2 text-sm" /><span className="mt-1 block text-sm text-muted-foreground">Maximal 10 MB.</span></label>
              {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-foreground">{error}</p>}
              <button disabled={saving} className="flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2 font-semibold text-primary-foreground transition-all duration-200 ease-out hover:brightness-110 active:scale-[.98] disabled:opacity-90 motion-reduce:transform-none">{saving ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : 'Anfrage senden'}</button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
