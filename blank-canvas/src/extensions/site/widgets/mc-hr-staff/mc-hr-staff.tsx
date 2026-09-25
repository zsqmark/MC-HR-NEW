import { httpClient } from '@wix/essentials';
import { window as wixWindow } from '@wix/site-window';
import styles from './mc-hr-staff.module.css';

type Entry = Record<string, unknown>;
type StaffData = {
  profile: { firstName: string; lastName: string; position: string; onboardingStatus: string };
  shifts: Entry[]; availability: Entry[]; clocks: Entry[]; tasks: Entry[];
  checklists: Entry[]; documents: Entry[];
};
type Section = 'Schedule' | 'Availability' | 'Clock' | 'Tasks' | 'Checklists' | 'Documents' | 'Onboarding';
const sections: Section[] = ['Schedule', 'Availability', 'Clock', 'Tasks', 'Checklists', 'Documents', 'Onboarding'];
const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const apiUrl = `${new URL(import.meta.url).origin}/api/staff`;

function element(tag: string, className?: string, value?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value) node.textContent = value;
  return node;
}

function line(label: string, value: unknown) {
  const node = element('div', styles.line);
  node.append(element('strong', undefined, label), document.createTextNode(String(value ?? '—')));
  return node;
}

class McHrStaff extends HTMLElement {
  private data: StaffData | null = null;
  private section: Section = 'Schedule';
  private notice = '';
  private connected = false;

  static get observedAttributes() { return ['display-name']; }
  connectedCallback() { this.connected = true; void this.load(); }
  disconnectedCallback() { this.connected = false; }
  attributeChangedCallback() { if (this.isConnected) this.render(); }

  private async load() {
    this.replaceChildren(element('div', styles.root, 'Loading staff portal…'));
    try {
      if (await wixWindow.viewMode() === 'Editor') {
        this.replaceChildren(element('div', styles.root, 'Staff records appear on the published members-only page.'));
        return;
      }
      const response = await httpClient.fetchWithAuth(apiUrl);
      if (!response.ok) throw new Error(response.status === 403 ? 'Sign in with an assigned staff account.' : 'Unable to load staff records.');
      this.data = await response.json() as StaffData;
      if (this.connected) this.render();
    } catch (error) {
      this.replaceChildren(element('div', styles.root, error instanceof Error ? error.message : 'Unable to load staff records.'));
    }
  }

