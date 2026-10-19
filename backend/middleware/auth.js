const supabase = require('../supabaseClient');

// resolves a bearer token to { id, email, role }, or null if it's missing/invalid
async function resolveUser(req) {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { user: null, reason: 'Missing authorization token' };

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { user: null, reason: 'Invalid or expired session' };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profileError) return { user: null, reason: 'Failed to load user profile', status: 500 };

  return { user: { id: user.id, email: user.email, role: profile.role } };
}

// verifies the bearer token with Supabase Auth and attaches the caller's
// id/email/role to req.user; used on every route that writes data
async function authenticate(req, res, next) {
  const { user, reason, status } = await resolveUser(req);
  if (!user) return res.status(status ?? 401).json({ error: reason });
  req.user = user;
  next();
}

// for public routes: attaches req.user when a valid token is sent, otherwise
// carries on as an anonymous visitor (req.user = null) instead of rejecting
async function optionalAuthenticate(req, res, next) {
  const { user } = await resolveUser(req);
  req.user = user;
  next();
}

// admins can change anything; everyone else only the subjects they created
function canModify(user, subject) {
  if (!user) return false;
  return user.role === 'admin' || (subject.created_by != null && subject.created_by === user.id);
}

module.exports = { authenticate, optionalAuthenticate, canModify };
