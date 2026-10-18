import { ArrowUpRight, Coins, LoaderCircle, LockKeyhole } from 'lucide-react';
export function PageTitle({eyebrow,title,description,children}){return <div className="page-title"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{children}</div>}
export function Empty({title='Hozircha ma’lumot yo‘q',children}){return <div className="empty-state"><span>✦</span><h3>{title}</h3><p>{children}</p></div>}
export function Loading(){return <div className="loading-state" role="status"><LoaderCircle className="animate-spin"/>Ma’lumotlar yuklanmoqda…</div>}
export function ErrorBox({error,retry}){return <div className="error-box" role="alert">{error}{retry&&<button onClick={retry}>Qayta urinish</button>}</div>}
export function Token({value}){return <span className="token"><Coins size={15}/>{new Intl.NumberFormat('uz-UZ').format(value||0)}</span>}
export function RoleGate({role,onSwitch}){return <div className="role-gate"><span><LockKeyhole size={30}/></span><h2>{role} uchun alohida kabinet</h2><p>Shaxsiy ma’lumotlar himoyalangan. Bu sahifadan foydalanish uchun tegishli hisobga kiring.</p><button className="btn primary" onClick={onSwitch}>Hisobni almashtirish<ArrowUpRight size={16}/></button></div>}
