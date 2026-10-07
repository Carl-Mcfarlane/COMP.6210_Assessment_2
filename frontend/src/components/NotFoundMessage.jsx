import './NotFoundMessage.css'

// shared "not found" content - used both for an unknown SCP id and for the
// site-wide 404, just with different title/message text passed in

function NotFoundMessage({ title, message}) {
    return (
        <div className="not-found-message">
            <span className="not-found-message__stamp">// Access Debued //</span>
            <h1>{title}</h1>
            <p>{message}</p>
        </div>
    )
}

export default NotFoundMessage