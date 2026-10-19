const OBJECT_CLASSES = ['Safe', 'Euclid', 'Keter'];

// item doubles as the URL slug and the image filename, so keep it to safe characters
const ITEM_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,49}$/;
const MAX_TEXT_LENGTH = 20000;

// the DB ids are BIGINT identities, so anything else can't be a real subject
function validateIdParam(req, res, next) {
  if (!/^[1-9]\d{0,17}$/.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid subject id' });
  }
  next();
}

function checkText(value, field, { required }) {
  if (value === undefined || value === null || value === '') {
    return required ? `${field} is required` : null;
  }
  if (typeof value !== 'string') return `${field} must be a string`;
  if (required && value.trim() === '') return `${field} is required`;
  if (value.length > MAX_TEXT_LENGTH) return `${field} is too long`;
  return null;
}

// partial = true for PUT, where every field is optional but must be valid if present
function validateSubjectBody({ partial }) {
  return (req, res, next) => {
    const { item, class: scpClass, description, containment } = req.body ?? {};
    const errors = [];

    if (item !== undefined || !partial) {
      if (typeof item !== 'string' || !ITEM_PATTERN.test(item)) {
        errors.push('item must be 1-50 letters, numbers, spaces, dots, dashes or underscores');
      }
    }

    if (scpClass !== undefined || !partial) {
      if (!OBJECT_CLASSES.includes(scpClass)) {
        errors.push(`class must be one of: ${OBJECT_CLASSES.join(', ')}`);
      }
    }

    const descriptionError = partial && description === undefined
      ? null
      : checkText(description, 'description', { required: true });
    if (descriptionError) errors.push(descriptionError);

    const containmentError = checkText(containment, 'containment', { required: false });
    if (containmentError) errors.push(containmentError);

    if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') });
    next();
  };
}

module.exports = { validateIdParam, validateSubjectBody };
