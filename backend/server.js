import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import multer from 'multer'
import mammoth from 'mammoth'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import crypto from 'node:crypto'
import path from 'node:path'
import { mkdirSync, readFileSync, readdirSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { canonicalSkill, extractSkills, recommendationFor } from './skills.js'

const app = express()
const here = path.dirname(fileURLToPath(import.meta.url))
try {
  for (const line of readFileSync(path.resolve(here, '../.env'), 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
} catch { /* .env is optional; defaults below are suitable for local development. */ }
const port = Number(process.env.PORT || 3001)
const frontend = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const db = new Database(path.resolve(here, '..', process.env.DATABASE_FILE || 'backend/talentflow.sqlite'))
const privateResumeDir = path.join(here, 'private-resumes')
mkdirSync(privateResumeDir, { recursive: true })
for (const entry of readdirSync(privateResumeDir, { withFileTypes: true })) {
  if (entry.isFile()) unlinkSync(path.join(privateResumeDir, entry.name))
}
db.pragma('foreign_keys = ON')
db.exec(`
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, full_name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('recruiter','candidate','employee')), profile TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, recruiter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, company TEXT NOT NULL, team TEXT NOT NULL DEFAULT 'People', location TEXT NOT NULL DEFAULT 'Remote', country TEXT NOT NULL DEFAULT 'India', state TEXT NOT NULL DEFAULT '', city TEXT NOT NULL DEFAULT '', work_mode TEXT NOT NULL DEFAULT 'Remote' CHECK(work_mode IN ('On-site','Hybrid','Remote')), description TEXT NOT NULL DEFAULT '', required_skills TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Closed','Draft')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE, candidate_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, status TEXT NOT NULL DEFAULT 'Applied', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(job_id,candidate_id));
CREATE TABLE IF NOT EXISTS resume_uploads (id TEXT PRIMARY KEY, candidate_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, file_type TEXT NOT NULL, file_size INTEGER NOT NULL, sha256 TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, file_deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS resume_analyses (id TEXT PRIMARY KEY, resume_id TEXT NOT NULL REFERENCES resume_uploads(id) ON DELETE CASCADE, candidate_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE, report_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`)
if (!db.pragma('table_info(jobs)').some((column) => column.name === 'required_skills')) db.exec("ALTER TABLE jobs ADD COLUMN required_skills TEXT NOT NULL DEFAULT '[]'")
for (const [column, definition] of [['country', "TEXT NOT NULL DEFAULT 'India'"], ['state', "TEXT NOT NULL DEFAULT ''"], ['city', "TEXT NOT NULL DEFAULT ''"], ['work_mode', "TEXT NOT NULL DEFAULT 'Remote'"]]) {
  if (!db.pragma('table_info(jobs)').some((item) => item.name === column)) db.exec(`ALTER TABLE jobs ADD COLUMN ${column} ${definition}`)
}
const starter = db.prepare('SELECT id FROM users WHERE id=?').get('starter-recruiter')
if (!starter) {
  db.prepare('INSERT INTO users(id,full_name,email,password_hash,role) VALUES(?,?,?,?,?)').run('starter-recruiter','Talentflow Sample','sample-jobs@talentflow.local',bcrypt.hashSync(crypto.randomBytes(32).toString('hex'),10),'recruiter')
  const add = db.prepare('INSERT INTO jobs(id,recruiter_id,title,company,team,location,country,state,city,work_mode,description,required_skills) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
  const samples = [
    ['starter-job-1','Senior Product Designer','Northstar Studio (Demo)','Design','Bengaluru, Karnataka, India','Karnataka','Bengaluru','Hybrid',['Product Design','Figma','Accessibility','User Research','Design Systems']],
    ['starter-job-2','Frontend Engineer','Fieldwork (Demo)','Engineering','Bengaluru, Karnataka, India','Karnataka','Bengaluru','Hybrid',['JavaScript','React','TypeScript','HTML','CSS','REST APIs','Git']],
    ['starter-job-3','People Operations Lead','Morrow (Demo)','People','Mysuru, Karnataka, India','Karnataka','Mysuru','On-site',['Human Resources','Communication','Recruiting','Employee Relations','Excel']],
    ['starter-job-4','Embedded Systems Engineer','CircuitTree (Demo)','Engineering','Mangaluru, Karnataka, India','Karnataka','Mangaluru','On-site',['C','C++','Embedded Systems','Linux','RTOS']],
    ['starter-job-5','VLSI Design Engineer','Silica Labs (Demo)','Electronics','Hubballi, Karnataka, India','Karnataka','Hubballi','Hybrid',['Verilog','SystemVerilog','RTL Design','VLSI','Tcl']],
    ['starter-job-6','Product Designer','BlueKite (Demo)','Product','Hyderabad, Telangana, India','Telangana','Hyderabad','Remote',['Product Design','Figma','User Research','Prototyping']],
    ['starter-job-7','Electronics Test Engineer','Aster Circuits (Demo)','Electronics','Chennai, Tamil Nadu, India','Tamil Nadu','Chennai','On-site',['Electronics','Testing','C','PCB Design']],
    ['starter-job-8','Technical Recruiter','PeopleSpring (Demo)','Human Resources','Pune, Maharashtra, India','Maharashtra','Pune','Hybrid',['Human Resources','Recruiting','Communication','Applicant Tracking']],
    ['starter-job-9','Frontend Engineer','Monsoon Product (Demo)','Engineering','Mumbai, Maharashtra, India','Maharashtra','Mumbai','Remote',['JavaScript','React','TypeScript','CSS','Git']],
  ]
  for (const [jid,title,company,team,location,state,city,mode,skills] of samples) add.run(jid,'starter-recruiter',title,company,team,location,'India',state,city,mode,'Demo data for product walkthroughs; this is not a verified live vacancy.',JSON.stringify(skills))
}
const starterLocations = [['starter-job-1','Bengaluru, Karnataka, India','Karnataka','Bengaluru','Hybrid'],['starter-job-2','Bengaluru, Karnataka, India','Karnataka','Bengaluru','Hybrid'],['starter-job-3','Mysuru, Karnataka, India','Karnataka','Mysuru','On-site'],['starter-job-4','Mangaluru, Karnataka, India','Karnataka','Mangaluru','On-site'],['starter-job-5','Hubballi, Karnataka, India','Karnataka','Hubballi','Hybrid'],['starter-job-6','Hyderabad, Telangana, India','Telangana','Hyderabad','Remote'],['starter-job-7','Chennai, Tamil Nadu, India','Tamil Nadu','Chennai','On-site'],['starter-job-8','Pune, Maharashtra, India','Maharashtra','Pune','Hybrid'],['starter-job-9','Mumbai, Maharashtra, India','Maharashtra','Mumbai','Remote']]
const updateStarter = db.prepare("UPDATE jobs SET location=?,country='India',state=?,city=?,work_mode=?,company=CASE WHEN company LIKE '% (Demo)' THEN company ELSE company || ' (Demo)' END,description='Demo data for product walkthroughs; this is not a verified live vacancy.' WHERE id=?")
for (const [jid,location,state,city,mode] of starterLocations) updateStarter.run(location,state,city,mode,jid)
const extraStarter = db.prepare("INSERT OR IGNORE INTO jobs(id,recruiter_id,title,company,team,location,country,state,city,work_mode,description,required_skills) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
for (const row of [
  ['starter-job-4','Embedded Systems Engineer','CircuitTree (Demo)','Engineering','Mangaluru, Karnataka, India','India','Karnataka','Mangaluru','On-site','Demo data for product walkthroughs; this is not a verified live vacancy.',['C','C++','Embedded Systems','Linux','RTOS']],
  ['starter-job-5','VLSI Design Engineer','Silica Labs (Demo)','Electronics','Hubballi, Karnataka, India','India','Karnataka','Hubballi','Hybrid','Demo data for product walkthroughs; this is not a verified live vacancy.',['Verilog','SystemVerilog','RTL Design','VLSI','Tcl']],
  ['starter-job-6','Product Designer','BlueKite (Demo)','Product','Hyderabad, Telangana, India','India','Telangana','Hyderabad','Remote','Demo data for product walkthroughs; this is not a verified live vacancy.',['Product Design','Figma','User Research','Prototyping']],
  ['starter-job-7','Electronics Test Engineer','Aster Circuits (Demo)','Electronics','Chennai, Tamil Nadu, India','India','Tamil Nadu','Chennai','On-site','Demo data for product walkthroughs; this is not a verified live vacancy.',['Electronics','Testing','C','PCB Design']],
  ['starter-job-8','Technical Recruiter','PeopleSpring (Demo)','Human Resources','Pune, Maharashtra, India','India','Maharashtra','Pune','Hybrid','Demo data for product walkthroughs; this is not a verified live vacancy.',['Human Resources','Recruiting','Communication','Applicant Tracking']],
  ['starter-job-9','Frontend Engineer','Monsoon Product (Demo)','Engineering','Mumbai, Maharashtra, India','India','Maharashtra','Mumbai','Remote','Demo data for product walkthroughs; this is not a verified live vacancy.',['JavaScript','React','TypeScript','CSS','Git']],
]) extraStarter.run(row[0],'starter-recruiter',...row.slice(1,10),JSON.stringify(row[10]))
const starterSkills = db.prepare('UPDATE jobs SET required_skills=? WHERE id=? AND required_skills=\'[]\'')
for (const [jid, skills] of [['starter-job-1',['Product Design','Figma','Accessibility','User Research','Design Systems']],['starter-job-2',['JavaScript','React','TypeScript','HTML','CSS','REST APIs','Git']],['starter-job-3',['Human Resources','Communication','Recruiting','Employee Relations','Excel']]]) starterSkills.run(JSON.stringify(skills), jid)
const userById = db.prepare('SELECT * FROM users WHERE id=?')
const safeUser = (u) => ({ id:u.id, fullName:u.full_name, email:u.email, role:u.role, profile:JSON.parse(u.profile || '{}') })
const sessions = new Map()
const id = () => crypto.randomUUID()
app.use(cors({ origin: (origin, callback) => callback(null, !origin || origin === frontend || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)), credentials: true }))
app.use(express.json({ limit:'100kb' }))
app.use(cookieParser())
app.use((req,res,next) => { const sid=req.cookies?.talentflow_session; req.user=sid ? userById.get(sessions.get(sid)) : null; next() })
const auth=(...roles)=>(req,res,next)=>{ if(!req.user)return res.status(401).json({error:'Please sign in.'}); if(roles.length&&!roles.includes(req.user.role))return res.status(403).json({error:'This action is not allowed for your role.'}); next() }
const emailOK=(e)=>typeof e==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())
const startSession=(req,res,user)=>{ const token=id(); sessions.set(token,user.id); res.cookie('talentflow_session',token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:7*864e5}) }
const error=(res,status,message)=>res.status(status).json({error:message})
const resumeUpload=multer({
  storage:multer.diskStorage({destination:privateResumeDir,filename:(_req,file,callback)=>callback(null,`${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)}),
  limits:{fileSize:5*1024*1024,files:1,fields:1,parts:2,fieldSize:100},
  fileFilter:(_req,file,callback)=>{
    const extension=path.extname(file.originalname).toLowerCase()
    const type=file.mimetype.toLowerCase()
    const valid=(extension==='.pdf'&&(type==='application/pdf'||type==='application/octet-stream'))||(extension==='.docx'&&(type==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'||type==='application/octet-stream'))
    callback(valid?null:Object.assign(new Error('Upload a PDF or DOCX resume.'),{status:400}),valid)
  },
})
async function extractResumeText(buffer, extension) {
  if(extension==='.pdf') {
    if(buffer.length<5||buffer.subarray(0,5).toString('ascii')!=='%PDF-')throw Object.assign(new Error('This file is not a valid PDF.'),{status:422})
    const standardFontDataUrl=`${path.resolve(here,'../node_modules/pdfjs-dist/standard_fonts').replaceAll('\\','/')}/`
    const loadingTask=pdfjs.getDocument({data:new Uint8Array(buffer),isEvalSupported:false,useWorkerFetch:false,standardFontDataUrl})
    try {
      const document=await loadingTask.promise
      if(document.numPages>40)throw Object.assign(new Error('Resume PDFs must have 40 pages or fewer.'),{status:422})
      const pages=[]
      for(let pageNumber=1;pageNumber<=document.numPages;pageNumber++){
        const page=await document.getPage(pageNumber)
        const content=await page.getTextContent()
        pages.push(content.items.map((item)=>'str'in item?item.str:'').join(' '))
        if(pages.join(' ').length>500000)throw Object.assign(new Error('Extracted resume text is too long to analyze.'),{status:422})
      }
      return pages.join('\n').trim()
    } finally { await loadingTask.destroy().catch(()=>{}) }
  }
  if(extension==='.docx') {
    if(buffer.length<4||buffer[0]!==0x50||buffer[1]!==0x4b)throw Object.assign(new Error('This file is not a valid DOCX document.'),{status:422})
    const result=await mammoth.extractRawText({buffer})
    const text=result.value.trim()
    if(text.length>500000)throw Object.assign(new Error('Extracted resume text is too long to analyze.'),{status:422})
    return text
  }
  throw Object.assign(new Error('Upload a PDF or DOCX resume.'),{status:400})
}
app.get('/api/health',(req,res)=>res.json({ok:true,database:'sqlite'}))
app.post('/api/auth/register',async(req,res)=>{ const {fullName,email,password,role}=req.body||{}; if(typeof fullName!=='string'||fullName.trim().length<2||fullName.trim().length>100||!emailOK(email)||typeof password!=='string'||password.length<8||password.length>200||!['recruiter','candidate','employee'].includes(role))return error(res,400,'Enter a valid name, email, password (8+ characters), and role.'); const normalized=email.trim().toLowerCase(); if(db.prepare('SELECT id FROM users WHERE email=?').get(normalized))return error(res,409,'An account with this email already exists.'); const uid=id(); db.prepare('INSERT INTO users(id,full_name,email,password_hash,role,profile) VALUES(?,?,?,?,?,?)').run(uid,fullName.trim(),normalized,await bcrypt.hash(password,12),role,JSON.stringify(role==='candidate'?{headline:'',focus:''}:{})); res.status(201).json({user:safeUser(userById.get(uid))}) })
app.post('/api/auth/login',async(req,res)=>{ const {email,password,role}=req.body||{}; if(!emailOK(email)||typeof password!=='string'||!['recruiter','candidate','employee'].includes(role))return error(res,400,'Enter a valid email, password, and role.'); const user=db.prepare('SELECT * FROM users WHERE email=?').get(email.trim().toLowerCase()); if(!user||user.role!==role||!(await bcrypt.compare(password,user.password_hash)))return error(res,401,'Email, password, or portal is incorrect.'); startSession(req,res,user); res.json({user:safeUser(user)}) })
app.get('/api/auth/me',auth(),(req,res)=>res.json({user:safeUser(req.user)}))
app.post('/api/auth/logout',(req,res)=>{ if(req.cookies?.talentflow_session)sessions.delete(req.cookies.talentflow_session);res.clearCookie('talentflow_session',{httpOnly:true,sameSite:'lax'});res.json({ok:true}) })
app.put('/api/users/me',auth(),(req,res)=>{const {fullName,profile}=req.body||{};if(fullName!==undefined&&(typeof fullName!=='string'||fullName.trim().length<2||fullName.length>100))return error(res,400,'Name must be 2 to 100 characters.');const old=JSON.parse(req.user.profile||'{}');const next={...old,...(profile&&typeof profile==='object'?profile:{})};db.prepare('UPDATE users SET full_name=?,profile=? WHERE id=?').run(fullName?.trim()||req.user.full_name,JSON.stringify(next),req.user.id);res.json({user:safeUser(userById.get(req.user.id))})})
const mapJob=(j)=>({id:j.id,recruiterId:j.recruiter_id,title:j.title,company:j.company,team:j.team,location:j.location,country:j.country,state:j.state,city:j.city,workMode:j.work_mode,description:j.description,requiredSkills:JSON.parse(j.required_skills||'[]'),status:j.status,createdAt:j.created_at})
app.get(['/api/jobs','/api/jobs/'],(req,res)=>{const canonicalCity=(value='')=>({bangalore:'bengaluru',bengaluru:'bengaluru',mysore:'mysuru',mysuru:'mysuru',mangalore:'mangaluru',mangaluru:'mangaluru'}[value.trim().toLowerCase()]||value.trim().toLowerCase());let jobs=db.prepare("SELECT * FROM jobs WHERE status='Open' ORDER BY created_at DESC").all().map(mapJob);const {country,state,city,workMode}=req.query;if(country)jobs=jobs.filter((job)=>job.country.toLowerCase()===String(country).trim().toLowerCase());if(state)jobs=jobs.filter((job)=>job.state.toLowerCase()===String(state).trim().toLowerCase());if(city)jobs=jobs.filter((job)=>canonicalCity(job.city)===canonicalCity(String(city)));if(workMode)jobs=jobs.filter((job)=>job.workMode.toLowerCase()===String(workMode).trim().toLowerCase());res.json({jobs})})
app.post('/api/jobs',auth('recruiter'),(req,res)=>{const {title,company,team,location,description,requiredSkills=[],country='India',state='',city='',workMode='Remote'}=req.body||{};if(typeof title!=='string'||title.trim().length<2||title.length>150)return error(res,400,'Job title must be 2 to 150 characters.');if(!Array.isArray(requiredSkills)||requiredSkills.length>30||requiredSkills.some((skill)=>typeof skill!=='string'||!skill.trim()||skill.length>80))return error(res,400,'Required skills must be a list of up to 30 text values.');if([country,state,city].some((value)=>typeof value!=='string'||value.trim().length>100)||!['On-site','Hybrid','Remote'].includes(workMode))return error(res,400,'Enter valid country, state, city, and work mode values.');const normalizedLocation=[city.trim(),state.trim(),country.trim()].filter(Boolean).join(', ')||String(location||'Remote').trim().slice(0,150);const jid=id();db.prepare('INSERT INTO jobs(id,recruiter_id,title,company,team,location,country,state,city,work_mode,description,required_skills) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(jid,req.user.id,title.trim(),String(company||'Talentflow').trim().slice(0,120),String(team||'People').trim().slice(0,100),normalizedLocation,country.trim(),state.trim(),city.trim(),workMode,String(description||'').slice(0,5000),JSON.stringify(requiredSkills.map((skill)=>skill.trim())));res.status(201).json({job:mapJob(db.prepare('SELECT * FROM jobs WHERE id=?').get(jid))})})
app.put('/api/jobs/:id',auth('recruiter'),(req,res)=>{const job=db.prepare('SELECT * FROM jobs WHERE id=?').get(req.params.id);if(!job)return error(res,404,'Job not found.');if(job.recruiter_id!==req.user.id)return error(res,403,'You can only update your own jobs.');const {title,company,team,location,description,status,requiredSkills,country,state,city,workMode}=req.body||{};if(title!==undefined&&(typeof title!=='string'||title.trim().length<2||title.length>150)||company!==undefined&&typeof company!=='string'||team!==undefined&&typeof team!=='string'||location!==undefined&&typeof location!=='string'||description!==undefined&&typeof description!=='string'||[country,state,city].some((value)=>value!==undefined&&(typeof value!=='string'||value.trim().length>100)))return error(res,400,'Job fields must be valid text, and title must be 2 to 150 characters.');if(status!==undefined&&!['Open','Closed','Draft'].includes(status))return error(res,400,'Invalid job status.');if(workMode!==undefined&&!['On-site','Hybrid','Remote'].includes(workMode))return error(res,400,'Invalid work mode.');if(requiredSkills!==undefined&&(!Array.isArray(requiredSkills)||requiredSkills.length>30||requiredSkills.some((skill)=>typeof skill!=='string'||!skill.trim()||skill.length>80)))return error(res,400,'Required skills must be a list of up to 30 text values.');const nextCity=city??job.city,nextState=state??job.state,nextCountry=country??job.country;const nextLocation=[nextCity,nextState,nextCountry].filter(Boolean).join(', ')||location||job.location;db.prepare('UPDATE jobs SET title=?,company=?,team=?,location=?,country=?,state=?,city=?,work_mode=?,description=?,status=?,required_skills=? WHERE id=?').run(title?.trim()||job.title,company??job.company,team??job.team,nextLocation,nextCountry,nextState,nextCity,workMode??job.work_mode,description??job.description,status||job.status,JSON.stringify(requiredSkills??JSON.parse(job.required_skills||'[]')),job.id);res.json({job:mapJob(db.prepare('SELECT * FROM jobs WHERE id=?').get(job.id))})})
app.post('/api/jobs/:id/apply',auth('candidate'),(req,res)=>{if(!db.prepare('SELECT id FROM jobs WHERE id=? AND status=\'Open\'').get(req.params.id))return error(res,404,'Open job not found.');try{const aid=id();db.prepare('INSERT INTO applications(id,job_id,candidate_id) VALUES(?,?,?)').run(aid,req.params.id,req.user.id);res.status(201).json({application:db.prepare('SELECT * FROM applications WHERE id=?').get(aid)})}catch(e){if(e.code==='SQLITE_CONSTRAINT_UNIQUE')return error(res,409,'You have already applied to this job.');throw e}})
app.get('/api/applications/me',auth('candidate'),(req,res)=>res.json({applications:db.prepare('SELECT a.id,a.status,a.created_at,j.id job_id,j.title,j.company,j.location FROM applications a JOIN jobs j ON j.id=a.job_id WHERE a.candidate_id=? ORDER BY a.created_at DESC').all(req.user.id)}))
app.get('/api/recruiter/applications',auth('recruiter'),(req,res)=>res.json({applications:db.prepare('SELECT a.id,a.status,a.created_at,j.id job_id,j.title,u.id candidate_id,u.full_name,u.email FROM applications a JOIN jobs j ON j.id=a.job_id JOIN users u ON u.id=a.candidate_id WHERE j.recruiter_id=? ORDER BY a.created_at DESC').all(req.user.id)}))
app.post('/api/resumes/analyze',auth('candidate'),resumeUpload.single('resume'),async(req,res)=>{
  const file=req.file
  if(!file)return error(res,400,'Choose a PDF or DOCX resume to upload.')
  try {
    if(typeof req.body?.jobId!=='string'||!req.body.jobId.trim())return error(res,400,'Select a job before analyzing your resume.')
    const job=db.prepare("SELECT * FROM jobs WHERE id=? AND status='Open'").get(req.body.jobId.trim())
    if(!job)return error(res,404,'The selected job is not available.')
    const buffer=readFileSync(file.path)
    const extension=path.extname(file.originalname).toLowerCase()
    let resumeText
    try { resumeText=await extractResumeText(buffer,extension) }
    catch(err) { if(err.status)throw err;throw Object.assign(new Error('Could not read this document. Check that it is a valid, unencrypted PDF or DOCX file.'),{status:422}) }
    if(!resumeText)return error(res,422,'No readable text was found. Check that the document contains selectable text and try again.')
    const detected=extractSkills(resumeText)
    const detectedSet=new Set(detected.map(canonicalSkill))
    const requiredSkills=[...new Set(JSON.parse(job.required_skills||'[]').map(canonicalSkill))]
    const matchedRequiredSkills=requiredSkills.filter((skill)=>detectedSet.has(skill))
    const missingRequiredSkills=requiredSkills.filter((skill)=>!detectedSet.has(skill))
    const matchPercentage=requiredSkills.length?Math.round(matchedRequiredSkills.length/requiredSkills.length*100):null
    const report={
      job:{id:job.id,title:job.title,location:job.location,country:job.country,state:job.state,city:job.city,workMode:job.work_mode},
      matchPercentage,
      matchedRequiredSkills,
      missingRequiredSkills,
      additionalRelevantSkills:detected.filter((skill)=>!requiredSkills.includes(canonicalSkill(skill))),
      skillBreakdown:requiredSkills.map((skill)=>({skill,found:detectedSet.has(skill),contribution:requiredSkills.length&&detectedSet.has(skill)?Math.round(100/requiredSkills.length*100)/100:0})),
      explanation:requiredSkills.length?`Estimated skills match = ${matchedRequiredSkills.length} matched required skills / ${requiredSkills.length} total required skills × 100. This checks resume keywords only; it does not verify proficiency or make an employment decision.`:'This job has no required skills, so a percentage cannot be calculated. Add required skills to the job to enable a score. This keyword check does not verify proficiency or make an employment decision.',
      recommendations:missingRequiredSkills.map((skill,index)=>({skill,priority:index+1,topics:recommendationFor(skill).topic,project:recommendationFor(skill).project})),
      analyzedAt:new Date().toISOString(),
    }
    const resumeId=id(),analysisId=id()
    const save=db.transaction(()=>{
      db.prepare('INSERT INTO resume_uploads(id,candidate_id,file_type,file_size,sha256) VALUES(?,?,?,?,?)').run(resumeId,req.user.id,extension.slice(1),file.size,crypto.createHash('sha256').update(buffer).digest('hex'))
      db.prepare('INSERT INTO resume_analyses(id,resume_id,candidate_id,job_id,report_json) VALUES(?,?,?,?,?)').run(analysisId,resumeId,req.user.id,job.id,JSON.stringify(report))
    })
    save()
    res.status(201).json({id:analysisId,...report})
  } catch(err) {
    console.error('Resume analysis failed:',err.message)
    return error(res,err.status||500,err.status?err.message:'Could not save this analysis. Please try again.')
  } finally {
    try{unlinkSync(file.path)}catch{}
  }
})
app.get('/api/resumes/analyses',auth('candidate'),(req,res)=>res.json({analyses:db.prepare('SELECT a.id,a.job_id,j.title AS job_title,a.created_at,a.report_json FROM resume_analyses a JOIN jobs j ON j.id=a.job_id WHERE a.candidate_id=? ORDER BY a.created_at DESC').all(req.user.id).map((row)=>({id:row.id,jobId:row.job_id,jobTitle:row.job_title,createdAt:row.created_at,report:JSON.parse(row.report_json)}))}))
app.get('/api/resumes/analyses/:id',auth('candidate'),(req,res)=>{const row=db.prepare('SELECT id,job_id,created_at,report_json FROM resume_analyses WHERE id=? AND candidate_id=?').get(req.params.id,req.user.id);if(!row)return error(res,404,'Analysis not found.');res.json({id:row.id,jobId:row.job_id,createdAt:row.created_at,...JSON.parse(row.report_json)})})
app.delete('/api/resumes/analyses/:id',auth('candidate'),(req,res)=>{const existing=db.prepare('SELECT resume_id FROM resume_analyses WHERE id=? AND candidate_id=?').get(req.params.id,req.user.id);if(!existing)return error(res,404,'Analysis not found.');const remove=db.transaction(()=>{db.prepare('DELETE FROM resume_analyses WHERE id=? AND candidate_id=?').run(req.params.id,req.user.id);db.prepare('DELETE FROM resume_uploads WHERE id=?').run(existing.resume_id)});remove();res.json({ok:true})})
app.use((err,req,res,_next)=>{if(err instanceof multer.MulterError){const status=err.code==='LIMIT_FILE_SIZE'?413:400;return error(res,status,err.code==='LIMIT_FILE_SIZE'?'Resume must be 5 MB or smaller.':'Upload one PDF or DOCX resume.')}console.error(err);const status=err.status||(err instanceof SyntaxError?400:500);res.status(status).json({error:status<500?err.message:'Something went wrong. Please try again.'})})
app.listen(port,()=>console.log(`Talentflow API listening at http://localhost:${port}`))
