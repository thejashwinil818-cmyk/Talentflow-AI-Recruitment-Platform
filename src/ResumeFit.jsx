import { useEffect, useState } from 'react'
import { analyzeResume, deleteResumeAnalysis, getResumeAnalyses, getResumeAnalysis } from './auth'

function SkillGroup({ title, skills, kind }) {
  return <section className={`fit-skill-group ${kind}`}>
    <h3>{title} <span>{skills.length}</span></h3>
    {skills.length ? <ul>{skills.map((skill) => <li key={skill}>{skill}</li>)}</ul> : <p>{kind === 'missing' ? 'No missing required skills.' : 'No additional dictionary skills detected.'}</p>}
  </section>
}

export default function ResumeFit({ jobs }) {
  const [jobId, setJobId] = useState('')
  const [file, setFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [history, setHistory] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const activeJobId = jobId || jobs[0]?.id || ''
  useEffect(() => {
    getResumeAnalyses().then(setHistory).catch((reason) => setError(reason.message))
  }, [])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setAnalysis(null)
    if (!jobs.length) return setError('There are no open jobs to analyze against yet.')
    if (!activeJobId) return setError('Select a job first.')
    if (!file) return setError('Choose a PDF or DOCX resume first.')
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'docx'].includes(extension)) return setError('Upload a PDF or DOCX file.')
    if (!file.size) return setError('That file is empty. Choose a readable resume.')
    if (file.size > 5 * 1024 * 1024) return setError('Resume files must be 5 MB or smaller.')
    setBusy(true)
    try {
      const result = await analyzeResume({ file, jobId: activeJobId })
      setAnalysis(result)
      setHistory(await getResumeAnalyses())
    } catch (reason) {
      setError(reason.message)
    } finally {
      setBusy(false)
    }
  }

  async function openHistory(id) {
    setError('')
    try { setAnalysis(await getResumeAnalysis(id)) } catch (reason) { setError(reason.message) }
  }

  async function removeHistory(id) {
    setError('')
    try {
      await deleteResumeAnalysis(id)
      setHistory((items) => items.filter((item) => item.id !== id))
      if (analysis?.id === id) setAnalysis(null)
    } catch (reason) { setError(reason.message) }
  }

  return <section className="resume-fit-page">
    <div className="resume-fit-heading">
      <div><span className="section-eyebrow">CAREER READINESS</span><h2>Resume &amp; job fit</h2><p>See how the skills listed on your resume line up with a role’s required skills.</p></div>
      <span className="resume-fit-badge">ESTIMATED SKILLS MATCH</span>
    </div>
    <div className="resume-fit-grid">
      <form className="light-panel resume-fit-form" onSubmit={submit}>
        <label className="resume-fit-label" htmlFor="resume-job">Choose a job</label>
        <select id="resume-job" value={activeJobId} onChange={(event) => { setJobId(event.target.value); setAnalysis(null) }} disabled={!jobs.length}>
          {jobs.length ? jobs.map((job) => <option key={job.id} value={job.id}>{job.title} · {job.company}</option>) : <option value="">No open jobs available</option>}
        </select>
        {activeJobId && <p className="resume-required-count">{jobs.find((job) => job.id === activeJobId)?.requiredSkills?.length || 0} required skills in this job</p>}
        <label className="resume-dropzone" htmlFor="resume-file">
          <span className="resume-upload-icon" aria-hidden="true">↑</span><b>{file ? file.name : 'Choose your resume'}</b>
          <small>PDF or DOCX · up to 5 MB</small>
          <input id="resume-file" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => { setFile(event.target.files?.[0] || null); setError(''); setAnalysis(null) }} />
        </label>
        <button className="button button-lime resume-analyze-button" disabled={busy || !jobs.length} type="submit">{busy ? 'Analyzing resume…' : 'Analyze resume'}</button>
        <p className="resume-privacy-note">Your file is processed privately and deleted after text extraction. The saved report contains skills only, not resume text.</p>
        {error && <p className="resume-error" role="alert">{error}</p>}
      </form>
      <aside className="light-panel resume-fit-method"><span className="section-eyebrow">HOW THE ESTIMATE WORKS</span><h3>Clear, keyword-based scoring</h3><p>We look for entries from a transparent skill dictionary in the extracted resume text and compare them with the selected job’s required skills.</p><div className="resume-formula">Matched required skills ÷ total required skills × 100</div><p>It is an estimate from resume wording, not proof of proficiency or an employment decision. No personal characteristics are inferred.</p></aside>
    </div>
    {analysis && <section className="light-panel resume-report" aria-live="polite">
      <div className="resume-report-heading"><div><span className="section-eyebrow">ANALYSIS REPORT</span><h2>{analysis.job?.title || 'Saved analysis'}</h2><p>{analysis.analyzedAt ? new Date(analysis.analyzedAt).toLocaleString() : 'Saved report'}</p></div><span className="resume-score" style={{ '--resume-score': `${analysis.matchPercentage ?? 0}%` }}><span>{analysis.matchPercentage === null ? 'N/A' : `${analysis.matchPercentage}%`}<small>{analysis.matchPercentage === null ? 'No score' : 'skills match'}</small></span></span></div>
      {analysis.job?.location && <p className="resume-required-count">Job location: {analysis.job.location}{analysis.job.workMode ? ` · ${analysis.job.workMode}` : ''}</p>}
      <p className="resume-explanation">{analysis.explanation} Location is shown for context and is not included in the skills match score.</p>
      {analysis.skillBreakdown?.length > 0 && <section className="resume-breakdown"><h3>Required skills breakdown</h3><ul>{analysis.skillBreakdown.map((row) => <li key={row.skill}><span className={row.found ? 'fit-check found' : 'fit-check'}>{row.found ? '✓' : '–'}</span><b>{row.skill}</b><span>{row.found ? `Found · ${row.contribution}%` : 'Not found · 0%'}</span></li>)}</ul></section>}
      <div className="resume-skill-groups"><SkillGroup title="Matched required skills" skills={analysis.matchedRequiredSkills || []} kind="matched" /><SkillGroup title="Missing required skills" skills={analysis.missingRequiredSkills || []} kind="missing" /><SkillGroup title="Additional relevant skills" skills={analysis.additionalRelevantSkills || []} kind="additional" /></div>
      <section className="resume-recommendations"><div className="resume-report-subhead"><span className="section-eyebrow">NEXT STEPS</span><h3>Skills to build, in job priority order</h3></div>{analysis.recommendations?.length ? analysis.recommendations.map((item) => <article key={item.skill} className="resume-recommendation"><span className="recommendation-priority">{String(item.priority).padStart(2, '0')}</span><div><h4>{item.skill}</h4><p><b>Learn:</b> {item.topics}</p><p><b>Try:</b> {item.project}</p></div></article>) : <p className="resume-no-recommendations">No missing required skills to recommend for this job.</p>}</section>
      <button type="button" className="candidate-view-link resume-again" onClick={() => { setAnalysis(null); document.getElementById('resume-job')?.focus() }}>Analyze against another job ↗</button>
    </section>}
    <section className="light-panel resume-history"><div className="light-panel-heading"><div><span className="section-eyebrow">PRIVATE TO YOUR ACCOUNT</span><h3>Recent analyses</h3></div></div>{history.length ? <ul>{history.map((item) => <li key={item.id}><button type="button" onClick={() => openHistory(item.id)}><b>{item.jobTitle}</b><small>{new Date(item.createdAt).toLocaleString()}</small></button><span>{item.report.matchPercentage === null ? 'Not scored' : `${item.report.matchPercentage}%`}</span><button type="button" className="resume-delete" aria-label={`Delete ${item.jobTitle} analysis`} onClick={() => removeHistory(item.id)}>Delete</button></li>)}</ul> : <p className="resume-history-empty">Your saved analysis reports will appear here. Uploaded documents themselves are deleted after processing.</p>}</section>
  </section>
}
