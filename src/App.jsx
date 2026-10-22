import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import './App.css'

const THEME_STORAGE_KEY = 'talentflow-theme'
const ThemeContext = createContext({ theme: 'system', setTheme: () => {} })

function readThemePreference() {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    return ['light', 'dark', 'system'].includes(saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readThemePreference)
  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const resolved = theme === 'system' ? (mediaQuery?.matches ? 'dark' : 'light') : theme
      document.documentElement.dataset.theme = resolved
      document.documentElement.style.colorScheme = resolved
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#101b24' : '#f5f7f4')
    }
    applyTheme()
    mediaQuery?.addEventListener?.('change', applyTheme)
    return () => mediaQuery?.removeEventListener?.('change', applyTheme)
  }, [theme])
  useEffect(() => {
    try { window.localStorage.setItem(THEME_STORAGE_KEY, theme) } catch { /* Preference remains active for this session. */ }
  }, [theme])
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

function ThemeSelector() {
  const { theme, setTheme } = useContext(ThemeContext)
  const icon = theme === 'system' ? 'monitor' : theme === 'dark' ? 'moon' : 'sun'
  return <label className="theme-control"><Icon name={icon} size={16} /><span>Theme</span><select aria-label="Color theme" value={theme} onChange={(event) => setTheme(event.target.value)}><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></select></label>
}

const roles = [
  { id: 'recruiter', title: 'Recruiter', descriptor: 'Talent acquisition', description: 'Build thoughtful teams with a clearer view of every search, conversation, and decision.', tone: 'lime' },
  { id: 'candidate', title: 'Candidate', descriptor: 'Career opportunities', description: 'Discover roles that fit your strengths and keep every application moving forward.', tone: 'violet' },
  { id: 'employee', title: 'Employee', descriptor: 'Growth & development', description: 'Make your next chapter at work a little more intentional, supported, and yours.', tone: 'blue' },
]

function getRole(id) { return roles.find((role) => role.id === id) }
function getView(path) {
  if (path === '/' || path === '/portals') return { page: path === '/' ? 'home' : 'roles' }
  const match = path.match(/^\/(login|dashboard)\/(recruiter|candidate|employee)$/)
  return match ? { page: match[1], role: match[2] } : { page: 'invalid' }
}
function getSafePath(path, signedInRole) {
  const view = getView(path)
  if (view.page === 'invalid') return '/'
  if (view.page === 'dashboard' && signedInRole !== view.role) return `/login/${view.role}`
  if (view.page === 'login' && signedInRole === view.role) return `/dashboard/${view.role}`
  return path
}

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const icons = {
    logo: <><path d="M4 17.5 10.9 4h2.2L20 17.5h-3.1l-1.5-3H8.5l-1.5 3H4Z" /><path d="M9.7 12h4.6" /></>,
    arrow: <><path d="M4 12h15M13 6l6 6-6 6" /></>, back: <><path d="M19 12H5m6 6-6-6 6-6" /></>,
    home: <><path d="m3 10 9-7 9 7v10H3V10Z" /><path d="M9 20v-6h6v6" /></>,
    users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0m1-14a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.5" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V4h8v3M3 12h18m-11 0v2h4v-2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    chart: <><path d="M3 3v18h18M7 14l4-4 4 3 6-7" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    filter: <><path d="M4 6h16M7 12h10m-7 6h4" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    bookmark: <><path d="M6 4h12v17l-6-4-6 4V4Z" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    sparkle: <><path d="m12 2 1.8 7.2L21 12l-7.2 1.8L12 21l-1.8-7.2L3 12l7.2-2.8L12 2Z" /></>,
    book: <><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17Z" /><path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    leaf: <><path d="M20 4c-8 0-14 3-14 10a6 6 0 0 0 6 6c7 0 8-8 8-16Z" /><path d="M4 21c3-5 6-8 11-11" /></>,
    eye: <><path d="M2 12s3.4-6 10-6 10 6 10 6-3.4 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 20h16" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    moon: <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />,
    monitor: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>,
  }
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name] || icons.sparkle}</svg>
}

function Brand({ onClick, inverse = false }) {
  return <button type="button" className={`brand ${inverse ? 'brand-inverse' : ''}`} onClick={onClick} aria-label="Talentflow home"><span className="brand-symbol"><Icon name="logo" size={19} strokeWidth={2} /></span><span>talentflow<span className="brand-accent">.</span></span></button>
}

function Topbar({ page, navigate }) {
  return <header className="marketing-header"><Brand onClick={() => navigate('/')} /><nav aria-label="Main navigation"><button className={page === 'home' ? 'selected' : ''} onClick={() => navigate('/')}>Platform</button><button onClick={() => { navigate('/'); window.setTimeout(() => document.getElementById('approach')?.scrollIntoView({ behavior: 'smooth' }), 100) }}>Our approach</button><button className={page === 'roles' ? 'selected' : ''} onClick={() => navigate('/portals')}>Portals</button></nav><div className="marketing-actions"><ThemeSelector /><button className="button button-dark" onClick={() => navigate('/portals')}>Get started <Icon name="arrow" size={15} /></button></div></header>
}

function LandingPreview() {
  return (
    <div className="landing-preview">
      <div className="preview-window">
        <div className="window-chrome"><span /><span /><span /><b>talentflow / insights</b><Icon name="dots" size={16} /></div>
        <div className="window-content">
          <div className="preview-rail"><span className="mini-brand"><Icon name="logo" size={15} /></span><i className="rail-active" /><i /><i /><i /><i /></div>
          <div className="preview-main">
            <div className="preview-head"><div><small>THURSDAY, OCTOBER 22</small><h3>Good morning, Alex</h3><p>Your hiring pulse, at a glance.</p></div><span className="preview-range">Last 30 days⌄</span></div>
            <div className="preview-kpis"><div><small>Active roles</small><b>24</b><em>↗ 12% <span>vs last month</span></em></div><div><small>Qualified talent</small><b>1,284</b><em>↗ 8.4% <span>vs last month</span></em></div><div><small>Time to hire</small><b>18 <i>days</i></b><em className="down">↘ 3 days <span>vs last month</span></em></div></div>
            <div className="preview-analytics">
              <div className="preview-chart"><div className="chart-head"><span>Hiring velocity</span><span>Applications&nbsp;&nbsp; Offers</span></div><svg viewBox="0 0 410 105" role="img" aria-label="Illustrative hiring trend chart"><path className="chart-gridline" d="M0 22H410M0 52H410M0 82H410" /><path className="chart-fill" d="M0 77 C32 65 42 78 70 58 S112 61 145 43 S181 54 214 34 S251 46 280 25 S320 40 350 17 S383 31 410 8V105H0Z" /><path className="chart-line" d="M0 77 C32 65 42 78 70 58 S112 61 145 43 S181 54 214 34 S251 46 280 25 S320 40 350 17 S383 31 410 8" /><path className="chart-line-violet" d="M0 89 C37 88 42 70 74 78 S111 72 145 64 S182 69 214 57 S250 63 280 54 S319 59 350 43 S383 49 410 38" /></svg><div className="chart-labels"><span>Sep 24</span><span>Oct 01</span><span>Oct 08</span><span>Oct 15</span><span>Oct 22</span></div></div>
              <div className="preview-funnel"><span>Hiring funnel</span><div><i style={{ width: '94%' }} /><b>Applied <small>642</small></b></div><div><i style={{ width: '72%' }} /><b>Screening <small>318</small></b></div><div><i style={{ width: '51%' }} /><b>Interview <small>124</small></b></div><div><i style={{ width: '29%' }} /><b>Offer <small>38</small></b></div></div>
            </div>
          </div>
        </div>
      </div>
      <div className="preview-floating"><span className="floating-pulse" /><span><b>Signal detected</b><small>3 strong matches for Product Designer</small></span><Icon name="arrow" size={15} /></div>
      <div className="preview-caption"><span>PRODUCT PREVIEW · RECRUITER ANALYTICS</span><span>01 / 03</span></div>
    </div>
  )
}