  private async action(body: Entry) {
    this.notice = '';
    try {
      const response = await httpClient.fetchWithAuth(apiUrl, { method: 'POST', body: JSON.stringify(body) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Update failed');
      await this.load();
      this.notice = 'Saved';
      this.render();
    } catch (error) {
      this.notice = error instanceof Error ? error.message : 'Update failed';
      this.render();
    }
  }

  private async upload(file: File, kind: string) {
    if (file.size === 0 || file.size > 10 * 1024 * 1024 ||
      !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type))
      throw new Error('Use a PDF, JPEG or PNG smaller than 10 MB.');
    const ticket = await httpClient.fetchWithAuth(apiUrl, { method: 'POST',
      body: JSON.stringify({ action: 'request-upload', kind, fileName: file.name, mimeType: file.type }) });
    if (!ticket.ok) throw new Error('Could not prepare private upload.');
    const { uploadUrl } = await ticket.json() as { uploadUrl: string };
    const response = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    if (!response.ok) throw new Error('File upload failed.');
    const result = await response.json() as { file?: { id?: string; private?: boolean } };
    if (!result.file?.id || result.file.private !== true) throw new Error('Private upload was not confirmed.');
    return { id: result.file.id, fileName: file.name, fileSize: file.size,
      fileType: file.type, uploadedAt: new Date().toISOString() };
  }

  private render() {
    if (!this.data) return;
    const root = element('section', styles.root);
    const heading = element('header', styles.header);
    heading.append(element('h2', undefined, this.getAttribute('display-name') || 'Malaya Corner Staff'),
      element('p', undefined, `${this.data.profile.firstName} ${this.data.profile.lastName} · ${this.data.profile.position}`));
    root.append(heading);
    const nav = element('nav', styles.nav);
    nav.setAttribute('aria-label', 'Staff portal sections');
    for (const section of sections) {
      const button = element('button', section === this.section ? styles.active : '', section) as HTMLButtonElement;
      button.type = 'button';
      button.onclick = () => { this.section = section; this.render(); };
      nav.append(button);
    }
    root.append(nav);
    if (this.notice) root.append(element('p', styles.notice, this.notice));
    const content = element('div', styles.content);
    if (this.section === 'Schedule') this.cards(content, this.data.shifts,
      (row) => [String(row.dateStr), `${row.shiftType} · ${row.startTime}${row.endTime ? `–${row.endTime}` : ''}`, String(row.notes ?? '')]);
    if (this.section === 'Tasks') this.cards(content, this.data.tasks,
      (row) => [String(row.title), `${row.dueDate ?? ''} · ${row.priority ?? ''}`, String(row.description ?? '')],
      (row) => !row.isCompleted ? this.button('Mark complete', () => void this.action({ action: 'complete-task', taskId: row._id })) : null);
    if (this.section === 'Checklists') this.renderChecklists(content);
    if (this.section === 'Documents') this.cards(content, this.data.documents,
      (row) => [String(row.title), String(row.category), String(row.description ?? '')],
      (row) => this.button('Download', () => void this.download(String(row._id))));
    if (this.section === 'Onboarding') this.renderOnboarding(content);
    if (this.section === 'Clock') this.renderClock(content);
    if (this.section === 'Availability') this.renderAvailability(content);
    root.append(content);
    this.replaceChildren(root);
  }

  private cards(target: HTMLElement, rows: Entry[], describe: (row: Entry) => string[], action?: (row: Entry) => HTMLElement | null) {
    if (!rows.length) { target.append(element('p', undefined, 'No records yet.')); return; }
    for (const row of rows) {
      const card = element('article', styles.card);
      const [title, detail, notes] = describe(row);
      card.append(element('h3', undefined, title), element('p', undefined, detail));
      if (notes) card.append(element('p', undefined, notes));
      const control = action?.(row);
      if (control) card.append(control);
      target.append(card);
    }
  }

  private button(label: string, click: () => void) {
    const button = element('button', styles.action, label) as HTMLButtonElement;
    button.type = 'button';
    button.onclick = click;
    return button;
  }

  private async download(documentId: string) {
    try {
      const response = await httpClient.fetchWithAuth(apiUrl, { method: 'POST',
        body: JSON.stringify({ action: 'document-download', documentId }) });
      if (!response.ok) throw new Error('Document is unavailable.');
      const { downloadUrl } = await response.json() as { downloadUrl?: string };
      if (!downloadUrl) throw new Error('Document is unavailable.');
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.rel = 'noopener noreferrer';
      anchor.click();
    } catch (error) {
      this.notice = error instanceof Error ? error.message : 'Document download failed';
      this.render();
    }
  }

  private renderClock(target: HTMLElement) {
    const active = this.data?.clocks.find((row) => row.status === 'clocked_in' || row.status === 'on_break');
    if (active) {
      target.append(line('Clocked in: ', active.clockInAt));
      target.append(this.button(active.status === 'on_break' ? 'End break' : 'Start break',
        () => void this.action({ action: active.status === 'on_break' ? 'break-end' : 'break-start' })));
      target.append(this.button('Clock out', () => void this.action({ action: 'clock-out' })));
    } else {
      target.append(element('p', undefined, 'Select a shift to clock in.'));
      for (const shiftType of ['lunch', 'dinner'])
        target.append(this.button(`Clock in · ${shiftType}`, () => void this.action({ action: 'clock-in', shiftType })));
    }
    this.cards(target, this.data?.clocks ?? [], (row) =>
      [String(row.date), `${row.shiftType} · ${row.status}`, `${row.totalHours ?? 0} hours`]);
  }

  private renderChecklists(target: HTMLElement) {
    this.cards(target, this.data?.checklists ?? [],
      (row) => [String(row.title), String(row.category), row.isCompleted ? 'Complete today' : String(row.instructions ?? '')],
      (row) => {
        if (row.isCompleted) return null;
        const wrapper = element('div');
        const photo = element('input') as HTMLInputElement;
        if (row.requiresPhoto) {
          photo.type = 'file';
          photo.accept = 'image/jpeg,image/png';
          photo.setAttribute('aria-label', 'Checklist photo evidence');
          wrapper.append(photo);
        }
        const temperature = element('input') as HTMLInputElement;
        if (row.requiresTemp) {
          temperature.type = 'number';
          temperature.step = '0.1';
          temperature.placeholder = 'Temperature °C';
          temperature.setAttribute('aria-label', 'Temperature reading in degrees Celsius');
          wrapper.append(temperature);
        }
        wrapper.append(this.button('Complete', () => {
          void (async () => {
            try {
              const photos = row.requiresPhoto && photo.files?.[0]
                ? [await this.upload(photo.files[0], 'checklist-photo')] : [];
              await this.action({
                action: 'complete-checklist', checklistId: row._id, photos,
                ...(row.requiresTemp ? { tempReading: temperature.value } : {}),
              });
            } catch (error) {
              this.notice = error instanceof Error ? error.message : 'Upload failed';
              this.render();
            }
          })();
        }));
        return wrapper;
      });
  }

  private renderOnboarding(target: HTMLElement) {
    target.append(line('Status: ', this.data?.profile.onboardingStatus));
    const fields = [
      ['q1Email', 'Email'], ['q2FirstNameMiddle', 'First and middle name'],
      ['q3LastName', 'Last name'], ['q4Dob', 'Date of birth'],
      ['q5Mobile', 'Mobile'], ['q6EmailAddress', 'Contact email'],
      ['q7SuperProvider', 'Superannuation provider'], ['q8SuperMemberNumber', 'Super member number'],
      ['q9BankName', 'Bank name'], ['q10BankBsb', 'BSB'], ['q11BankAccountNumber', 'Bank account number'],
    ] as const;
    const docs = [
      ['q12VevoDoc', 'vevo', 'VEVO document'], ['q13FoodHandlerDoc', 'food-handler', 'Food handler document'],
      ['q14TfnDoc', 'tfn', 'TFN document'], ['q15FoodHygieneCert', 'food-hygiene', 'Food hygiene certificate'],
    ] as const;
    const form = element('form', styles.card) as HTMLFormElement;
    const inputs = new Map<string, HTMLInputElement>();
    for (const [key, label] of fields) {
      const input = element('input') as HTMLInputElement;
      input.type = key === 'q4Dob' ? 'date' : key.toLowerCase().includes('email') ? 'email' : 'text';
      input.required = true;
      input.maxLength = 300;
      input.autocomplete = 'off';
      const wrapper = element('label', styles.field);
      wrapper.append(element('span', undefined, label), input);
      form.append(wrapper);
      inputs.set(key, input);
    }
    const uploads = new Map<string, HTMLInputElement>();
    for (const [key, , label] of docs) {
      const input = element('input') as HTMLInputElement;
      input.type = 'file';
      input.accept = 'application/pdf,image/jpeg,image/png';
      const wrapper = element('label', styles.field);
      wrapper.append(element('span', undefined, label), input);
      form.append(wrapper);
      uploads.set(key, input);
    }
    const submit = this.button('Submit for manager review', () => {});
    submit.type = 'submit';
    submit.onclick = null;
    form.append(submit);
    form.onsubmit = (event) => {
      event.preventDefault();
      submit.disabled = true;
      void (async () => {
        try {
          const payload: Entry = { action: 'onboarding-submit' };
          for (const [key, input] of inputs) payload[key] = input.value;
          for (const [key, kind] of docs) {
            const file = uploads.get(key)?.files?.[0];
            if (file) payload[key] = await this.upload(file, kind);
          }
          await this.action(payload);
        } catch (error) {
          this.notice = error instanceof Error ? error.message : 'Submission failed';
          this.render();
        } finally {
          submit.disabled = false;
        }
      })();
    };
    target.append(form);
  }

  private renderAvailability(target: HTMLElement) {
    const week = element('input') as HTMLInputElement;
    week.type = 'date';
    const today = new Date();
    today.setUTCDate(today.getUTCDate() - (today.getUTCDay() + 6) % 7);
    week.value = today.toISOString().slice(0, 10);
    const form = element('div', styles.availability);
    form.append(line('Week starting: ', ''), week);
    const controls = new Map<string, [HTMLInputElement, HTMLInputElement]>();
    for (const day of days) {
      const row = element('div', styles.day);
      row.append(element('strong', undefined, day));
      const lunch = element('input') as HTMLInputElement;
      const dinner = element('input') as HTMLInputElement;
      lunch.type = dinner.type = 'checkbox';
      for (const [label, input] of [['Lunch', lunch], ['Dinner', dinner]] as const) {
        const wrapper = element('label');
        wrapper.append(input, document.createTextNode(` ${label}`));
        row.append(wrapper);
      }
      controls.set(day, [lunch, dinner]);
      form.append(row);
    }
    form.append(this.button('Submit availability', () => {
      const availabilities = Object.fromEntries([...controls].map(([day, [lunch, dinner]]) =>
        [day, { lunch: lunch.checked, dinner: dinner.checked }]));
      void this.action({ action: 'availability', weekStartDate: week.value, availabilities });
    }));
    target.append(form);
    this.cards(target, this.data?.availability ?? [], (row) => [String(row.weekStartDate), 'Submitted availability', '']);
  }
}

export default McHrStaff;
