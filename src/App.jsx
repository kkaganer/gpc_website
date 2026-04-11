import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import Layout from './components/layout/Layout'
import ScrollToTop from './components/layout/ScrollToTop'
import ProtectedRoute from './components/admin/ProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Events = lazy(() => import('./pages/Events'))
const EventPage = lazy(() => import('./pages/EventPage'))
const Gallery = lazy(() => import('./pages/Gallery'))
const WhatsOn = lazy(() => import('./pages/WhatsOn'))
const Volunteers = lazy(() => import('./pages/Volunteers'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const GdprPolicy = lazy(() => import('./pages/GdprPolicy'))
const SafeguardingPolicy = lazy(() => import('./pages/SafeguardingPolicy'))

// Admin pages
const AdminLogin = lazy(() => import('./pages/admin/Login'))
const EventsManager = lazy(() => import('./pages/admin/EventsManager'))
const EventForm = lazy(() => import('./pages/admin/EventForm'))
const LondonEventsManager = lazy(() => import('./pages/admin/LondonEventsManager'))
const LondonEventForm = lazy(() => import('./pages/admin/LondonEventForm'))
const NewsletterManager = lazy(() => import('./pages/admin/NewsletterManager'))
const NewsletterSectionEditor = lazy(() => import('./pages/admin/NewsletterSectionEditor'))
const NewsletterAdvertisersManager = lazy(() => import('./pages/admin/NewsletterAdvertisersManager'))
const NewsletterAdvertiserForm = lazy(() => import('./pages/admin/NewsletterAdvertiserForm'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const UsersManager = lazy(() => import('./pages/admin/UsersManager'))
const ResetPassword = lazy(() => import('./pages/admin/ResetPassword'))

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<Spinner />}>
        <Routes>
          {/* Public routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:slug" element={<EventPage />} />
            <Route path="/whats-on" element={<WhatsOn />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/volunteers" element={<Volunteers />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/gdpr-policy" element={<GdprPolicy />} />
            <Route path="/safeguarding-policy" element={<SafeguardingPolicy />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/reset-password" element={<ResetPassword />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="events" element={<EventsManager />} />
            <Route path="events/new" element={<EventForm />} />
            <Route path="events/:id/edit" element={<EventForm />} />
            <Route path="whats-on" element={<LondonEventsManager />} />
            <Route path="whats-on/new" element={<LondonEventForm />} />
            <Route path="whats-on/:id/edit" element={<LondonEventForm />} />
            <Route path="newsletter" element={<NewsletterManager />} />
            <Route path="newsletter/editor" element={<NewsletterSectionEditor />} />
            <Route path="newsletter/editor/:id" element={<NewsletterSectionEditor />} />
            <Route path="newsletter-advertisers" element={<NewsletterAdvertisersManager />} />
            <Route path="newsletter-advertisers/new" element={<NewsletterAdvertiserForm />} />
            <Route path="newsletter-advertisers/:id/edit" element={<NewsletterAdvertiserForm />} />
            <Route path="users" element={<UsersManager />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
