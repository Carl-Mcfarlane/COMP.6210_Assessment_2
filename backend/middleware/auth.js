const supabase = require('../supabaseClient');

// verifies the bearer token with Supabase Auth and attaches the caller's
// id/email/role to req.user; every /api/subjects route requires this
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing authorization token' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid or expired session' });

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profileError) return res.status(500).json({ error: 'Failed to load user profile' });

  req.user = { id: user.id, email: user.email, role: profile.role };
  next();
}

// used after authenticate on routes that mutate data
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

module.exports = { authenticate, requireAdmin };
