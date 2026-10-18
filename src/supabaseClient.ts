import { createClient, SupabaseClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(
  envUrl &&
  envKey &&
  envUrl.startsWith('http') &&
  !envUrl.includes('your_supabase_project_url') &&
  !envKey.includes('your_supabase_publishable')
);

export const isLiveSupabase = isConfigured;

// Realistic initial seed data for immediate demonstration and offline resilience
const SEED_PROFILES = [
  {
    id: 'usr-student-alex',
    full_name: 'Alex Rivera',
    college_email: 'alex.rivera@campus.edu',
    roll_number: '2024CS104',
    phone_number: '+1 (555) 234-5678',
    role: 'student',
    department: 'Computer Science & Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'usr-admin-marcus',
    full_name: 'Officer Marcus Vance',
    college_email: 'marcus.security@campus.edu',
    roll_number: 'STAFF-SEC-09',
    phone_number: '+1 (555) 890-1234',
    role: 'admin',
    department: 'Campus Safety & Property Control',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
];

const SEED_FOUND_ITEMS = [
  {
    id: 'fi-101',
    title: 'Apple MacBook Air 13" (Midnight Blue)',
    category: 'Electronics',
    description: 'Found left on 2nd floor library study desk near window. Has a green GitHub Octocat sticker on the lid.',
    found_location: 'Central Library - 2nd Floor Quiet Stacks',
    found_date: '2026-10-15',
    found_time: '14:30',
    storage_location: 'Central Security Desk - Bin A2 (High Value/Electronics)',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    reported_by: 'usr-student-alex',
    status: 'unclaimed',
    is_verified: true,
    verified_by: 'usr-admin-marcus',
    tags: ['laptop', 'macbook', 'apple', 'stickers'],
    secret_identifying_details: 'Serial ends in 9941. Custom lock screen wallpaper is Yosemite Valley at sunset.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'fi-102',
    title: 'Brass Dorm Room Key Set with Blue University Lanyard',
    category: 'Keys',
    description: 'Set of two Yale brass keys with blue Campus Recreation fob attached. Picked up on grass lawn outside North Hall.',
    found_location: 'North Quad - Residence Hall Lobby',
    found_date: '2026-10-16',
    found_time: '09:15',
    storage_location: 'Central Security Desk - Lockbox C (Keys & Wallets)',
    image_url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
    reported_by: 'usr-admin-marcus',
    status: 'in_review',
    is_verified: true,
    verified_by: 'usr-admin-marcus',
    tags: ['keys', 'lanyard', 'dorm', 'residence'],
    secret_identifying_details: 'Room number 314 etched on the reverse key tag.',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 'fi-103',
    title: 'Sony WH-1000XM4 Wireless Headphones (Black)',
    category: 'Electronics',
    description: 'Over-ear noise cancelling headphones in black zippered case left on dining booth bench.',
    found_location: 'Student Union - Main Food Court',
    found_date: '2026-10-14',
    found_time: '19:45',
    storage_location: 'Central Security Desk - Bin A2 (High Value/Electronics)',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    reported_by: 'usr-student-alex',
    status: 'claimed',
    is_verified: true,
    verified_by: 'usr-admin-marcus',
    tags: ['headphones', 'sony', 'audio'],
    secret_identifying_details: 'Includes braided 3.5mm cable and airline adapter in inside mesh pouch.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'fi-104',
    title: 'Brown Leather Bifold Wallet with Student ID',
    category: 'Wallets & IDs',
    description: 'Leather wallet found by cleaning staff under lecture desk. Contains student ID card.',
    found_location: 'Science Complex - Lecture Hall 101',
    found_date: '2026-10-12',
    found_time: '17:00',
    storage_location: 'Central Security Desk - Lockbox C (Keys & Wallets)',
    image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    reported_by: 'usr-admin-marcus',
    status: 'returned',
    is_verified: true,
    verified_by: 'usr-admin-marcus',
    tags: ['wallet', 'id card', 'leather'],
    secret_identifying_details: 'Contains Metro transit pass ending in 410.',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'fi-105',
    title: 'Hydro Flask 32 oz Wide Mouth (Pacific Blue)',
    category: 'Water Bottles & Mugs',
    description: 'Light blue insulated bottle with boot protector and national parks stickers.',
    found_location: 'Campus Recreation Center - Gym Floor',
    found_date: '2026-10-16',
    found_time: '11:00',
    storage_location: 'Campus Recreation Desk - Shelf B',
    image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    reported_by: 'usr-student-alex',
    status: 'unclaimed',
    is_verified: true,
    verified_by: 'usr-admin-marcus',
    tags: ['water bottle', 'hydro flask', 'gym'],
    secret_identifying_details: 'Small dent on bottom rim; Zion National Park sticker.',
    created_at: new Date(Date.now() - 18 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 3600000).toISOString(),
  },
  {
    id: 'fi-106',
    title: 'North Face Recon Backpack (Heather Grey)',
    category: 'Bags & Backpacks',
    description: 'Backpack containing spiral notebooks and engineering graph paper found on bench in hallway.',
    found_location: 'Engineering Wing - Computer Lab 3',
    found_date: '2026-10-17',
    found_time: '08:20',
    storage_location: 'Library Lost & Found Cabinet - Shelf 2',
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    reported_by: 'usr-student-alex',
    status: 'unclaimed',
    is_verified: false,
    verified_by: null,
    tags: ['backpack', 'north face', 'engineering'],
    secret_identifying_details: 'Contains TI-84 Plus CE Silver Edition calculator inside front pencil pouch.',
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
];

const SEED_LOST_REPORTS = [
  {
    id: 'lr-201',
    user_id: 'usr-student-alex',
    title: 'Midnight Blue MacBook Air 13-inch',
    category: 'Electronics',
    description: 'Lost my MacBook while working on an Operating Systems project in the Library 2nd floor stacks. Has green GitHub sticker.',
    last_seen_location: 'Central Library - 2nd Floor Quiet Stacks',
    date_lost: '2026-10-15',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    unique_identifiers: 'Model A2681, has custom Yosemite mountain lock screen, serial starts with C02',
    status: 'open',
    matched_item_id: 'fi-101',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'lr-202',
    user_id: 'usr-student-alex',
    title: 'Graphite iPad Pro 11" with Apple Pencil 2',
    category: 'Electronics',
    description: 'Left inside black magnetic folio case near Lecture Hall 101 front rows.',
    last_seen_location: 'Science Complex - Lecture Hall 101',
    date_lost: '2026-10-16',
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
    unique_identifiers: 'Pencil has laser engraved initials "A.R."',
    status: 'open',
    matched_item_id: null,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const SEED_CLAIMS = [
  {
    id: 'cl-301',
    item_id: 'fi-102',
    claimant_id: 'usr-student-alex',
    proof_description: 'These are my dorm keys for North Hall. The fob says Campus Rec and the room key has #314 stamped on the back.',
    proof_image_url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=400&q=80',
    contact_phone: '+1 (555) 234-5678',
    status: 'pending',
    admin_notes: 'Under review. Checking student housing database for room 314 assignment.',
    reviewed_by: null,
    reviewed_at: null,
    pickup_scheduled_at: null,
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 'cl-302',
    item_id: 'fi-103',
    claimant_id: 'usr-student-alex',
    proof_description: 'I have the original Sony companion app on my phone connected to device MAC address ending in 2A:F9, plus purchase receipt from Best Buy.',
    proof_image_url: null,
    contact_phone: '+1 (555) 234-5678',
    status: 'approved',
    admin_notes: 'Receipt verified. Bluetooth pair confirmed. Ready for pickup at Central Security Desk.',
    reviewed_by: 'usr-admin-marcus',
    reviewed_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    pickup_scheduled_at: new Date(Date.now() + 24 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

const SEED_STATUS_HISTORY = [
  {
    id: 'sh-401',
    item_id: 'fi-101',
    changed_by: 'usr-student-alex',
    changer_name: 'Alex Rivera',
    changer_role: 'student',
    old_status: null,
    new_status: 'unclaimed',
    reason: 'Initial item reported found at Central Library 2nd Floor.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'sh-402',
    item_id: 'fi-101',
    changed_by: 'usr-admin-marcus',
    changer_name: 'Officer Marcus Vance',
    changer_role: 'admin',
    old_status: 'unclaimed',
    new_status: 'unclaimed',
    reason: 'Physical item logged, tagged #CAMPUS-9941, secured in Bin A2.',
    created_at: new Date(Date.now() - 2 * 86400000 + 3600000).toISOString(),
  },
  {
    id: 'sh-403',
    item_id: 'fi-102',
    changed_by: 'usr-admin-marcus',
    changer_name: 'Officer Marcus Vance',
    changer_role: 'admin',
    old_status: 'unclaimed',
    new_status: 'in_review',
    reason: 'Claim request #cl-301 received from student Alex Rivera. Verifying housing roster.',
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 'sh-404',
    item_id: 'fi-103',
    changed_by: 'usr-admin-marcus',
    changer_name: 'Officer Marcus Vance',
    changer_role: 'admin',
    old_status: 'in_review',
    new_status: 'claimed',
    reason: 'Ownership verified via Best Buy electronic invoice and serial number match.',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'sh-405',
    item_id: 'fi-104',
    changed_by: 'usr-admin-marcus',
    changer_name: 'Officer Marcus Vance',
    changer_role: 'admin',
    old_status: 'claimed',
    new_status: 'returned',
    reason: 'Item signed out in person at Central Security Station with government ID.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

class SimulatedSupabaseDatabase {
  private profiles = [...SEED_PROFILES];
  private foundItems = [...SEED_FOUND_ITEMS];
  private lostReports = [...SEED_LOST_REPORTS];
  private claims = [...SEED_CLAIMS];
  private statusHistory = [...SEED_STATUS_HISTORY];
  private subscribers: Array<(event: string, payload: any) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('campusfind_mock_db_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.foundItems) this.foundItems = parsed.foundItems;
        if (parsed.lostReports) this.lostReports = parsed.lostReports;
        if (parsed.claims) this.claims = parsed.claims;
        if (parsed.statusHistory) this.statusHistory = parsed.statusHistory;
        if (parsed.profiles) this.profiles = parsed.profiles;
      }
    } catch {
      // Fallback to in-memory seeds
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(
        'campusfind_mock_db_v2',
        JSON.stringify({
          profiles: this.profiles,
          foundItems: this.foundItems,
          lostReports: this.lostReports,
          claims: this.claims,
          statusHistory: this.statusHistory,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }

  public subscribe(cb: (event: string, payload: any) => void) {
    this.subscribers.push(cb);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  private notify(event: string, payload: any) {
    this.saveToStorage();
    this.subscribers.forEach((s) => s(event, payload));
  }

  public getTable(table: string): any[] {
    switch (table) {
      case 'profiles':
        return this.profiles;
      case 'found_items':
        return this.foundItems;
      case 'lost_reports':
        return this.lostReports;
      case 'claims':
        return this.claims;
      case 'item_status_history':
        return this.statusHistory;
      default:
        return [];
    }
  }

  public insert(table: string, data: any) {
    const item = {
      id: data.id || `gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
    };
    const target = this.getTable(table);
    target.unshift(item);
    this.notify(`${table}:insert`, item);
    return item;
  }

  public update(table: string, id: string, patch: any) {
    const target = this.getTable(table);
    const idx = target.findIndex((item) => item.id === id);
    if (idx !== -1) {
      target[idx] = {
        ...target[idx],
        ...patch,
        updated_at: new Date().toISOString(),
      };
      this.notify(`${table}:update`, target[idx]);
      return target[idx];
    }
    return null;
  }

  public delete(table: string, id: string) {
    let target = this.getTable(table);
    const idx = target.findIndex((item) => item.id === id);
    if (idx !== -1) {
      const removed = target.splice(idx, 1)[0];
      this.notify(`${table}:delete`, removed);
      return removed;
    }
    return null;
  }

  public resetToDefaults() {
    this.profiles = [...SEED_PROFILES];
    this.foundItems = [...SEED_FOUND_ITEMS];
    this.lostReports = [...SEED_LOST_REPORTS];
    this.claims = [...SEED_CLAIMS];
    this.statusHistory = [...SEED_STATUS_HISTORY];
    this.saveToStorage();
    this.notify('system:reset', {});
  }
}

export const mockDb = new SimulatedSupabaseDatabase();

// Query Builder Mock for Seamless Supabase API compatibility
class MockQueryBuilder {
  private table: string;
  private filters: Array<(item: any) => boolean> = [];
  private sortField: string | null = null;
  private sortAsc = true;
  private limitCount: number | null = null;
  private isSingle = false;
  private pendingUpdate: any = null;
  private isDelete = false;

  constructor(table: string) {
    this.table = table;
  }

  select(_columns = '*') {
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((item) => item[column] !== value);
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((item) => values.includes(item[column]));
    return this;
  }

  ilike(column: string, pattern: string) {
    const cleanPattern = pattern.replace(/%/g, '').toLowerCase();
    this.filters.push((item) => {
      const val = item[column];
      return typeof val === 'string' && val.toLowerCase().includes(cleanPattern);
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.sortField = column;
    this.sortAsc = options?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async insert(data: any | any[]) {
    const records = Array.isArray(data) ? data : [data];
    const inserted = records.map((r) => mockDb.insert(this.table, r));
    return { data: this.isSingle ? inserted[0] : inserted, error: null };
  }

  update(patch: any) {
    this.pendingUpdate = patch;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  then(resolve: any, reject?: any) {
    try {
      const all = mockDb.getTable(this.table);

      if (this.pendingUpdate !== null) {
        const matches = all.filter((item) => this.filters.every((f) => f(item)));
        matches.forEach((m) => mockDb.update(this.table, m.id, this.pendingUpdate));
        return resolve({ data: matches, error: null });
      }

      if (this.isDelete) {
        const matches = all.filter((item) => this.filters.every((f) => f(item)));
        matches.forEach((m) => mockDb.delete(this.table, m.id));
        return resolve({ data: matches, error: null });
      }

      let result = [...all];
      for (const f of this.filters) {
        result = result.filter(f);
      }
      if (this.sortField) {
        const field = this.sortField;
        const asc = this.sortAsc;
        result.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (valA < valB) return asc ? -1 : 1;
          if (valA > valB) return asc ? 1 : -1;
          return 0;
        });
      }
      if (this.limitCount !== null) {
        result = result.slice(0, this.limitCount);
      }

      if (this.isSingle) {
        return resolve({ data: result[0] || null, error: null });
      } else {
        return resolve({ data: result, error: null });
      }
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, error: err });
    }
  }
}

// Fallback Mock Supabase Client
function createSimulatedClient(): any {
  let currentUser: any = SEED_PROFILES[0]; // Alex Rivera by default
  const authListeners: Array<(event: string, session: any) => void> = [];

  const notifyAuth = (event: string) => {
    const session = currentUser ? { user: currentUser } : null;
    authListeners.forEach((cb) => cb(event, session));
  };

  return {
    from: (table: string) => new MockQueryBuilder(table),
    auth: {
      getSession: async () => ({
        data: { session: currentUser ? { user: currentUser } : null },
        error: null,
      }),
      getUser: async () => ({
        data: { user: currentUser },
        error: null,
      }),
      signInWithPassword: async ({ email }: { email: string }) => {
        const profiles = mockDb.getTable('profiles');
        const found = profiles.find((p) => p.college_email.toLowerCase() === email.toLowerCase());
        if (found) {
          currentUser = found;
          notifyAuth('SIGNED_IN');
          return { data: { user: found, session: { user: found } }, error: null };
        }
        // If not found in seeds, create temporary session
        const newUser = {
          id: `usr-${Date.now()}`,
          full_name: email.split('@')[0],
          college_email: email,
          roll_number: 'STUDENT-' + Math.floor(1000 + Math.random() * 9000),
          role: email.includes('admin') || email.includes('security') ? 'admin' : 'student',
          created_at: new Date().toISOString(),
        };
        mockDb.insert('profiles', newUser);
        currentUser = newUser;
        notifyAuth('SIGNED_IN');
        return { data: { user: newUser, session: { user: newUser } }, error: null };
      },
      signUp: async ({ email, options }: any) => {
        const profiles = mockDb.getTable('profiles');
        const existing = profiles.find((p) => p.college_email.toLowerCase() === email.toLowerCase());
        if (existing) {
          return { data: null, error: { message: 'A student account with this college email already exists.' } };
        }
        const newUser = {
          id: `usr-${Date.now()}`,
          full_name: options?.data?.full_name || email.split('@')[0],
          college_email: email,
          roll_number: options?.data?.roll_number || 'UNASSIGNED',
          phone_number: options?.data?.phone_number || '',
          role: options?.data?.role || 'student',
          created_at: new Date().toISOString(),
        };
        mockDb.insert('profiles', newUser);
        currentUser = newUser;
        notifyAuth('SIGNED_IN');
        return { data: { user: newUser, session: { user: newUser } }, error: null };
      },
      signOut: async () => {
        currentUser = null;
        notifyAuth('SIGNED_OUT');
        return { error: null };
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        authListeners.push(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const idx = authListeners.indexOf(callback);
                if (idx !== -1) authListeners.splice(idx, 1);
              },
            },
          },
        };
      },
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: File | Blob) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const url = reader.result as string;
              resolve({ data: { path, publicUrl: url }, error: null });
            };
            reader.readAsDataURL(file);
          });
        },
        getPublicUrl: (path: string) => ({
          data: { publicUrl: path.startsWith('data:') || path.startsWith('http') ? path : `https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80` },
        }),
      }),
    },
    channel: (name: string) => ({
      on: (_event: string, _filter: any, callback: any) => {
        const unsubscribe = mockDb.subscribe((type, payload) => {
          callback({ eventType: type, new: payload });
        });
        return {
          subscribe: () => ({ unsubscribe }),
        };
      },
      subscribe: () => ({ unsubscribe: () => {} }),
      unsubscribe: () => {},
    }),
    removeChannel: (_channel?: any) => {},
    removeAllChannels: () => {},
  };
}

// Export the active supabase client: Live Supabase if configured, otherwise high-fidelity simulated client
export const supabase: SupabaseClient | any = isLiveSupabase
  ? createClient(envUrl!, envKey!)
  : createSimulatedClient();
