// Minimal in-memory stand-in for the parts of the Supabase client the API
// uses (query builder, auth.getUser, storage), so route tests never touch the
// real database. Not a general Supabase mock - it only supports what server.js calls.

function createFakeSupabase() {
  const tables = {
    profiles: [],
    object_classes: [
      { id: 1, name: 'Safe', description: null },
      { id: 2, name: 'Euclid', description: null },
      { id: 3, name: 'Keter', description: null },
    ],
    subjects: [],
    containment_procedures: [],
    incident_logs: [],
    appendices: [],
  };
  const nextId = { subjects: 1, containment_procedures: 1 };
  const users = new Map(); // token -> { id, email }
  const uploads = [];

  // attach the related rows the real select string would join in
  function withRelations(row) {
    return {
      ...row,
      object_classes: tables.object_classes.find((c) => c.id === row.object_class_id) ?? null,
      containment_procedures: tables.containment_procedures.filter((c) => c.subject_id === row.id),
      incident_logs: [],
      appendices: [],
    };
  }

  function builder(table) {
    const state = { op: 'select', filters: [], payload: null, returning: false, single: null, orderBy: null, columns: '' };

    function matches(row) {
      return state.filters.every(([column, value]) => String(row[column]) === String(value));
    }

    function execute() {
      const rows = tables[table];
      let result;

      if (state.op === 'insert') {
        result = state.payload.map((item) => {
          if (table === 'subjects' && rows.some((row) => row.item === item.item)) {
            throw Object.assign(new Error('duplicate key'), { code: '23505' });
          }
          const row = { id: nextId[table]++, created_at: new Date().toISOString(), ...item };
          if (table === 'subjects') row.image ??= null;
          rows.push(row);
          return row;
        });
      } else if (state.op === 'update') {
        result = rows.filter(matches);
        result.forEach((row) => Object.assign(row, state.payload));
      } else if (state.op === 'delete') {
        result = rows.filter(matches);
        tables[table] = rows.filter((row) => !matches(row));
        if (table === 'subjects') {
          tables.containment_procedures = tables.containment_procedures.filter(
            (c) => !result.some((s) => s.id === c.subject_id),
          );
        }
      } else {
        result = rows.filter(matches);
      }

      if (state.orderBy) {
        result = [...result].sort((a, b) => String(a[state.orderBy]).localeCompare(String(b[state.orderBy])));
      }
      if (table === 'subjects' && state.columns.includes('object_classes(')) result = result.map(withRelations);
      else result = result.map((row) => ({ ...row }));

      if (state.single === 'single') {
        return result.length === 1
          ? { data: result[0], error: null }
          : { data: null, error: { code: 'PGRST116', message: 'no single row' } };
      }
      if (state.single === 'maybe') return { data: result[0] ?? null, error: null };
      if (state.op === 'select' || state.returning) return { data: result, error: null };
      return { data: null, error: null };
    }

    const api = {
      select(columns = '') {
        if (state.op !== 'select') state.returning = true;
        state.columns = columns;
        return api;
      },
      insert(payload) { state.op = 'insert'; state.payload = payload; return api; },
      update(payload) { state.op = 'update'; state.payload = payload; return api; },
      delete() { state.op = 'delete'; return api; },
      eq(column, value) { state.filters.push([column, value]); return api; },
      order(column) { state.orderBy = column; return api; },
      single() { state.single = 'single'; return api; },
      maybeSingle() { state.single = 'maybe'; return api; },
      // makes the builder awaitable, like the real Supabase query builder
      then(resolve, reject) {
        try {
          resolve(execute());
        } catch (error) {
          if (error.code) resolve({ data: null, error });
          else reject(error);
        }
      },
    };
    return api;
  }

  return {
    tables,
    uploads,
    // register a signed-in user and return the bearer token to send for them
    addUser({ id, email, role = 'user' }) {
      const token = `token-${id}`;
      users.set(token, { id, email });
      tables.profiles.push({ id, role });
      return token;
    },
    addSubject({ item, class: className = 'Safe', description = 'desc', created_by = null }) {
      const row = {
        id: nextId.subjects++,
        item,
        description,
        image: null,
        created_by,
        object_class_id: tables.object_classes.find((c) => c.name === className).id,
        created_at: new Date().toISOString(),
      };
      tables.subjects.push(row);
      return row;
    },
    from: builder,
    auth: {
      async getUser(token) {
        const user = users.get(token);
        return user
          ? { data: { user }, error: null }
          : { data: { user: null }, error: { message: 'bad token' } };
      },
    },
    storage: {
      from: () => ({
        getPublicUrl: (name) => ({ data: { publicUrl: `https://storage.test/${name}` } }),
        async upload(name, buffer, options) {
          uploads.push({ name, size: buffer.length, ...options });
          return { error: null };
        },
      }),
    },
  };
}

module.exports = { createFakeSupabase };
