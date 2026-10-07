import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import NotFoundMessage from '../components/NotFoundMessage.jsx'
import './SCPDetail.css'

// catch-all route for any url that doesn't match, e.g. a typo or a bad link
function NotFound() {
  useDocumentTitle('Page Not Found · SCP Catalogue')

  return (
    <section className="scp-detail">
      <Link to="/catalogue" className="scp-detail__back">
        &larr; Back to catalogue
      </Link>
      <NotFoundMessage
        title="Page Not Found"
        message="The page you’re looking for doesn’t exist or may have been moved."
      />
    </section>
  )
}

export default NotFound
