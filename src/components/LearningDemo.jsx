import { useRef, useState } from 'react';
import { ArrowRight, RotateCcw, Check, X, Trophy, History, ShieldCheck, ChevronDown } from 'lucide-react';
const questions = [
 { topic:'Kasrlar', text:'½ + ¼ ning qiymati nechaga teng?', options:['²⁄₆','¾','½','1'], correct:1, explanation:'½ ni ²⁄₄ ko‘rinishida yozamiz. Maxrajlar bir xil bo‘lgani uchun suratlarni qo‘shamiz: ²⁄₄ + ¼ = ¾.' },
 { topic:'Foizlar', text:'200 ning 15 foizi nechaga teng?', options:['15','20','30','35'], correct:2, explanation:'15% — yuzdan 15 qism. 200 × 15 ÷ 100 = 30.' },
 { topic:'Tenglamalar', text:'3x + 6 = 21 bo‘lsa, x nechaga teng?', options:['3','5','7','9'], correct:1, explanation:'Ikki tomondan 6 ni ayiramiz: 3x = 15. So‘ng ikki tomonni 3 ga bo‘lamiz: x = 5.' },
 { topic:'Kasrlar', text:'18 ning ⅔ qismi nechaga teng?', options:['6','9','12','15'], correct:2, explanation:'Avval 18 ni maxrajga bo‘lamiz: 18 ÷ 3 = 6. Keyin suratga ko‘paytiramiz: 6 × 2 = 12.' },
 { topic:'Foizlar', text:'80 000 so‘mlik kitobga 25% chegirma berildi. Yangi narx qancha?', options:['20 000 so‘m','55 000 so‘m','60 000 so‘m','75 000 so‘m'], correct:2, explanation:'Chegirma: 80 000 × 25 ÷ 100 = 20 000 so‘m. Yangi narx: 80 000 − 20 000 = 60 000 so‘m.' },
];
const practice = {
 'Kasrlar':[{text:'⅓ + ⅙ = ?',answer:'½. ⅓ = ²⁄₆, shuning uchun ²⁄₆ + ⅙ = ³⁄₆ = ½.'},{text:'20 ning ¾ qismi nechaga teng?',answer:'15. 20 ÷ 4 × 3 = 15.'}],
 'Foizlar':[{text:'300 ning 10 foizi nechaga teng?',answer:'30. 300 × 10 ÷ 100 = 30.'},{text:'40 000 so‘mga 20% chegirma bo‘lsa, yangi narx qancha?',answer:'32 000 so‘m. 40 000 − 8 000 = 32 000.'}],
 'Tenglamalar':[{text:'2x + 4 = 16. x = ?',answer:'6. 2x = 12, demak x = 6.'},{text:'5x − 10 = 15. x = ?',answer:'5. 5x = 25, demak x = 5.'}],
};
const KEY = 'bilim-ai-attempts-v1';
function readHistory() { try { const data = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(data) ? data.filter(a => a && typeof a.id === 'string' && Number.isInteger(a.score) && a.score >= 0 && a.score <= 5 && typeof a.date === 'string' && !Number.isNaN(Date.parse(a.date))).slice(0,10) : []; } catch { return []; } }
export default function LearningDemo() {
 const [answers,setAnswers] = useState([]);
 const [index,setIndex] = useState(0);
 const [finished,setFinished] = useState(false);
 const [history,setHistory] = useState(readHistory);
 const [storageMessage,setStorageMessage] = useState('');
 const focusRef = useRef(null);
 const question = questions[index];
 const score = questions.reduce((sum,q,i) => sum + Number(answers[i] === q.correct),0);
 const mistakes = questions.filter((q,i) => answers[i] !== q.correct);
 const topics = [...new Set(mistakes.map(q => q.topic))];
 function moveFocus() { requestAnimationFrame(() => focusRef.current?.focus()); }
 function next() {
  if (answers[index] === undefined) return;
  if (index < 4) { setIndex(index+1); moveFocus(); return; }
  const attempt = { id:crypto.randomUUID(), date:new Date().toISOString(), score };
  const updated = [attempt,...history].slice(0,10);
  setHistory(updated); setFinished(true);
  try { localStorage.setItem(KEY,JSON.stringify(updated)); setStorageMessage('Natija shu brauzerda saqlandi.'); } catch { setStorageMessage('Brauzer xotirasi mavjud emas. Natija faqat sahifa ochiq turguncha saqlanadi.'); }
  moveFocus();
 }
 function restart() { setAnswers([]); setIndex(0); setFinished(false); setStorageMessage(''); moveFocus(); }
 return <section id="sinov" className="section demo-section"><div className="container"><div className="section-heading"><span className="eyebrow">BIRINCHI QADAMNI HOZIR TASHLANG</span><h2>Bilimingizni <span>sinab ko‘ring</span></h2><p>5 ta savol. O‘zingiz haqingizda yangi bilim.</p></div><div className="demo-layout"><div className="quiz-card"><div className="demo-label"><span className="status-dot"/> Demo: tayyor qoidalar asosidagi tahlil</div>{!finished ? <><div className="quiz-meta"><span>MATEMATIKA</span><span>{index+1} / 5 savol</span></div><div className="progress-track quiz-progress"><span style={{width:`${(index+1)*20}%`}}/></div><span className="topic-label">{question.topic}</span><h3 tabIndex={-1} ref={focusRef} className="question-title">{question.text}</h3><fieldset className="options"><legend className="sr-only">Bitta javobni tanlang</legend>{question.options.map((option,i) => <label className={'option '+(answers[index] === i ? 'selected' : '')} key={option}><input type="radio" name={`question-${index}`} checked={answers[index] === i} onChange={() => setAnswers(previous => {const updated = [...previous]; updated[index]=i; return updated;})}/><span className="option-letter">{['A','B','C','D'][i]}</span><span>{option}</span>{answers[index] === i && <Check size={18} className="option-check"/>}</label>)}</fieldset><div className="quiz-footer"><span>Faqat bitta javobni tanlang</span><button className="button" disabled={answers[index] === undefined} onClick={next}>{index === 4 ? 'Natijani ko‘rish' : 'Keyingi savol'}<ArrowRight size={17}/></button></div></> : <div className="results"><div className="result-heading"><span className="trophy"><Trophy size={30}/></span><h3 tabIndex={-1} ref={focusRef}>Urinish yakunlandi!</h3><p>Har bir urinish — o‘rganish uchun imkoniyat.</p></div><div className="result-stats"><div><strong>{score*20}%</strong><span>Umumiy ball</span></div><div><strong>{score}</strong><span>To‘g‘ri javob</span></div><div><strong>{5-score}</strong><span>Noto‘g‘ri javob</span></div></div><p className="storage-note" role="status">{storageMessage}</p>{mistakes.length > 0 ? <><h4>Xatolarni birga ko‘rib chiqamiz</h4><p className="muted">Bu mavzularni takrorlash foydali bo‘lishi mumkin. Bir javob xatoning sababini aniq ko‘rsatmaydi.</p>{questions.map((q,i) => answers[i] !== q.correct && <article className="mistake" key={q.text}><span className="topic-label">{q.topic}</span><h4>{i+1}. {q.text}</h4><p className="wrong-answer"><X size={15}/> Sizning javobingiz: {q.options[answers[i]]}</p><p className="right-answer"><Check size={15}/> To‘g‘ri javob: {q.options[q.correct]}</p><p>{q.explanation}</p></article>)}<h4 className="practice-title">Mustahkamlash uchun mashqlar</h4>{topics.map(topic => <div className="practice-group" key={topic}><h5>{topic}</h5>{practice[topic].map(item => <details key={item.text}><summary>{item.text}<ChevronDown size={16}/></summary><p>{item.answer}</p></details>)}</div>)}</> : <div className="perfect"><Check size={21}/><p>Barcha javoblar to‘g‘ri! Mustahkamlash uchun: 4x + 8 = 32.</p><details><summary>Javobni ko‘rish</summary><p>x = 6. Avval 8 ni ayiramiz, keyin 4 ga bo‘lamiz.</p></details></div>}<button className="button restart" onClick={restart}><RotateCcw size={17}/>Qayta boshlash</button></div>}</div><aside className="demo-aside"><div className="aside-note"><span className="feature-icon"><ShieldCheck size={24}/></span><h3>Bilimni tushunishdan boshlang</h3><p>Bu demo javoblaringizni oldindan yozilgan qoidalar bilan tekshiradi. Haqiqiy AI ulanmagan.</p><ul><li><Check size={16}/> Kasrlar, foizlar va tenglamalar</li><li><Check size={16}/> Har bir xatoga sodda izoh</li><li><Check size={16}/> Mavzuga mos qo‘shimcha mashqlar</li></ul><span className="privacy-note">Natijalar faqat shu brauzerda saqlanadi. Serverga yuborilmaydi. Eng so‘nggi 10 ta urinish ko‘rsatiladi.</span></div><div className="history-card"><h3><History size={19}/>Avvalgi urinishlar</h3>{history.length === 0 ? <p className="muted">Hali urinishlar yo‘q. Birinchi testingizni yakunlang!</p> : <ol>{history.map(attempt => <li key={attempt.id}><div><strong>{attempt.score} / 5 to‘g‘ri</strong><small>{new Intl.DateTimeFormat('uz-UZ',{dateStyle:'short',timeStyle:'short'}).format(new Date(attempt.date))}</small></div><span>{attempt.score*20}%</span></li>)}</ol>}</div></aside></div></div></section>;
}
