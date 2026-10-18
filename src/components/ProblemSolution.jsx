import { ArrowRight, Layers, Puzzle, Clock3, Eye, Check } from 'lucide-react';
const items = [
 [Layers, 'Hammaga bir xil ta’lim usuli', 'Har bir o‘quvchiga darajasi va tezligiga mos ta’lim yo‘li.'],
 [Puzzle, 'Tushunilmagan mavzular yig‘iladi', 'Qiyin mavzuni aniqlash, sodda misollar bilan takrorlash.'],
 [Clock3, 'O‘qituvchining vaqti cheklangan', 'Natijalar tahlili yordamida e’tiborni zarur mavzularga qaratish.'],
 [Eye, 'Ota-onada aniq ma’lumot kam', 'Rivojlanish va qiyinchiliklar haqida tushunarli hisobot.'],
];
export default function ProblemSolution() { return <section className="section" id="yechim"><div className="container"><div className="section-heading"><span className="eyebrow">MUAMMODAN — IMKONIYATGA</span><h2>Bir xil dars. <span>Turli ehtiyojlar.</span></h2><p>Har kim turlicha o‘rganadi. Ta’lim ham shunga mos bo‘lishi kerak.</p></div><div className="problem-grid">{items.map(([Icon,title,solution]) => <article className="problem-card" key={title}><Icon className="muted" size={23}/><h3>{title}</h3><div className="solution-divider"><ArrowRight size={17}/><span>BILIM AI taklifi</span></div><p><Check size={16}/>{solution}</p></article>)}</div><p className="section-footnote">Shaxsiy ta’lim yo‘li va hisobotlar — rejalashtirilgan imkoniyatlar. Quyida test demosini sinab ko‘ring.</p></div></section>; }
