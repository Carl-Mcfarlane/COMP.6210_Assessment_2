import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import CatalogueList from './pages/CatalogueList.jsx'
import SCPDetail from './pages/SCPDetail.jsx'
import SCPForm from './pages/SCPForm.jsx'
import NotFound from './pages/NotFound.jsx'
import Footer from './components/Footer.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
  // the home page is a full-bleed hero, so the footer only shows up once
  // you're past it, on catalogue/detail/not-found
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* browsing is public; only creating/editing needs an account */}
        <Route path="/catalogue" element={<CatalogueList />} />
        <Route
          path="/scp/new"
          element={(
            <ProtectedRoute>
              <SCPForm />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/scp/:id/edit"
          element={(
            <ProtectedRoute>
              <SCPForm />
            </ProtectedRoute>
          )}
        />
        <Route path="/scp/:id" element={<SCPDetail />} />
        {/* catches anything that doesn't match one of the routes above */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isHome && <Footer />}
    </>
  )
}

export default App