function Landing({ navigate }) {
  return <div className="marketing-page"><Topbar page="home" navigate={navigate} /><main><section className="landing-hero"><div className="landing-copy"><span className="overline"><i /> TALENT INTELLIGENCE, WITH INTENTION</span><h1>Great teams start<br />with <em>seeing people.</em></h1><p>Meet the platform that brings hiring and human growth into sharper focus. Thoughtful tools for every chapter of work.</p><div className="landing-actions"><button className="button button-lime" onClick={() => navigate('/portals')}>Explore Talentflow <Icon name="arrow" size={16} /></button><button className="quiet-link" onClick={() => navigate('/portals')}>Choose your workspace <Icon name="arrow" size={15} /></button></div><div className="landing-note"><span className="note-mark"><Icon name="sparkle" size={15} /></span><span><b>One connected people journey</b><small>Recruitment · Opportunity · Growth</small></span></div></div><LandingPreview /></section><section className="approach-section" id="approach"><div className="approach-intro"><span className="overline"><i /> A PEOPLE PLATFORM</span><h2>Every perspective<br />has a <em>place.</em></h2><p>Recruiting is only the beginning. Talentflow creates a considered space for the whole experience of work.</p></div><div className="role-entry-list">{roles.map((role, index) => <button className="role-entry" key={role.id} onClick={() => navigate('/portals')}><span className={`entry-index ${role.tone}`}>0{index + 1}</span><span className="entry-copy"><b>{role.title}</b><small>{role.description}</small></span><Icon name={role.id === 'recruiter' ? 'users' : role.id === 'candidate' ? 'target' : 'leaf'} size={20} /><Icon name="arrow" size={17} /></button>)}</div></section><section className="trust-band"><span>BUILT FOR BETTER PEOPLE DECISIONS</span><p>Clearer hiring. More human experiences. A stronger sense of what comes next.</p><button className="button button-outline" onClick={() => navigate('/portals')}>Find your workspace <Icon name="arrow" size={15} /></button></section></main><footer className="marketing-footer"><Brand onClick={() => navigate('/')} /><span>Thoughtful talent experiences, end to end.</span><span>© 2026 Talentflow · Student project preview</span></footer></div>
}

function RoleSelection({ navigate }) {
  return <div className="marketing-page"><Topbar page="roles" navigate={navigate} /><main className="portal-page"><button className="back-link" onClick={() => navigate('/')}><Icon name="back" size={16} /> Back to overview</button><div className="portal-heading"><span className="overline"><i /> YOUR TALENTFLOW WORKSPACE</span><h1>Where are you<br /><em>in the journey?</em></h1><p>Choose a workspace designed around your goals. You’ll sign in to the portal that matches your role.</p></div><div className="portal-grid">{roles.map((role, index) => <article className={`portal-card ${role.tone}`} key={role.id}><div className="portal-card-top"><span>0{index + 1} / WORKSPACE</span><span className="portal-icon"><Icon name={role.id === 'recruiter' ? 'users' : role.id === 'candidate' ? 'target' : 'leaf'} size={22} /></span></div><div><small>{role.descriptor}</small><h2>{role.title}</h2><p>{role.description}</p></div><button onClick={() => navigate(`/login/${role.id}`)}>Continue as {role.title}<Icon name="arrow" size={16} /></button></article>)}</div><div className="portal-note"><Icon name="lock" size={15} /><span>Each workspace is protected by its own role-specific demo sign-in.</span></div></main><footer className="marketing-footer"><Brand onClick={() => navigate('/')} /><span>Thoughtful talent experiences, end to end.</span><span>© 2026 Talentflow · Student project preview</span></footer></div>
}

