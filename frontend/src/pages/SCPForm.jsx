import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useScpEntries } from '../data/useScpEntries.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import DetailHeader from '../components/DetailHeader.jsx'
import './SCPForm.css'

// fixed vocabulary, matches the object_classes lookup table
const OBJECT_CLASSES = ['Safe', 'Euclid', 'Keter']

// shared by both /scp/new and /scp/:id/edit - editing vs creating only
// changes how the fields are pre-filled and which request gets sent
function SCPForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const { entries, loading, createEntry, updateEntry, uploadImage } = useScpEntries()
  const entry = isEditing ? entries.find((item) => item.id === id) : undefined

  const [item, setItem] = useState('')
  const [objectClass, setObjectClass] = useState(OBJECT_CLASSES[0])
  const [description, setDescription] = useState('')
  const [containment, setContainment] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [hydrated, setHydrated] = useState(!isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useDocumentTitle(
    isEditing ? `Edit ${id} · SCP Catalogue` : 'New Entry · SCP Catalogue',
  )

  // fill the form once the entry has loaded (only runs the first time it
  // becomes available, so it doesn't stomp on what the user is typing)
  useEffect(() => {
    if (!isEditing || hydrated || !entry) return
    setItem(entry.id)
    setObjectClass(entry.objectClass ?? OBJECT_CLASSES[0])
    setDescription(entry.description?.join('\n\n') ?? '')
    setContainment(entry.containmentProcedures?.join('\n\n') ?? '')
    setImagePreview(entry.image ?? null)
    setHydrated(true)
  }, [isEditing, entry, hydrated])

  // swap in a local preview of the picked file; revoke it on cleanup/change
  // so we don't leak object URLs as the user picks different files
  function handleFileChange(event) {
    const file = event.target.files[0] ?? null
    setImageFile(file)
    setImagePreview((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current)
      return file ? URL.createObjectURL(file) : (entry?.image ?? null)
    })
  }

  if (isEditing && loading) {
    return (
      <section className="scp-form-page">
        <DetailHeader />
        <p className="scp-form__status">Loading…</p>
      </section>
    )
  }

  if (isEditing && !entry) {
    return (
      <section className="scp-form-page">
        <DetailHeader />
        <p className="scp-form__status">
          We couldn't find an SCP entry for “{id}”.
        </p>
      </section>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = {
      item: item.trim(),
      class: objectClass,
      description: description.trim(),
      containment: containment.trim(),
    }

    try {
      let saved = isEditing
        ? await updateEntry(entry.dbId, payload)
        : await createEntry(payload)
      if (imageFile) {
        saved = await uploadImage(saved.dbId, imageFile)
      }
      navigate(`/scp/${saved.id}`)
    } catch (err) {
      setError(err)
      setSubmitting(false)
    }
  }

  return (
    <section className="scp-form-page">
      <DetailHeader />

      <form className="scp-form" onSubmit={handleSubmit}>
        <p className="scp-form__kicker">
          {isEditing ? 'Edit Entry' : 'New Entry'}
        </p>
        <h1 className="scp-form__title">
          {isEditing ? entry.id : 'New SCP Entry'}
        </h1>

        <label className="scp-form__field">
          <span>Item Number</span>
          <input
            type="text"
            value={item}
            onChange={(event) => setItem(event.target.value)}
            placeholder="SCP-XXX"
            required
          />
        </label>

        <label className="scp-form__field">
          <span>Object Class</span>
          <select
            value={objectClass}
            onChange={(event) => setObjectClass(event.target.value)}
          >
            {OBJECT_CLASSES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="scp-form__field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            required
          />
        </label>

        <label className="scp-form__field">
          <span>Containment Procedures</span>
          <textarea
            value={containment}
            onChange={(event) => setContainment(event.target.value)}
            rows={5}
          />
        </label>

        <label className="scp-form__field">
          <span>Image</span>
          {imagePreview && (
            <img
              className="scp-form__image-preview"
              src={imagePreview}
              alt=""
            />
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </label>

        {error && (
          <p className="scp-form__error">Failed to save: {error.message}</p>
        )}

        <div className="scp-form__actions">
          <Link
            to={isEditing ? `/scp/${entry.id}` : '/catalogue'}
            className="scp-form__cancel"
          >
            Cancel
          </Link>
          <button type="submit" className="scp-form__submit" disabled={submitting}>
            {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Entry'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default SCPForm
