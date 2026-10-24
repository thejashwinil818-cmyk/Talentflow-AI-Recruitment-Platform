const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

async function request(path, options = {}) {
  let response
  try {
    const headers = { ...(options.headers || {}) }
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json'
    response = await fetch(`${API}${path}`, { credentials: 'include', ...options, headers })
  } catch {
    throw new Error('Talentflow API is unavailable. Start the backend and try again.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.')
  return data
}
export const normalizeEmail = (email) => email.trim().toLowerCase()
export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))
export async function restoreSession() { try { return (await request('/auth/me')).user } catch { return null } }
export async function registerAccount({ fullName, email, password, role }) { return (await request('/auth/register', { method:'POST', body:JSON.stringify({ fullName, email:normalizeEmail(email), password, role }) })).user }
export async function signIn({ email, password, role }) { return (await request('/auth/login', { method:'POST', body:JSON.stringify({ email:normalizeEmail(email), password, role }) })).user }
export async function signOut() { await request('/auth/logout', { method:'POST' }) }
export async function saveAccountProfile({ fullName, profile }) { return (await request('/users/me', { method:'PUT', body:JSON.stringify({ fullName, profile }) })).user }
export async function getJobs() { return (await request('/jobs')).jobs }
export async function createJob(job) { return (await request('/jobs', { method:'POST', body:JSON.stringify(job) })).job }
export async function updateJob(jobId, job) { return (await request(`/jobs/${encodeURIComponent(jobId)}`, { method:'PUT', body:JSON.stringify(job) })).job }
export async function applyToJob(jobId) { return (await request(`/jobs/${encodeURIComponent(jobId)}/apply`, { method:'POST', body:'{}' })).application }
export async function getMyApplications() { return (await request('/applications/me')).applications }
export async function analyzeResume({ file, jobId }) {
  const body = new FormData()
  body.append('resume', file)
  body.append('jobId', jobId)
  return request('/resumes/analyze', { method: 'POST', body })
}
export async function getResumeAnalyses() { return (await request('/resumes/analyses')).analyses }
export async function getResumeAnalysis(id) { return request(`/resumes/analyses/${encodeURIComponent(id)}`) }
export async function deleteResumeAnalysis(id) { return request(`/resumes/analyses/${encodeURIComponent(id)}`, { method: 'DELETE' }) }
