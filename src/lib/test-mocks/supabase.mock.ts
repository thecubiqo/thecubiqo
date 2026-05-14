/**
 * Supabase Mock — F7-E
 * In-memory mock Supabase client for unit tests.
 * Activated when TEST_MODE=true env var is set.
 * Supports .from().select/insert/update/upsert/delete/eq/gte/lte/order/limit/maybeSingle patterns.
 */

type MockRow = Record<string, unknown>;
type MockStore = Record<string, MockRow[]>;

export class MockSupabaseClient {
  private store: MockStore = {};
  private _table = '';
  private _filters: Array<{ key: string; value: unknown }> = [];
  private _selectCols = '*';
  private _orderCol: string | null = null;
  private _orderAsc = true;
  private _limitN: number | null = null;

  /** Seed a table with initial rows for test setup */
  seed(table: string, rows: MockRow[]) {
    this.store[table] = [...rows];
    return this;
  }

  /** Reset all data */
  reset() {
    this.store = {};
    this._table = '';
    this._filters = [];
    return this;
  }

  from(table: string) {
    this._table = table;
    this._filters = [];
    this._selectCols = '*';
    this._orderCol = null;
    this._limitN = null;
    return this;
  }

  select(cols: string, opts?: { count?: string; head?: boolean }) {
    this._selectCols = cols;
    return this;
  }

  eq(key: string, value: unknown) {
    this._filters.push({ key, value });
    return this;
  }

  gte(key: string, value: unknown) { return this; }   // passthrough for date filters
  lte(key: string, value: unknown) { return this; }
  neq(key: string, value: unknown) { return this; }

  order(col: string, opts?: { ascending?: boolean }) {
    this._orderCol = col;
    this._orderAsc = opts?.ascending ?? true;
    return this;
  }

  limit(n: number) {
    this._limitN = n;
    return this;
  }

  private _applyFilters(rows: MockRow[]): MockRow[] {
    return rows.filter(row =>
      this._filters.every(f => row[f.key] === f.value)
    );
  }

  async maybeSingle(): Promise<{ data: MockRow | null; error: null }> {
    const rows = this._applyFilters(this.store[this._table] || []);
    return { data: rows[0] ?? null, error: null };
  }

  async single(): Promise<{ data: MockRow | null; error: null }> {
    return this.maybeSingle();
  }

  // Resolves the query — call at end of chain for non-single results
  then(resolve: (result: { data: MockRow[]; error: null; count?: number }) => void) {
    const rows = this._applyFilters(this.store[this._table] || []);
    const sliced = this._limitN ? rows.slice(0, this._limitN) : rows;
    resolve({ data: sliced, error: null, count: sliced.length });
  }

  async insert(rows: MockRow | MockRow[]): Promise<{ data: MockRow[]; error: null }> {
    const arr = Array.isArray(rows) ? rows : [rows];
    if (!this.store[this._table]) this.store[this._table] = [];
    const inserted = arr.map(r => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...r }));
    this.store[this._table].push(...inserted);
    return { data: inserted, error: null };
  }

  async update(patch: Partial<MockRow>): Promise<{ data: MockRow[]; error: null }> {
    const rows = this.store[this._table] || [];
    const updated: MockRow[] = [];
    this.store[this._table] = rows.map(row => {
      const match = this._filters.every(f => row[f.key] === f.value);
      if (match) {
        const u = { ...row, ...patch, updated_at: new Date().toISOString() };
        updated.push(u);
        return u;
      }
      return row;
    });
    return { data: updated, error: null };
  }

  async upsert(rows: MockRow | MockRow[], opts?: { onConflict?: string }): Promise<{ data: MockRow[]; error: null }> {
    return this.insert(rows);
  }

  async delete(): Promise<{ data: MockRow[]; error: null }> {
    const rows = this.store[this._table] || [];
    const deleted = rows.filter(row => this._filters.every(f => row[f.key] === f.value));
    this.store[this._table] = rows.filter(row => !this._filters.every(f => row[f.key] === f.value));
    return { data: deleted, error: null };
  }
}

/** Singleton mock client for tests */
let _mockClient: MockSupabaseClient | null = null;

export function getMockSupabaseClient(): MockSupabaseClient {
  if (!_mockClient) _mockClient = new MockSupabaseClient();
  return _mockClient;
}

/**
 * Returns mock or real supabase client based on TEST_MODE env.
 * Import this instead of getSupabaseAdmin() in testable code paths.
 */
export async function getTestableSupabase(realFactory?: () => any) {
  if (process.env.TEST_MODE === 'true') {
    return getMockSupabaseClient();
  }
  if (realFactory) return realFactory();
  const { getSupabaseAdmin } = await import('../../app/api/_lib/supabase-admin');
  return getSupabaseAdmin();
}
