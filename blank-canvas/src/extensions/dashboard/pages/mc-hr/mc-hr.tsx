import { useCallback, useEffect, useState } from 'react';
import { items } from '@wix/data';
import { files } from '@wix/media';
import { Button, Input, Page, Text, WixDesignSystemProvider } from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { resources, type Resource } from './resources';
import { canPerformJob } from '../../../../lib/hr-rules';

type Row = { _id: string; [key: string]: unknown };
const collectionId = (resource: Resource) => `mc-hr/${resource.id}`;

function display(value: unknown): string {
  if (value === undefined || value === null) return '—';
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function ManagerDashboard() {
  const [resource, setResource] = useState(resources[0]);
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [attachment, setAttachment] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    setMessage('');
    try {
      const result = await items.query(collectionId(resource)).limit(100).find();
      setRows(result.items as Row[]);
    } catch (error) {
      console.error('Failed to load HR records', error);
      setMessage('Could not load records. Check app permissions and the installed collection version.');
    } finally {
      setBusy(false);
    }
  }, [resource]);

  useEffect(() => { void load(); }, [load]);

  function open(row: Row | null) {
    setEditing(row ?? { _id: '' });
    setDraft(Object.fromEntries(resource.fields.map(({ key, kind }) => [key,
      Array.isArray(row?.[key]) && kind === 'days' ? (row[key] as string[]).join(',') :
        display(row?.[key]) === '—' ? '' : display(row?.[key])])));
    setAttachment(null);
    setMessage('');
  }

  async function save() {
    const missing = resource.fields.find((field) => field.required && !draft[field.key]?.trim());
    if (missing) { setMessage(`${missing.label} is required.`); return; }
    if (resource.id === 'tasks' && draft.taskType === 'recurring_weekly' &&
      (!draft.recurringDays || draft.recurringDays.split(',').some((day) =>
        !['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].includes(day.trim().toUpperCase())))) {
      setMessage('Enter recurring days as MON,TUE,...');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const updates = Object.fromEntries(resource.fields.map(({ key, kind }) => [
        key, kind === 'number' ? Number(draft[key] || 0) : kind === 'boolean' ?
          draft[key] === 'true' : kind === 'days' ?
          (draft[key] || '').split(',').map((day) => day.trim().toUpperCase()).filter(Boolean) : draft[key] || '',
      ]));
      if (resource.id === 'shifts' && draft.assignedStaffId) {
        const assignee = await items.get(collectionId(resources[0]), draft.assignedStaffId);
        if (!assignee) throw new Error('Assigned staff ID does not exist.');
        if (!canPerformJob(assignee.staffType, draft.roleRequired))
          throw new Error('The selected staff member cannot fill this role.');
      }
      if (resource.id === 'documents' && !editing?._id) {
        if (!attachment || attachment.size > 10 * 1024 * 1024 ||
          !['application/pdf', 'image/jpeg', 'image/png'].includes(attachment.type))
          throw new Error('Select a PDF, JPEG or PNG smaller than 10 MB.');
        if (draft.uploadedFor !== 'all' &&
          !await items.get(collectionId(resources[0]), draft.uploadedFor))
          throw new Error('Choose an existing staff ID or all.');
        const ticket = await files.generateFileUploadUrl(attachment.type, {
          fileName: attachment.name, private: true, filePath: '/mc-hr/shared',
        });
        if (!ticket.uploadUrl) throw new Error('Private document upload could not start.');
        const uploaded = await fetch(ticket.uploadUrl, { method: 'PUT',
          headers: { 'Content-Type': attachment.type }, body: attachment });
        if (!uploaded.ok) throw new Error('Private document upload failed.');
        const result = await uploaded.json() as { file?: { id?: string; private?: boolean } };
        if (!result.file?.id || result.file.private !== true)
          throw new Error('Private document upload was not confirmed.');
        Object.assign(updates, { fileUrl: result.file.id, fileName: attachment.name,
          fileSize: String(attachment.size), uploadedAt: new Date(), uploadedBy: 'Manager' });
      }
      if (editing?._id) {
        const existing = Object.fromEntries(Object.entries(editing).filter(([key]) => !key.startsWith('_')));
        await items.update(collectionId(resource), { _id: editing._id, ...existing, ...updates });
        if (resource.id === 'onboarding' && editing.staffId) {
          const staff = await items.get(collectionId(resources[0]), String(editing.staffId));
          if (staff) await items.update(collectionId(resources[0]), { _id: staff._id,
            ...Object.fromEntries(Object.entries(staff).filter(([key]) => !key.startsWith('_'))),
            onboardingStatus: updates.status,
            onboardingCompleted: updates.status === 'approved' });
        }
      } else {
        await items.insert(collectionId(resource), {
          ...updates,
          ...(resource.id === 'tasks' ? { isCompleted: false } : {}),
          ...(resource.id === 'staff' ? { onboardingCompleted: false } : {}),
          ...(resource.id === 'checklists' ? { isCompleted: false } : {}),
        });
      }
      setEditing(null);
      await load();
    } catch (error) {
      console.error('Failed to save HR record', error);
      setMessage(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <WixDesignSystemProvider>
      <Page>
        <Page.Header title="Malaya Corner HR" subtitle="Roster, staff and operations records" />
        <Page.Content>
          <nav aria-label="HR sections" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {resources.map((section) => (
              <Button key={section.id} size="small" priority={resource.id === section.id ? 'primary' : 'secondary'}
                onClick={() => { setResource(section); setEditing(null); }}>
                {section.label}
              </Button>
            ))}
          </nav>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text weight="bold">{resource.label} · {rows.length}{rows.length === 100 ? '+' : ''} records</Text>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="small" priority="secondary" disabled={busy} onClick={() => void load()}>Refresh</Button>
              {resource.canCreate && <Button size="small" onClick={() => open(null)}>Add {resource.label}</Button>}
            </div>
          </div>
          {message && <p role="alert" style={{ color: '#b91c1c' }}>{message}</p>}
          {editing && <section aria-label="Edit HR record" style={{ background: 'white', padding: 20, marginBottom: 20, border: '1px solid #ddd', borderRadius: 8 }}>
            <Text weight="bold">{editing._id ? 'Update' : 'Add'} {resource.label}</Text>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, margin: '16px 0' }}>
              {resource.fields.map((field) => <label key={field.key} style={{ display: 'grid', gap: 6 }}>
                <span>{field.label}{field.required ? ' *' : ''}</span>
                {field.kind === 'choice' || field.kind === 'boolean' ? <select value={draft[field.key] ?? ''}
                  onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}>
                  <option value="">Select</option>
                  {field.choices?.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
                </select> : <Input type={field.kind === 'number' ? 'number' : field.kind === 'date' ? 'date' : 'text'}
                  value={draft[field.key] ?? ''}
                  onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })} />}
              </label>)}
            </div>
            {resource.id === 'documents' && <label>Private document
              <input type="file" accept="application/pdf,image/jpeg,image/png"
                onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} />
            </label>}
            {resource.id === 'onboarding' && editing._id && <section style={{ margin: '16px 0' }}>
              <Text weight="bold">Submitted details</Text>
              {Object.entries(editing).filter(([key]) => key.startsWith('q') && !key.endsWith('Doc') &&
                key !== 'q15FoodHygieneCert').map(([key, value]) => <p key={key}>{key}: {display(value)}</p>)}
              {['q12VevoDoc', 'q13FoodHandlerDoc', 'q14TfnDoc', 'q15FoodHygieneCert'].map((key) => {
                const doc = editing[key] as { id?: string; fileName?: string } | undefined;
                return doc?.id ? <Button key={key} size="tiny" priority="secondary"
                  onClick={() => void download(doc.id!)}>{doc.fileName || key}</Button> : null;
              })}
            </section>}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button disabled={busy} onClick={() => void save()}>Save</Button>
              <Button priority="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </section>}
          <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead><tr>{resource.summary.map((field) => <th key={field} style={{ padding: 12, borderBottom: '1px solid #ddd' }}>{field}</th>)}<th>Action</th></tr></thead>
              <tbody>{rows.map((row) => <tr key={row._id}>
                {resource.summary.map((field) => <td key={field} style={{ padding: 12, borderBottom: '1px solid #eee' }}>{display(row[field])}</td>)}
                <td>{resource.canEdit && <Button size="tiny" priority="secondary" onClick={() => open(row)}>Edit</Button>}</td>
              </tr>)}</tbody>
            </table>
            {!busy && rows.length === 0 && <p style={{ padding: 20 }}>No records yet.</p>}
          </div>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
}

async function download(fileId: string) {
  try {
    const result = await files.generateFileDownloadUrl(fileId, { expirationInMinutes: 5 });
    const url = result.downloadUrls?.[0]?.url;
    if (!url) return;
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.rel = 'noopener noreferrer';
    anchor.click();
  } catch (error) {
    console.error('Unable to download private file', error);
  }
}
