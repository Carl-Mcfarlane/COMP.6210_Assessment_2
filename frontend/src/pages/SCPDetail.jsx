import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useScpEntries } from '../data/useScpEntries.js'
import { useAuth } from '../hooks/useAuth.js'
import { renderRedactedText } from '../utils/renderRedactedText.jsx'
import { getObjectClassKey } from '../utils/objectClassBadge.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import ObjectClassBadge from '../components/ObjectClassBadge.jsx'
import Skeleton from '../components/Skeleton.jsx'
import NotFoundMessage from '../components/NotFoundMessage.jsx'
import DetailHeader from '../components/DetailHeader.jsx'
import RedactedPlaceholder from '../components/RedactedPlaceholder.jsx'
import './SCPDetail.css'

// containment procedures / description / reference are all just arrays of
// paragraphs, so one component handles all three instead of repeating this
function TextSection({ title, paragraphs }) {
  if (!paragraphs?.length) return null
  return (
    <section className="scp-detail__section">
      <h2>{title}</h2>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{renderRedactedText(paragraph)}</p>
      ))}
    </section>
  )
}

// chronological incident/history entries - each has its own date, unlike the
// plain paragraph lists TextSection handles
function HistorySection({ title, entries }) {
  if (!entries?.length) return null
  return (
    <section className="scp-detail__section">
      <h2>{title}</h2>
      <ul className="scp-detail__history">
        {entries.map((entry, index) => (
          <li key={index}>
            {entry.date && (
              <span className="scp-detail__history-date">
                {renderRedactedText(entry.date)}
              </span>
            )}
            <p>{renderRedactedText(entry.text)}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

// loading placeholder shaped like the actual entry layout below
function DetailSkeleton() {
  return (
    <article className="scp-detail__folder" aria-hidden="true">
      <Skeleton style={{ width: '160px', height: '12px', marginBottom: 16 }} />

      <div className="scp-detail__header">
        <Skeleton style={{ width: '140px', height: '32px' }} />
        <Skeleton style={{ width: '76px', height: '26px' }} />
      </div>

      <Skeleton
        style={{ width: '100%', height: '260px', margin: '20px 0 24px' }}
      />

      <Skeleton style={{ width: '200px', height: '16px', marginBottom: 12 }} />
      <Skeleton style={{ width: '100%', height: '14px', marginBottom: 8 }} />
      <Skeleton style={{ width: '100%', height: '14px', marginBottom: 8 }} />
      <Skeleton style={{ width: '75%', height: '14px' }} />
    </article>
  )
}

// the /scp/:id route - shows one entry, or a loading/not-found state
function SCPDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { entries, loading, deleteEntry } = useScpEntries()
  const { role } = useAuth()
  const entry = !loading ? entries.find((item) => item.id === id) : undefined
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  async function handleDelete() {
    if (!window.confirm(`Permanently delete ${entry.id}? This cannot be undone.`)) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteEntry(entry.dbId)
      navigate('/catalogue')
    } catch (err) {
      setDeleteError(err)
      setDeleting(false)
    }
  }

  useDocumentTitle(
    loading
      ? 'Loading… · SCP Catalogue'
      : entry
        ? `${entry.id} · SCP Catalogue`
        : `${id} Not Found · SCP Catalogue`,
  )

  if (loading) {
    return (
      <section className="scp-detail">
        <DetailHeader />
        <DetailSkeleton />
      </section>
    )
  }

  if (!entry) {
    return (
      <section className="scp-detail">
        <DetailHeader />
        <NotFoundMessage
          title="Entry Not Found"
          message={`We couldn't find an SCP entry for “${id}”.`}
        />
      </section>
    )
  }

  return (
    <section className="scp-detail">
      <DetailHeader />

      <article
        className="scp-detail__folder"
        data-class={getObjectClassKey(entry.objectClass)}
      >
        <p className="scp-detail__kicker">
          SCP Foundation — Restricted Access
        </p>

        <header className="scp-detail__header">
          <h1 className="scp-detail__id">{entry.id}</h1>
          <ObjectClassBadge objectClass={entry.objectClass} />
          {role === 'admin' && (
            <>
              <Link to={`/scp/${entry.id}/edit`} className="scp-detail__edit">
                Edit
              </Link>
              <button
                type="button"
                className="scp-detail__delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete Entry'}
              </button>
            </>
          )}
        </header>

        {deleteError && (
          <p className="scp-detail__delete-error">
            Failed to delete entry: {deleteError.message}
          </p>
        )}

        {entry.image ? (
          <img className="scp-detail__image" src={entry.image} alt={entry.id} />
        ) : (
          <RedactedPlaceholder className="scp-detail__image scp-detail__image--placeholder" />
        )}

        <TextSection
          title="Containment Procedures"
          paragraphs={entry.containmentProcedures}
        />
        <TextSection title="Description" paragraphs={entry.description} />
        <HistorySection title="History Log" entries={entry.history} />
        <TextSection title="Reference" paragraphs={entry.reference} />

        {entry.additionalSections?.map((section, index) => (
          <details key={index} className="scp-detail__collapsible">
            <summary>{section.heading}</summary>
            <div className="scp-detail__collapsible-content">
              {section.content.map((paragraph, pIndex) => (
                <p key={pIndex}>{renderRedactedText(paragraph)}</p>
              ))}
            </div>
          </details>
        ))}
      </article>
    </section>
  )
}

export default SCPDetail
