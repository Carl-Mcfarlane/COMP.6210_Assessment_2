import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useScpEntries } from '../data/useScpEntries.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import DetailHeader from '../components/DetailHeader.jsx'
import Skeleton from '../components/Skeleton.jsx'
import './SCPForm.css'

// fixed vocabulary, matches the object_classes lookup table
const OBJECT_CLASSES = ['Safe', 'Euclid', 'Keter']

function FormStatus({ children }) {
  return (
    <section className="scp-form-page">
      <DetailHeader />
      <p className="scp-form__status scp-form__status--centered">{children}</p>
    </section>
  )
}

// loading placeholder shaped like the real form: a label and input per field
function FormSkeleton() {
  const fields = [
    { label: 96, height: 44 },
    { label: 88, height: 44 },
    { label: 100, height: 130 },
    { label: 160, height: 130 },
    { label: 56, height: 44 },
  ]

  return (
    <section className="scp-form-page">
      <DetailHeader />
      <div className="scp-form" role="status" aria-label="Loading entry">
        <Skeleton style={{ width: '90px', height: '12px', marginBottom: 12 }} />
        <Skeleton style={{ width: '180px', height: '32px', marginBottom: 24 }} />

        {fields.map((field, index) => (
          <div key={index} style={{ marginBottom: 18 }}>
            <Skeleton style={{ width: field.label, height: '12px', marginBottom: 8 }} />
            <Skeleton style={{ width: '100%', height: field.height, borderRadius: 8 }} />
          </div>
        ))}

        <div className="scp-form__actions">
          <Skeleton style={{ width: '70px', height: '44px', borderRadius: 8 }} />
          <Skeleton style={{ width: '130px', height: '44px', borderRadius: 8 }} />
        </div>
      </div>
    </section>
  )
}

// shared by both /scp/new and /scp/:id/edit - editing vs creating only
// changes how the fields are pre-filled and which request gets sent. This
// outer component waits for the entry to load, then hands it to the form
// below so the fields can start with the right values
function SCPForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { entries, loading, createEntry, updateEntry, uploadImage } = useScpEntries()
  const entry = isEditing ? entries.find((item) => item.id === id) : undefined

  useDocumentTitle(
    isEditing ? `Edit ${id} · SCP Catalogue` : 'New Entry · SCP Catalogue',
  )

  if (isEditing && loading) return <FormSkeleton />

  if (isEditing && !entry) {
    return <FormStatus>We couldn't find an SCP entry for “{id}”.</FormStatus>
  }

  // the API enforces this too; this just avoids showing a form that will be rejected
  if (isEditing && !entry.canEdit) {
    return <FormStatus>You can only edit entries you created.</FormStatus>
  }

  return (
    <SCPFormFields
      entry={entry}
      createEntry={createEntry}
      updateEntry={updateEntry}
      uploadImage={uploadImage}
    />
  )
}

// the actual form; only mounted once `entry` is known (or when creating), so
// the initial field values come straight from it rather than an effect
function SCPFormFields({ entry, createEntry, updateEntry, uploadImage }) {
  const navigate = useNavigate()
  const isEditing = Boolean(entry)

  const [item, setItem] = useState(entry?.id ?? '')
  const [objectClass, setObjectClass] = useState(entry?.objectClass ?? OBJECT_CLASSES[0])
  const [description, setDescription] = useState(entry?.description?.join('\n\n') ?? '')
  const [containment, setContainment] = useState(entry?.containmentProcedures?.join('\n\n') ?? '')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(entry?.image ?? null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // swap in a local preview of the picked file; the effect below revokes the
  // previous blob URL so we don't leak object URLs as the user picks files
  function handleFileChange(event) {
    const file = event.target.files[0] ?? null
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : (entry?.image ?? null))
  }

  useEffect(() => () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

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
