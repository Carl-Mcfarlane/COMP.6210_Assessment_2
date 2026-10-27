# SCP Catalogue

My Assessment 2 project for Web Services / Design Methodologies. It's a catalogue of SCP Foundation entries where anyone can browse and search, and if you make an account you can add your own entries and edit or delete them.

React frontend, Express API, and Supabase for the database, auth and image storage.

## Running it

You'll need Node and a Supabase project.

**Database:** run the files in `backend/database/` in the Supabase SQL editor, in this order: `schema.sql`, `auth_schema.sql`, `ownership_schema.sql`, `rls_schema.sql`. Heads up, `schema.sql` drops the tables first so don't run it on data you care about.

**Backend:**

```bash
cd backend
cp .env.example .env    
npm install
npm run dev             # runs on :5000
```

**Frontend:**

```bash
cd frontend
cp .env.example .env    # API url + Supabase URL + anon key
npm install
npm run dev             # runs on :5173
```

The service-role key only goes in the backend `.env`. The frontend only gets the anon key.

## How it's laid out

- `frontend/` - the React app (pages, components, auth context)
- `backend/` - the Express API, with `middleware/` for auth and validation, `database/` for the SQL, and `tests/`
- `SCP_IMGS/` - the images I used for entries

## API

- `GET /api/subjects` - list entries
- `GET /api/subjects/:id` - one entry
- `POST /api/subjects` - create one (must be signed in)
- `PUT /api/subjects/:id` - edit (owner or admin)
- `POST /api/subjects/:id/image` - upload an image (owner or admin)
- `DELETE /api/subjects/:id` - delete (owner or admin)

Reading is open to everyone, anything that changes data needs a login. The API also has rate limiting and validates request bodies, and the tables have row-level security on top of that.

## Tests

```bash
cd backend && npm test
cd frontend && npm test
```

Backend tests cover the API routes, permissions and validation, using a fake Supabase client so they don't touch the real database.