function Login({ role, navigate, onSignIn }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [visible, setVisible] = useState(false)
  const [remember, setRemember] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const create = role.id === 'candidate' && mode === 'create'
  function submit(event) {
    event.preventDefault()
    setFeedback(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setFeedback({ type: 'error', text: 'Enter a valid email address to continue.' })
    if (password.length < 6) return setFeedback({ type: 'error', text: 'Use at least 6 characters for the demo password.' })
    if (create && password !== confirm) return setFeedback({ type: 'error', text: 'Those passwords do not match. Check and try again.' })
    onSignIn(role.id)
  }
  const copy = {
    recruiter: ['A clearer view of the people you could meet.', 'Make space for better conversations and more considered hiring.'],
    candidate: ['Find a role that feels like your next chapter.', 'Explore opportunities and keep your progress in one calm place.'],
    employee: ['Make your next chapter at work your own.', 'A thoughtful home for growth, learning, and your team experience.'],
  }[role.id]
  return <main className="login-page"><aside className={`login-aside ${role.tone}`}><Brand onClick={() => navigate('/')} inverse /><button className="back-link" onClick={() => navigate('/portals')}><Icon name="back" size={16} /> All workspaces</button><div className="login-pitch"><span className="login-role-icon"><Icon name={role.id === 'recruiter' ? 'users' : role.id === 'candidate' ? 'target' : 'leaf'} size={24} /></span><span className="overline">{role.descriptor.toUpperCase()}</span><h1>{copy[0]}</h1><p>{copy[1]}</p><div className="login-art"><div className="art-ring ring-a" /><div className="art-ring ring-b" /><div className="art-dashboard"><div className="art-top"><i /><i /><i /><span>talentflow / {role.id}</span></div><div className="art-body"><b>{role.id === 'recruiter' ? 'Hiring overview' : role.id === 'candidate' ? 'Your opportunities' : 'Growth overview'}</b><div className="art-metrics"><i /><i /><i /></div><div className="art-chart"><span /><span /><span /><span /><span /><span /><span /></div><div className="art-lines"><i /><i /><i /></div></div></div></div></div><div className="login-aside-foot"><span>THOUGHTFUL WORK, IN EVERY DIRECTION</span><span>ILLUSTRATIVE PREVIEW</span></div></aside><section className="login-main"><div className="login-top"><span>{create ? 'Start your candidate journey' : 'A little more focus for what matters.'}</span><ThemeSelector /><span>{role.id === 'candidate' && !create ? <>New here? <button onClick={() => { setMode('create'); setFeedback(null) }}>Create account</button></> : <button onClick={() => navigate('/portals')}>Change workspace</button>}</span></div><div className="login-form-wrap"><div className="login-form-title"><div className="login-form-role"><span className={`entry-index ${role.tone}`}><Icon name={role.id === 'recruiter' ? 'users' : role.id === 'candidate' ? 'target' : 'leaf'} size={17} /></span>{role.title} workspace</div><span className="overline">{create ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</span><h2>{create ? 'Create your account' : 'Sign in to Talentflow'}</h2><p>{create ? 'Set up your candidate demo account to continue.' : `Continue to your ${role.title.toLowerCase()} workspace.`}</p></div><form className="login-form" onSubmit={submit} noValidate><label htmlFor="login-email">Work email</label><div className="field-wrap"><Icon name="mail" size={17} /><input id="login-email" type="email" autoComplete="email" placeholder="name@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div><div className="password-row"><label htmlFor="login-password">Password</label>{!create && <button className="text-button" type="button" onClick={() => setFeedback({ type: 'info', text: 'Password recovery is not connected in this demo. No email was sent.' })}>Forgot password?</button>}</div><div className="field-wrap"><Icon name="lock" size={17} /><input id="login-password" type={visible ? 'text' : 'password'} autoComplete={create ? 'new-password' : 'current-password'} placeholder="At least 6 characters" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} /><button className="visibility-button" type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Hide password' : 'Show password'}><Icon name="eye" size={17} /><span>{visible ? 'Hide' : 'Show'}</span></button></div>{create && <><label htmlFor="confirm-password">Confirm password</label><div className="field-wrap"><Icon name="lock" size={17} /><input id="confirm-password" type={visible ? 'text' : 'password'} autoComplete="new-password" placeholder="Re-enter your password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required /></div></>}{!create && <label className="remember-line"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Remember me</span><small>Demo only; credentials are never saved.</small></label>}{feedback && <p className={`login-feedback ${feedback.type}`} role="status">{feedback.text}</p>}<button className="button button-login" type="submit">{create ? 'Create demo account' : 'Sign in'}<Icon name="arrow" size={16} /></button><div className="demo-caption"><span className="demo-indicator" /><span><b>Prototype sign-in</b><br />Use any valid email and a password of 6+ characters. Checked in-browser only; never stored or sent.</span></div></form>{role.id === 'candidate' && <p className="login-switch">{create ? 'Already registered?' : 'New to Talentflow?'} <button onClick={() => { setMode(create ? 'signin' : 'create'); setFeedback(null) }}>{create ? 'Sign in' : 'Create a candidate account'}</button></p>}</div><div className="login-bottom"><button onClick={() => navigate('/portals')}>← Switch workspace</button><span>Talentflow · Project preview</span></div></section></main>
}

const initialCandidates = [
  { id: 1, name: 'Olivia Rhye', initials: 'OR', role: 'Product Designer', score: 96, stage: 'Interview', color: 'rose', time: '2h ago' },
  { id: 2, name: 'Phoenix Baker', initials: 'PB', role: 'Senior Engineer', score: 92, stage: 'Screening', color: 'violet', time: '4h ago' },
  { id: 3, name: 'Lana Steiner', initials: 'LS', role: 'Product Designer', score: 89, stage: 'Shortlisted', color: 'amber', time: 'Yesterday' },
  { id: 4, name: 'Demi Wilkinson', initials: 'DW', role: 'Marketing Lead', score: 84, stage: 'Applied', color: 'blue', time: 'Yesterday' },
  { id: 5, name: 'Candice Wu', initials: 'CW', role: 'Senior Engineer', score: 81, stage: 'Interview', color: 'green', time: 'Oct 12' },
]
const initialJobs = [
  { title: 'Senior Product Designer', team: 'Design', location: 'Remote · US', candidates: 48, status: 'Hiring' },
  { title: 'Frontend Engineer', team: 'Engineering', location: 'New York · Hybrid', candidates: 72, status: 'Hiring' },
  { title: 'People Operations Lead', team: 'People', location: 'London · Hybrid', candidates: 31, status: 'Reviewing' },
  { title: 'Brand Marketing Manager', team: 'Marketing', location: 'Remote · EU', candidates: 26, status: 'Hiring' },
]

function Avatar({ initials, color = 'green', size = 'normal' }) { return <span className={`avatar avatar-${color} avatar-${size}`}>{initials}</span> }
function Metric({ label, value, change, note, icon, tone = 'lime' }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}><Icon name={icon} size={17} /></div><span className="metric-label">{label}</span><strong>{value}</strong><div className="metric-foot"><span className="metric-change">{change}</span><span>{note}</span></div></article>
}
function Status({ children }) { return <span className={`status status-${children.toLowerCase().replaceAll(' ', '-')}`}><i />{children}</span> }
function ChartTrend({ period }) {
  const values = period === '7 days' ? 'M0 72 C34 60 43 78 77 48S125 63 156 39s52 13 82-11 49 12 82-7 52 3 90-18' : period === '90 days' ? 'M0 83 C28 76 41 52 72 64s44-29 78-13 42-19 74-2 50-33 82-11 48-14 86-29' : 'M0 76 C28 64 44 79 73 55s45 17 78-1 46 8 77-19 45 24 78-7 57-3 86-27'
  return <svg className="trend-svg" viewBox="0 0 440 148" preserveAspectRatio="none" role="img" aria-label={`Illustrative application and hire trend over ${period}`}><path className="trend-grid" d="M0 20H440M0 56H440M0 92H440M0 128H440" /><path className="trend-area" d={`${values}V145H0Z`} /><path className="trend-line" d={values} /><path className="trend-secondary" d="M0 113 C38 106 45 93 78 102s43-15 75-7 43-18 78-5 47-16 78-6 48-23 81-13 32-15 50-16" /></svg>
}
function Funnel() {
  return <div className="funnel-chart"><div className="funnel-row"><span>Applied</span><div><i style={{ width: '100%' }} /></div><b>642</b><small>100%</small></div><div className="funnel-row"><span>Screening</span><div><i style={{ width: '72%' }} /></div><b>318</b><small>49.5%</small></div><div className="funnel-row"><span>Interview</span><div><i style={{ width: '49%' }} /></div><b>124</b><small>19.3%</small></div><div className="funnel-row"><span>Offer</span><div><i style={{ width: '30%' }} /></div><b>38</b><small>5.9%</small></div><div className="funnel-row"><span>Hired</span><div><i style={{ width: '21%' }} /></div><b>26</b><small>4.0%</small></div></div>
}
function Sidebar({ role = 'recruiter', page, setPage, navigate, collapsed, setCollapsed, onLogout }) {
  const lists = {
    recruiter: [['Overview', 'home'], ['Candidates', 'users'], ['Open positions', 'briefcase'], ['Interviews', 'calendar'], ['Reports', 'chart']],
    employee: [['My overview', 'home'], ['Development', 'target'], ['Learning', 'book'], ['Team & resources', 'users']],
  }
  return <aside className={`workspace-sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}><Brand inverse onClick={() => navigate('/')} /><div className="sidebar-workspace"><span className="workspace-monogram">{role === 'recruiter' ? 'N' : 'A'}</span><span><b>{role === 'recruiter' ? 'Northstar Studio' : 'Atlas Company'}</b><small>{role === 'recruiter' ? 'Talent workspace' : 'People & culture'}</small></span><Icon name="dots" size={17} /></div><p className="sidebar-label">WORKSPACE</p><nav className="sidebar-nav">{lists[role].map(([label, icon]) => <button className={page === label ? 'sidebar-item active' : 'sidebar-item'} key={label} onClick={() => setPage(label)} title={collapsed ? label : undefined}><Icon name={icon} size={17} /><span>{label}</span>{label === 'Interviews' && <small>4</small>}</button>)}</nav><button className="sidebar-collapse" onClick={() => setCollapsed((value) => !value)}><span className="collapse-glyph">{collapsed ? '›' : '‹'}</span><span>{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span></button><div className="sidebar-profile"><Avatar initials={role === 'recruiter' ? 'AM' : 'JL'} color="lime" /><span><b>{role === 'recruiter' ? 'Alex Morgan' : 'Jordan Lee'}</b><small>{role === 'recruiter' ? 'Recruiting lead' : 'Product designer'}</small></span><button title="Log out" onClick={onLogout}><Icon name="dots" size={17} /></button></div></aside>
}

function WorkspaceTop({ role, pageTitle, navigate, onLogout, search, setSearch, searchPlaceholder = 'Search anything...' }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  return <header className="workspace-top"><div className="workspace-breadcrumb"><button onClick={() => navigate('/portals')}>Workspace</button><span>/</span><b>{pageTitle}</b></div><div className="workspace-top-actions"><label className="global-search"><Icon name="search" size={16} /><input placeholder={searchPlaceholder} value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search workspace" /><kbd>⌘ K</kbd></label><ThemeSelector /><div className="notification-area"><button className="top-icon-button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Icon name="bell" size={18} /><i /></button>{notificationsOpen && <div className="notification-popover"><b>Notifications</b><p><span className="live-dot" />{role === 'recruiter' ? '2 new candidate updates' : 'Your team shared a new update'}</p><small>Demo notifications · just now</small></div>}</div><span className="top-divider" /><div className="top-user"><Avatar initials={role === 'recruiter' ? 'AM' : role === 'employee' ? 'JL' : 'MC'} color="lime" /><span><b>{role === 'recruiter' ? 'Alex Morgan' : role === 'employee' ? 'Jordan Lee' : 'Maya Chen'}</b><small>{role}</small></span></div><button className="logout-mini" onClick={onLogout}>Log out</button></div></header>
}

function RecruiterDashboard({ navigate, onLogout }) {
  const [page, setPage] = useState('Overview')
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('All stages')
  const [period, setPeriod] = useState('30 days')
  const [candidates, setCandidates] = useState(initialCandidates)
  const [jobs, setJobs] = useState(initialJobs)
  const [modal, setModal] = useState(false)
  const [toast, setToast] = useState('')
  const [detail, setDetail] = useState(null)
  const [jobTitle, setJobTitle] = useState('')
  const [jobLocation, setJobLocation] = useState('')
  const showToast = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2600) }
  const visibleCandidates = useMemo(() => candidates.filter((candidate) => `${candidate.name} ${candidate.role} ${candidate.stage}`.toLowerCase().includes(search.toLowerCase()) && (stage === 'All stages' || candidate.stage === stage)), [candidates, search, stage])
  const visibleJobs = useMemo(() => jobs.filter((job) => `${job.title} ${job.team} ${job.location}`.toLowerCase().includes(search.toLowerCase())), [jobs, search])
  function advanceCandidate(candidate) {
    const progression = ['Applied', 'Shortlisted', 'Screening', 'Interview', 'Offer']
    const next = progression[Math.min(progression.indexOf(candidate.stage) + 1, progression.length - 1)]
    setCandidates((items) => items.map((item) => item.id === candidate.id ? { ...item, stage: next } : item))
    showToast(`${candidate.name} moved to ${next}.`)
  }
  function createJob(event) {
    event.preventDefault()
    const trimmed = jobTitle.trim()
    if (!trimmed) return
    setJobs((items) => [{ title: trimmed, team: 'New team', location: jobLocation.trim() || 'Location flexible', candidates: 0, status: 'Draft' }, ...items])
    setJobTitle(''); setJobLocation(''); setModal(false); setPage('Open positions'); showToast('Position draft created in this session.')
  }
  function exportCsv() {
    const rows = [['Name', 'Role', 'Match score', 'Stage'], ...visibleCandidates.map(({ name, role, score, stage: candidateStage }) => [name, role, score, candidateStage])]
    const blob = new Blob([rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')], { type: 'text/csv' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'talentflow-candidate-preview.csv'; link.click(); URL.revokeObjectURL(link.href); showToast('Illustrative candidate list exported.')
  }
  const isOverview = page === 'Overview'
  return <div className={`dashboard recruiter-dashboard ${collapsed ? 'with-collapsed-sidebar' : ''}`}><Sidebar page={page} setPage={(next) => { setPage(next); setSearch('') }} role="recruiter" navigate={navigate} collapsed={collapsed} setCollapsed={setCollapsed} onLogout={onLogout} /><div className="workspace-main"><WorkspaceTop role="recruiter" pageTitle={page} navigate={navigate} onLogout={onLogout} search={search} setSearch={setSearch} /><main className="recruiter-content"><div className="workspace-heading"><div><div className="dashboard-overline"><span className="live-dot" /> THURSDAY, OCTOBER 22, 2026 <span className="heading-slash">/</span> TALENT OVERVIEW</div><h1>{isOverview ? 'Good morning, Alex' : page}</h1><p>{isOverview ? 'Your hiring momentum is looking strong. Here’s the latest across your team.' : `A live snapshot of ${page.toLowerCase()} across your talent workspace.`}</p></div><div className="heading-actions"><select aria-label="Date range" value={period} onChange={(event) => setPeriod(event.target.value)}><option>7 days</option><option>30 days</option><option>90 days</option></select><button className="button button-quiet" onClick={exportCsv}><Icon name="download" size={15} /> Export</button><button className="button button-lime" onClick={() => setModal(true)}><Icon name="plus" size={16} /> New position</button></div></div>{isOverview && <><div className="metric-grid"><Metric label="Active positions" value={jobs.filter((job) => job.status !== 'Draft').length.toString().padStart(2, '0')} change="+12.5%" note="vs last month" icon="briefcase" /><Metric label="Total applicants" value="1,284" change="+8.2%" note="vs last month" icon="users" tone="violet" /><Metric label="Interviews booked" value="36" change="+4.6%" note="vs last month" icon="calendar" tone="blue" /><Metric label="Offers extended" value="12" change="+2.1%" note="vs last month" icon="sparkle" tone="orange" /></div><div className="analytics-grid"><section className="panel trend-panel"><div className="panel-heading"><div><h2>Application trends</h2><p>Qualified applications and offers over time</p></div><span className="trend-legend"><i /> Applications <i className="violet-dot" /> Offers</span></div><div className="trend-callout"><b>1,284</b><span>applications</span><em>↗ 8.2%</em></div><ChartTrend period={period} /><div className="trend-xlabels"><span>Sep 16</span><span>Sep 23</span><span>Sep 30</span><span>Oct 07</span><span>Oct 14</span></div></section><section className="panel funnel-panel"><div className="panel-heading"><div><h2>Hiring funnel</h2><p>Stage conversion this month</p></div><button className="icon-button" aria-label="More funnel options"><Icon name="dots" /></button></div><Funnel /><div className="funnel-footer"><span>Overall conversion</span><b>4.0%</b><span className="positive-text">↑ 0.8% vs prior period</span></div></section></div><div className="lower-grid"><CandidatePanel candidates={visibleCandidates} stage={stage} setStage={setStage} setDetail={setDetail} advance={advanceCandidate} /><div className="side-stack"><ActivityPanel /><InterviewPanel /></div></div></>}{page === 'Candidates' && <CandidatePanel candidates={visibleCandidates} stage={stage} setStage={setStage} setDetail={setDetail} advance={advanceCandidate} expanded />}{page === 'Open positions' && <JobsPanel jobs={visibleJobs} />}{page === 'Interviews' && <InterviewPanel expanded />}{page === 'Reports' && <div className="reports-grid"><section className="panel trend-panel"><div className="panel-heading"><div><h2>Hiring velocity</h2><p>Illustrative trend for the selected period</p></div><span className="trend-legend"><i /> Applications <i className="violet-dot" /> Hires</span></div><ChartTrend period={period} /><div className="trend-xlabels"><span>Sep 16</span><span>Sep 23</span><span>Sep 30</span><span>Oct 07</span><span>Oct 14</span></div></section><section className="panel"><div className="panel-heading"><div><h2>Conversion by stage</h2><p>Candidate journey snapshot</p></div></div><Funnel /></section></div>}<p className="data-disclaimer">Talentflow demo workspace · All people, metrics, and activity shown are illustrative sample content.</p></main></div>{toast && <div className="toast" role="status"><Icon name="check" size={16} />{toast}</div>}{modal && <div className="modal-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false) }}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="new-job-title"><button className="dialog-close" onClick={() => setModal(false)} aria-label="Close"><Icon name="close" /></button><span className="modal-kicker">RECRUITMENT · NEW ROLE</span><h2 id="new-job-title">Start a position</h2><p>Create an illustrative role draft in this browser session.</p><form onSubmit={createJob}><label htmlFor="position-title">Position title</label><input id="position-title" autoFocus value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="e.g. Product Designer" required /><label htmlFor="position-location">Location</label><input id="position-location" value={jobLocation} onChange={(event) => setJobLocation(event.target.value)} placeholder="Remote · US" /><div className="dialog-actions"><button type="button" className="button button-quiet" onClick={() => setModal(false)}>Cancel</button><button className="button button-lime" type="submit"><Icon name="plus" size={15} /> Create draft</button></div></form></section></div>}{detail && <div className="modal-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetail(null) }}><section className="dialog candidate-dialog" role="dialog" aria-modal="true" aria-labelledby="candidate-detail-title"><button className="dialog-close" onClick={() => setDetail(null)} aria-label="Close"><Icon name="close" /></button><Avatar initials={detail.initials} color={detail.color} size="large" /><span className="modal-kicker">CANDIDATE PROFILE · DEMO</span><h2 id="candidate-detail-title">{detail.name}</h2><p>{detail.role} · {detail.time}</p><div className="candidate-match"><span>Role alignment</span><b>{detail.score}%</b></div><div className="detail-status"><span>Current stage</span><Status>{detail.stage}</Status></div><div className="dialog-actions"><button className="button button-quiet" onClick={() => setDetail(null)}>Close</button><button className="button button-lime" onClick={() => { advanceCandidate(detail); setDetail(null) }}>Move to next stage <Icon name="arrow" size={15} /></button></div></section></div>}</div>
}

function CandidatePanel({ candidates, stage, setStage, setDetail, _advance, expanded = false }) {
  return <section className={`panel candidate-panel ${expanded ? 'candidate-panel-expanded' : ''}`}><div className="panel-heading"><div><h2>Candidate pipeline</h2><p>{expanded ? 'Review applicants and advance their journey' : 'The latest candidates in motion'}</p></div><div className="panel-tools"><select value={stage} onChange={(event) => setStage(event.target.value)} aria-label="Filter candidates by stage"><option>All stages</option><option>Applied</option><option>Shortlisted</option><option>Screening</option><option>Interview</option><option>Offer</option></select>{!expanded && <button className="text-button" onClick={() => setStage('All stages')}>View all <Icon name="arrow" size={14} /></button>}</div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Candidate</th><th>Role</th><th>Match</th><th>Stage</th><th>Applied</th><th /></tr></thead><tbody>{candidates.map((candidate) => <tr key={candidate.id}><td><div className="person-cell"><Avatar initials={candidate.initials} color={candidate.color} /><b>{candidate.name}</b></div></td><td>{candidate.role}</td><td><span className="match-score"><i style={{ '--match': `${candidate.score}%` }} />{candidate.score}%</span></td><td><Status>{candidate.stage}</Status></td><td>{candidate.time}</td><td><button className="row-action" onClick={() => setDetail(candidate)} aria-label={`View ${candidate.name}`}><Icon name="dots" size={16} /></button></td></tr>)}</tbody></table>{!candidates.length && <p className="empty-state">No candidates match this search. Try another name or stage.</p>}</div><div className="table-foot"><span>Showing {candidates.length} illustrative profiles</span><div><button disabled>Previous</button><button className="current-page">1</button><button>Next</button></div></div></section>
}

function JobsPanel({ jobs }) {
  return <section className="panel jobs-panel"><div className="panel-heading"><div><h2>Open positions</h2><p>Roles currently moving through the hiring process</p></div><span className="count-pill">{jobs.length} roles</span></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Position</th><th>Team</th><th>Location</th><th>Applicants</th><th>Status</th></tr></thead><tbody>{jobs.map((job) => <tr key={job.title}><td><b>{job.title}</b></td><td>{job.team}</td><td>{job.location}</td><td>{job.candidates}</td><td><Status>{job.status}</Status></td></tr>)}</tbody></table>{!jobs.length && <p className="empty-state">No roles match your search.</p>}</div></section>
}

function ActivityPanel() {
  const [expanded, setExpanded] = useState(false)
  const activity = [['PB', 'Phoenix Baker', 'moved to Interview', '12m', 'violet'], ['OR', 'Olivia Rhye', 'applied to Product Designer', '48m', 'rose'], ['LS', 'Lana Steiner', 'received a scorecard', '2h', 'amber'], ['CW', 'Candice Wu', 'shared availability', '3h', 'green'], ['DW', 'Demi Wilkinson', 'completed a screening', '5h', 'blue']]
  return <section className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Across your hiring team</p></div><span className="activity-count">{expanded ? '5 updates' : '3 new'}</span></div><div className="activity-list">{activity.slice(0, expanded ? activity.length : 3).map(([initials, name, event, time, color]) => <div className="activity-item" key={name}><Avatar initials={initials} color={color} size="small" /><p><b>{name}</b> {event}<small>{time} ago</small></p><span className="activity-dot" /></div>)}</div><button className="panel-link" onClick={() => setExpanded((value) => !value)}>{expanded ? 'Show recent only' : 'View activity log'} <Icon name="arrow" size={14} /></button></section>
}

function InterviewPanel({ expanded = false }) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const rows = [['09:30', 'Olivia Rhye', 'Product Designer', 'OR', 'rose'], ['11:00', 'Phoenix Baker', 'Senior Engineer', 'PB', 'violet'], ['14:15', 'Candice Wu', 'Senior Engineer', 'CW', 'green'], ['15:00', 'Demi Wilkinson', 'Marketing Lead', 'DW', 'blue']]
  return <section className={`panel interview-panel ${expanded ? 'interview-panel-expanded' : ''}`}><div className="panel-heading"><div><h2>Upcoming interviews</h2><p>Today · Thursday, October 22</p></div><span className="calendar-day">22 OCT</span></div><div className="interview-list">{rows.map(([time, name, role, initials, color]) => <div className="interview-item" key={name}><time>{time}</time><Avatar initials={initials} color={color} size="small" /><span><b>{name}</b><small>{role}</small></span><span className="interview-kind">Video</span></div>)}</div><button className="panel-link" onClick={() => setCalendarOpen((open) => !open)}>{calendarOpen ? 'Hide calendar note' : 'Open calendar'} <Icon name="arrow" size={14} /></button>{calendarOpen && <p className="calendar-note">Calendar integration is not connected. This is an illustrative interview schedule.</p>}</section>
}

const jobSeed = [
  { id: 'j1', title: 'Senior Product Designer', company: 'Northstar Studio', initials: 'N', color: 'lime', location: 'Remote · United States', type: 'Full-time', salary: '$145k – $180k', match: 96, skills: ['Product design', 'Figma', 'Systems'] },
  { id: 'j2', title: 'Product Designer, Growth', company: 'Linear Grove', initials: 'L', color: 'violet', location: 'New York · Hybrid', type: 'Full-time', salary: '$130k – $160k', match: 91, skills: ['Product design', 'Research', 'Growth'] },
  { id: 'j3', title: 'Experience Designer', company: 'Form & Field', initials: 'F', color: 'orange', location: 'Remote · North America', type: 'Contract', salary: '$85 – $110 / hr', match: 87, skills: ['UX strategy', 'Prototyping', 'Figma'] },
  { id: 'j4', title: 'Design Systems Lead', company: 'Alto Health', initials: 'A', color: 'blue', location: 'Boston · Hybrid', type: 'Full-time', salary: '$150k – $190k', match: 83, skills: ['Design systems', 'Accessibility', 'Leadership'] },
]
function CandidateDashboard({ navigate, onLogout }) {
  const [page, setPage] = useState('Overview')
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('Any location')
  const [saved, setSaved] = useState(['j2'])
  const [applied, setApplied] = useState(['j4'])
  const [applicationRows, setApplicationRows] = useState([
    { company: 'Alto Health', title: 'Design Systems Lead', initials: 'A', color: 'blue', stage: 'Interview', progress: 72, date: 'Updated yesterday' },
    { company: 'Fieldwork', title: 'Senior UX Designer', initials: 'F', color: 'orange', stage: 'In review', progress: 42, date: 'Updated Oct 11' },
    { company: 'Morrow', title: 'Product Designer', initials: 'M', color: 'green', stage: 'Applied', progress: 18, date: 'Submitted Oct 08' },
  ])
  const [toast, setToast] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const showToast = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2400) }
  const filteredJobs = useMemo(() => jobSeed.filter((job) => `${job.title} ${job.company} ${job.skills.join(' ')}`.toLowerCase().includes(search.toLowerCase()) && (location === 'Any location' || job.location.toLowerCase().includes(location.toLowerCase()))), [search, location])
  const navItems = ['Overview', 'Find jobs', 'Applications', 'Saved jobs']
  const visibleJobs = filteredJobs.filter((job) => page !== 'Saved jobs' || saved.includes(job.id))
  function apply(job) { setApplied((items) => items.includes(job.id) ? items : [...items, job.id]); setApplicationRows((items) => items.some((item) => item.title === job.title && item.company === job.company) ? items : [{ company: job.company, title: job.title, initials: job.initials, color: job.color, stage: 'Applied', progress: 18, date: 'Submitted just now' }, ...items]); showToast(`Application started for ${job.title}. Demo only.`) }
  const title = page === 'Overview' ? 'Your next move, in view.' : page
  return <div className="candidate-workspace"><header className="candidate-top"><Brand onClick={() => navigate('/')} /><button className="mobile-menu-button" onClick={() => setMobileMenu((value) => !value)} aria-label="Toggle navigation"><Icon name="menu" /></button><nav className={mobileMenu ? 'candidate-nav mobile-open' : 'candidate-nav'}>{navItems.map((item) => <button className={page === item ? 'active' : ''} key={item} onClick={() => { setPage(item); setMobileMenu(false) }}>{item}</button>)}</nav><div className="candidate-top-right"><ThemeSelector /><button className="top-icon-button" aria-label="Notifications"><Icon name="bell" /><i /></button><span className="top-divider" /><Avatar initials="MC" color="violet" /><span className="candidate-user">Maya Chen</span><button className="logout-mini" onClick={onLogout}>Log out</button></div></header><main className="candidate-content"><div className="candidate-welcome"><div><span className="candidate-kicker"><Icon name="sparkle" size={14} /> YOUR CAREER SPACE</span><h1>{title}</h1><p>{page === 'Overview' ? 'A few thoughtful matches and a clear view of what’s next.' : page === 'Find jobs' ? 'Explore roles matched to the things you do best.' : page === 'Applications' ? 'See how your conversations are progressing.' : 'The opportunities you want to come back to.'}</p></div><div className="profile-completion"><div className="completion-ring"><span>78<small>%</small></span></div><span><b>Profile strength</b><small>Two details could help you stand out</small><button onClick={() => showToast('Profile editor is a demo preview.')}>Complete your profile <Icon name="arrow" size={13} /></button></span></div></div>{(page === 'Overview' || page === 'Find jobs' || page === 'Saved jobs') && <section className="candidate-jobs-section"><div className="candidate-section-heading"><div><span className="section-eyebrow">CURATED FOR YOU</span><h2>{page === 'Saved jobs' ? 'Saved opportunities' : page === 'Find jobs' ? 'Explore opportunities' : 'Roles worth a look'}</h2><p>{page === 'Saved jobs' ? 'Keep your shortlist close while you decide.' : 'A few roles that align with your experience and interests.'}</p></div><button className="candidate-view-link" onClick={() => setPage('Find jobs')}>Browse all roles <Icon name="arrow" size={15} /></button></div><div className="job-search-row"><label className="candidate-search"><Icon name="search" size={17} /><input placeholder="Job title, company, or skill" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search jobs" /></label><label className="location-select"><Icon name="location" size={16} /><select value={location} onChange={(event) => setLocation(event.target.value)} aria-label="Filter by location"><option>Any location</option><option>Remote</option><option>New York</option><option>Boston</option></select></label><span className="job-result-count">{visibleJobs.length} roles</span></div><div className="job-list">{visibleJobs.map((job) => <JobCard key={job.id} job={job} isSaved={saved.includes(job.id)} isApplied={applied.includes(job.id)} onSave={() => setSaved((items) => items.includes(job.id) ? items.filter((id) => id !== job.id) : [...items, job.id])} onApply={() => apply(job)} showToast={showToast} />)}</div>{!visibleJobs.length && <p className="empty-state light-empty">No roles match these filters. Try a broader search.</p>}</section>}{(page === 'Overview' || page === 'Applications') && <div className="candidate-lower"><section className="light-panel application-panel"><div className="light-panel-heading"><div><span className="section-eyebrow">YOUR MOMENTUM</span><h2>Application tracker</h2></div><button className="candidate-view-link" onClick={() => setPage('Applications')}>All applications <Icon name="arrow" size={14} /></button></div><div className="application-list">{applicationRows.map((application) => <ApplicationRow key={application.company + application.title} {...application} />)}</div></section><aside className="candidate-side-column"><section className="light-panel next-interview"><span className="section-eyebrow">NEXT CONVERSATION</span><div className="interview-date"><b>26</b><span>OCT<br />MON</span></div><h3>Portfolio conversation</h3><p>Senior Product Designer · Northstar Studio</p><div className="interview-time"><Icon name="clock" size={15} /> 10:30 AM · Video call</div><button onClick={() => showToast('Interview details are illustrative in this demo.')}>View details <Icon name="arrow" size={14} /></button></section><section className="candidate-tip"><Icon name="sparkle" size={16} /><span><b>A little preparation goes a long way</b><small>Revisit your portfolio before Monday’s conversation.</small></span></section></aside></div>}{page === 'Applications' && <p className="demo-note light-note">Application status is illustrative demo content and does not connect to an employer.</p>}{page === 'Saved jobs' && <p className="demo-note light-note">Saved roles only last for this browser session.</p>}</main>{toast && <div className="toast light-toast" role="status"><Icon name="check" size={16} />{toast}</div>}<footer className="candidate-footer"><Brand onClick={() => navigate('/')} /><span>Illustrative roles & match indicators · Demo content only</span><button onClick={onLogout}>Sign out</button></footer></div>
}
function JobCard({ job, isSaved, isApplied, onSave, onApply, showToast }) {
  return <article className="job-card"><div className={`company-mark ${job.color}`}>{job.initials}</div><div className="job-info"><div className="job-title-row"><h3>{job.title}</h3><span className="match-tag"><Icon name="sparkle" size={12} /> {job.match}% match</span></div><p>{job.company} <i /> <Icon name="location" size={13} /> {job.location}</p><div className="job-meta"><span>{job.type}</span><span>{job.salary}</span></div><div className="skill-tags">{job.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div><div className="job-actions"><button className={`save-job ${isSaved ? 'saved' : ''}`} onClick={onSave} aria-label={isSaved ? `Unsave ${job.title}` : `Save ${job.title}`}><Icon name="bookmark" size={17} /></button><button className={`button ${isApplied ? 'button-applied' : 'button-job'}`} onClick={isApplied ? () => showToast('Your application is in the demo tracker.') : onApply}>{isApplied ? 'Application started' : 'View & apply'}{!isApplied && <Icon name="arrow" size={14} />}</button></div></article>
}
function ApplicationRow({ company, title, initials, color, stage, progress, date }) {
  return <div className="application-row"><div className={`company-mark company-mark-small ${color}`}>{initials}</div><div className="application-role"><b>{title}</b><small>{company}</small></div><Status>{stage}</Status><div className="application-progress"><div><i style={{ width: `${progress}%` }} /></div><small>{date}</small></div></div>
}

const learningSeed = [
  { id: 'l1', title: 'Design systems in practice', type: 'COURSE · 6 LESSONS', length: '2h 40m', progress: 68, tone: 'lime' },
  { id: 'l2', title: 'Facilitating better critiques', type: 'WORKSHOP · 4 MODULES', length: '1h 15m', progress: 35, tone: 'violet' },
  { id: 'l3', title: 'Accessibility foundations', type: 'LEARNING PATH · 8 LESSONS', length: '3h 10m', progress: 20, tone: 'blue' },
]
function EmployeeDashboard({ navigate, onLogout }) {
  const [page, setPage] = useState('My overview')
  const [collapsed, setCollapsed] = useState(false)
  const [learning, setLearning] = useState(learningSeed)
  const [goals, setGoals] = useState([false, true, false])
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const showToast = (text) => { setToast(text); window.setTimeout(() => setToast(''), 2400) }
  const isOverview = page === 'My overview'
  function advanceCourse(course) { setLearning((items) => items.map((item) => item.id === course.id ? { ...item, progress: Math.min(item.progress + 16, 100) } : item)); showToast(course.progress >= 84 ? 'Learning path complete. Nice work.' : 'Progress updated in this session.') }
  const navPage = (next) => { setPage(next); if (next === 'Learning') showToast('Learning plan opened.') }
  return <div className={`dashboard employee-dashboard ${collapsed ? 'with-collapsed-sidebar' : ''}`}><Sidebar role="employee" page={page} setPage={navPage} navigate={navigate} collapsed={collapsed} setCollapsed={setCollapsed} onLogout={onLogout} /><div className="workspace-main"><WorkspaceTop role="employee" pageTitle={page} navigate={navigate} onLogout={onLogout} search={search} setSearch={setSearch} searchPlaceholder="Search learning..." /><main className="employee-content"><div className="employee-welcome"><div><div className="dashboard-overline"><span className="live-dot" /> PEOPLE & DEVELOPMENT</div><h1>{isOverview ? 'Your growth, in good company.' : page}</h1><p>Good morning, Jordan. A few small steps are adding up to something meaningful.</p></div><button className="button button-outline" onClick={() => showToast('Your development check-in is ready in this demo.')}><Icon name="calendar" size={15} /> Schedule a check-in</button></div>{(isOverview || page === 'Development') && <div className="employee-overview-grid"><section className="panel skill-panel"><div className="panel-heading"><div><span className="section-eyebrow">YOUR STRENGTHS</span><h2>Skills in motion</h2><p>A snapshot of your current focus areas</p></div><button className="icon-button" aria-label="Skill options"><Icon name="dots" /></button></div><SkillsChart /><div className="skill-legend"><span><i className="skill-design" /> Product craft <b>82%</b></span><span><i className="skill-collab" /> Collaboration <b>74%</b></span><span><i className="skill-lead" /> Leadership <b>61%</b></span></div></section><section className="panel goals-panel"><div className="panel-heading"><div><span className="section-eyebrow">THIS QUARTER</span><h2>Growth milestones</h2><p>Small steps, meaningful momentum.</p></div><span className="goal-count">{goals.filter(Boolean).length} / {goals.length}</span></div><div className="goal-progress"><div><i style={{ width: `${Math.round(goals.filter(Boolean).length / goals.length * 100)}%` }} /></div></div><div className="goal-list">{['Lead a cross-functional design crit', 'Complete accessibility learning path', 'Share a systems case study'].map((goal, index) => <label className={goals[index] ? 'goal-item done' : 'goal-item'} key={goal}><input type="checkbox" checked={goals[index]} onChange={() => setGoals((items) => items.map((value, i) => i === index ? !value : value))} /><span className="goal-check"><Icon name="check" size={13} /></span><span>{goal}<small>{index === 0 ? 'Team impact' : index === 1 ? 'Learning' : 'Craft'}</small></span></label>)}</div><button className="panel-link" onClick={() => setPage('Development')}>View development plan <Icon name="arrow" size={14} /></button></section></div>}{(isOverview || page === 'Learning') && <section className="employee-learning"><div className="candidate-section-heading"><div><span className="section-eyebrow">KEEP BUILDING YOUR CRAFT</span><h2>Learning, at your pace.</h2><p>Picked to support the direction you want to grow.</p></div><button className="candidate-view-link" onClick={() => setPage('Learning')}>Explore learning <Icon name="arrow" size={15} /></button></div><div className="learning-grid">{learning.filter((course) => course.title.toLowerCase().includes(search.toLowerCase())).map((course) => <article className="learning-card" key={course.id}><div className={`learning-visual ${course.tone}`}><span><Icon name="book" size={19} /></span><small>{course.type}</small><b>{course.title}</b><em>{course.length}</em><div className="learning-abstract"><i /><i /><i /></div></div><div className="learning-card-foot"><div className="progress-copy"><span>{course.progress === 100 ? 'Complete' : `${course.progress}% complete`}</span><div><i style={{ width: `${course.progress}%` }} /></div></div><button onClick={() => advanceCourse(course)}>{course.progress === 100 ? 'Completed' : 'Continue'} <Icon name="arrow" size={14} /></button></div></article>)}</div></section>}{(isOverview || page === 'Team & resources') && <div className="employee-bottom-grid"><section className="panel announcements-panel"><div className="panel-heading"><div><span className="section-eyebrow">FROM YOUR TEAM</span><h2>Team notes</h2></div><button className="panel-link" onClick={() => showToast('You’re viewing all current demo announcements.')}>All notes <Icon name="arrow" size={14} /></button></div><article className="announcement"><span className="announcement-avatar">DS</span><div><span className="announcement-meta">DESIGN STUDIO · 2 HOURS AGO</span><h3>Studio share-out this Friday</h3><p>Bring a work-in-progress or a question you’ve been thinking about. There’s room for both.</p><button onClick={() => showToast('Announcement saved for later.')}>Save for later <Icon name="bookmark" size={13} /></button></div></article><article className="announcement announcement-secondary"><span className="announcement-avatar avatar-violet">PO</span><div><span className="announcement-meta">PEOPLE OPERATIONS · YESTERDAY</span><h3>Open enrollment Q&A</h3><p>Join a short session next week to walk through this year’s benefit options.</p></div></article></section><section className="panel resources-panel"><div className="panel-heading"><div><span className="section-eyebrow">QUICK ACCESS</span><h2>People resources</h2></div></div>{[['book', 'Career framework', 'Expectations & growth paths'], ['calendar', 'Time away', 'Plan upcoming leave'], ['users', 'Peer circles', 'Find your community'], ['target', 'Wellbeing support', 'Resources for your wellbeing']].map(([icon, title, description]) => <button className="resource-row" key={title} onClick={() => showToast(`${title} opened in demo preview.`)}><span><Icon name={icon} size={17} /></span><span><b>{title}</b><small>{description}</small></span><Icon name="arrow" size={14} /></button>)}</section></div>}{page === 'Development' && <p className="demo-note employee-note">Skills, milestones, and progress shown are illustrative. Your selections update only in this browser session.</p>}<p className="data-disclaimer">Talentflow employee demo · Learning, skill, and team content is illustrative sample information.</p></main></div>{toast && <div className="toast" role="status"><Icon name="check" size={16} />{toast}</div>}</div>
}
function SkillsChart() {
  return <div className="skills-visual"><svg viewBox="0 0 240 200" role="img" aria-label="Illustrative skill competency radar chart"><polygon className="radar-grid" points="120,17 185,65 160,141 80,141 55,65" /><polygon className="radar-grid" points="120,44 164,76 147,124 93,124 76,76" /><polygon className="radar-grid" points="120,70 143,87 134,108 106,108 97,87" /><path className="radar-shape" d="M120 35 170 77 145 126 88 132 70 73Z" /><path className="radar-axis" d="M120 17v124M55 65l105 76M185 65 80 141" /><circle cx="120" cy="35" r="4" /><circle cx="170" cy="77" r="4" /><circle cx="145" cy="126" r="4" /><circle cx="88" cy="132" r="4" /><circle cx="70" cy="73" r="4" /></svg><span className="radar-label label-top">Product craft</span><span className="radar-label label-right">Collaboration</span><span className="radar-label label-bottom-right">Leadership</span><span className="radar-label label-bottom-left">Communication</span><span className="radar-label label-left">Systems thinking</span></div>
}

function App() {
  const [pathname, setPathname] = useState(() => {
    const safe = getSafePath(window.location.pathname, null)
    if (safe !== window.location.pathname) window.history.replaceState({}, '', safe)
    return safe
  })
  const [signedInRole, setSignedInRole] = useState(null)
  const navigate = useCallback((path, replace = false) => {
    if (replace) window.history.replaceState({}, '', path)
    else window.history.pushState({}, '', path)
    setPathname(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  useEffect(() => {
    const onPop = () => {
      const safe = getSafePath(window.location.pathname, signedInRole)
      if (safe !== window.location.pathname) window.history.replaceState({}, '', safe)
      setPathname(safe)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [signedInRole])
  const view = getView(pathname)
  if (view.page === 'home' || view.page === 'invalid') return <Landing navigate={navigate} />
  if (view.page === 'roles') return <RoleSelection navigate={navigate} />
  const role = getRole(view.role)
  if (view.page === 'dashboard' && signedInRole !== view.role) return <Login role={role} navigate={navigate} onSignIn={(id) => { setSignedInRole(id); navigate(`/dashboard/${id}`) }} />
  if (view.page === 'login' && signedInRole === view.role) return <RoleDashboard role={view.role} navigate={navigate} onLogout={() => { setSignedInRole(null); navigate(`/login/${view.role}`) }} />
  if (view.page === 'login') return <Login role={role} navigate={navigate} onSignIn={(id) => { setSignedInRole(id); navigate(`/dashboard/${id}`) }} />
  return <RoleDashboard role={view.role} navigate={navigate} onLogout={() => { setSignedInRole(null); navigate(`/login/${view.role}`) }} />
}

function RoleDashboard({ role, navigate, onLogout }) {
  if (role === 'recruiter') return <RecruiterDashboard navigate={navigate} onLogout={onLogout} />
  if (role === 'candidate') return <CandidateDashboard navigate={navigate} onLogout={onLogout} />
  return <EmployeeDashboard navigate={navigate} onLogout={onLogout} />
}

export default App
