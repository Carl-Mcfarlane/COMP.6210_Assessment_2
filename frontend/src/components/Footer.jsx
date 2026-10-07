import { Link } from 'react-router-dom'
import './Footer.css'

// slim bar at the bottom of every page except home (which is a full-bleed
// hero) - margin-top: auto in the CSS pins it to the viewport bottom even
// when the page content above it is short
function Footer() {
    const year = new Date().getFullYear()

    return(
        <footer className="site-footer">
            <p className="site-footer__text">
                &copy; {year} SCP Foundation Database - COMP.6210 Assessment 2 by Carl Mcfarlane
            </p>

            <nav className="site-footer__links" aria-label="Footer">
                <Link to="/catalogue">Catalogue</Link>
                <a
                    href="https://github.com/Carl-Mcfarlane/COMP.6210_Assessment_2"
                    target='_blank'
                    rel="noreferrer"
                >
                    Source Code
                </a>
            </nav>
        </footer>
    )
}

export default Footer