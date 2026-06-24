import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

const API = {
  invite:   'https://functions.poehali.dev/ee2985a0-952f-4623-bf65-928c7a501a52',
  register: 'https://functions.poehali.dev/3ebebc3b-093a-436a-811b-993a2419f278',
  contacts: 'https://functions.poehali.dev/ab2b7912-6900-46eb-8256-042b9e377d8c',
  ai:       'https://functions.poehali.dev/11e2ef7f-d69d-4e18-9485-ab2b1e71183d',
};

const EMOJIS = ['😀','😂','🥰','😎','👍','👌','🔥','💯','🎉','❤️','👏','🙏','💪','✅','📎','📝','📊','🤝','💼','⚡'];

type Theme = 'dark' | 'light';
type Chat = { id: number; name: string; handle: string; last: string; time: string; unread: number; online: boolean; group?: boolean; phone?: string; };
type Message = { id: number; text: string; time: string; mine: boolean; type?: 'text'|'image'|'ai'; img?: string; };
type Contact = { name: string; nick: string; phone: string; };
type AiMsg = { role: 'user'|'assistant'; content: string; };

const DEMO_MESSAGES: Message[] = [
  { id: 1, text: 'Добрый день! Подготовил коммерческое предложение.', time: '14:20', mine: false },
  { id: 2, text: 'Отлично, жду документы на почту.', time: '14:25', mine: true },
  { id: 3, text: 'Уточните — согласование во вторник удобно?', time: '14:28', mine: false },
  { id: 4, text: 'Да, вторник подходит. Договор пришлю к 15:00.', time: '14:32', mine: false },
  { id: 5, text: 'Принято, буду ждать. 👍', time: '14:33', mine: true },
];

const NAV = [
  { key: 'chats', icon: 'MessageSquare', label: 'Чаты' },
  { key: 'calls', icon: 'Phone', label: 'Звонки' },
  { key: 'contacts', icon: 'Users', label: 'Контакты' },
  { key: 'notifications', icon: 'Bell', label: 'Уведомления' },
  { key: 'settings', icon: 'Settings', label: 'Настройки' },
];

const CALLS = [
  { name: 'Дмитрий Орлов', phone: '+79001234567', type: 'out', time: 'Сегодня, 11:48', dur: '12 мин' },
  { name: 'Анна Соколова', phone: '+79009876543', type: 'in', time: 'Сегодня, 09:15', dur: '4 мин' },
  { name: 'Отдел продаж', phone: '+74951234567', type: 'missed', time: 'Вчера, 18:02', dur: 'Пропущенный' },
  { name: 'Елена Власова', phone: '+79161234567', type: 'in', time: 'Вчера, 14:30', dur: '23 мин' },
];

const NOTIFS = [
  { icon: 'MessageSquare', color: 'text-blue-400', bg: 'bg-blue-400/10', title: 'Новое сообщение', text: 'Анна Соколова: «Договор готов»', time: '5 мин' },
  { icon: 'UserPlus', color: 'text-green-400', bg: 'bg-green-400/10', title: 'Новый контакт', text: 'Дмитрий Орлов добавил вас', time: '1 ч' },
  { icon: 'PhoneMissed', color: 'text-red-400', bg: 'bg-red-400/10', title: 'Пропущенный звонок', text: 'Отдел продаж · вчера 18:02', time: 'Вчера' },
];

const avatarColor = (name: string) => {
  const colors = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-cyan-500'];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
};

const formatPhone = (val: string) => {
  const d = val.replace(/\D/g, '').slice(0, 11);
  if (!d) return '';
  let r = '+7';
  if (d.length > 1) r += ' (' + d.slice(1, 4);
  if (d.length >= 4) r += ') ' + d.slice(4, 7);
  if (d.length >= 7) r += '-' + d.slice(7, 9);
  if (d.length >= 9) r += '-' + d.slice(9, 11);
  return r;
};

export default function Index() {
  // тема
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('prime_theme') as Theme) || 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('prime_theme', theme);
  }, [theme]);

  // онбординг
  const [onboarded, setOnboarded] = useState(() => !!localStorage.getItem('prime_nick'));
  const [step, setStep] = useState(1);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [nickInput, setNickInput] = useState('');
  const [myName, setMyName] = useState(() => localStorage.getItem('prime_name') || '');
  const [myNick, setMyNick] = useState(() => localStorage.getItem('prime_nick') || '');

  // главный экран
  const [active, setActive] = useState('chats');
  const [chats] = useState<Chat[]>([]);
  const [selected, setSelected] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  // AI чатбот
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiHistory, setAiHistory] = useState<AiMsg[]>([]);
  const [aiThinking, setAiThinking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, aiHistory]);

  const initials = myName ? myName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const now = () => new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });

  // онбординг
  const handleOnboard = async () => {
    if (step === 1 && nameInput.trim()) { setStep(2); return; }
    if (step === 2 && phoneInput.replace(/\D/g, '').length >= 11) { setStep(3); return; }
    if (step === 3 && nickInput.trim()) {
      const nick = nickInput.startsWith('@') ? nickInput : '@' + nickInput;
      try {
        await fetch(API.register, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nameInput.trim(), nick, phone: phoneInput }),
        });
      } catch (e) { console.error(e); }
      localStorage.setItem('prime_nick', nick);
      localStorage.setItem('prime_name', nameInput.trim());
      localStorage.setItem('prime_phone', phoneInput);
      setMyNick(nick); setMyName(nameInput.trim()); setOnboarded(true);
    }
  };

  // импорт контактов
  const importPhoneContacts = async () => {
    if (!('contacts' in navigator && 'ContactsManager' in window)) {
      setImportResult('Используйте Chrome на Android для импорта контактов.');
      setTimeout(() => setImportResult(''), 4000);
      return;
    }
    setImporting(true);
    try {
      // @ts-expect-error Contact Picker API
      const result = await navigator.contacts.select(['name', 'tel'], { multiple: true });
      const imported: Contact[] = (result as { name: string[]; tel: string[] }[])
        .filter(c => c.name?.[0] && c.tel?.[0])
        .map(c => ({ name: c.name[0], nick: '', phone: c.tel[0] }));
      setContacts(prev => {
        const ex = new Set(prev.map(c => c.phone));
        return [...prev, ...imported.filter(c => !ex.has(c.phone))];
      });
      setImportResult(`Импортировано: ${imported.length}`);
    } catch (_) { setImportResult('Отменено.'); }
    setImporting(false);
    setTimeout(() => setImportResult(''), 3000);
  };

  // отправка сообщения
  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    const t = now();
    setMessages(m => [...m, { id: Date.now(), text, time: t, mine: true }]);
    setDraft('');
    setShowEmoji(false);

    // если включён AI — отправляем в ПРАВИМ
    if (aiEnabled) {
      const newHistory: AiMsg[] = [...aiHistory, { role: 'user', content: text }];
      setAiHistory(newHistory);
      setAiThinking(true);
      try {
        const res = await fetch(API.ai, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newHistory }),
        });
        const data = await res.json();
        const reply = data.reply || 'Не могу ответить сейчас.';
        setMessages(m => [...m, { id: Date.now() + 1, text: reply, time: now(), mine: false, type: 'ai' }]);
        setAiHistory(h => [...h, { role: 'assistant', content: reply }]);
      } catch (_) {
        setMessages(m => [...m, { id: Date.now() + 1, text: '⚠️ ПРАВИМ недоступен.', time: now(), mine: false, type: 'ai' }]);
      }
      setAiThinking(false);
    }
  };

  // отправка фото
  const sendPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setMessages(m => [...m, { id: Date.now(), text: '', time: now(), mine: true, type: 'image', img: ev.target?.result as string }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const filtered = chats.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.handle.toLowerCase().includes(search.toLowerCase())
  );
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  // ─── ОНБОРДИНГ ───────────────────────────────────────────────
  if (!onboarded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background font-sans overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(180,140,40,0.18),transparent)]" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_80px,rgba(180,140,40,0.025)_80px,rgba(180,140,40,0.025)_81px)]" />
        <div className="relative z-10 w-full max-w-[380px] px-6 animate-fade-in">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-[#F0C84E] to-[#9A7118] flex items-center justify-center shadow-2xl shadow-primary/40 mb-4">
              <Icon name="Gem" size={38} className="text-[#2a1f00]" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-[0.2em] text-primary uppercase">Prime</h1>
            <p className="text-sm text-muted-foreground mt-1 tracking-wide">Деловой мессенджер</p>
          </div>

          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="mb-2"><p className="text-xl font-semibold">Как вас зовут?</p>
                <p className="text-sm text-muted-foreground mt-1">Имя и фамилию увидят ваши контакты</p></div>
              <Input autoFocus value={nameInput} onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleOnboard()}
                placeholder="Иван Петров" className="bg-secondary border-none h-12 text-base rounded-xl" />
              <Button onClick={handleOnboard} disabled={!nameInput.trim()}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-base">
                Продолжить <Icon name="ArrowRight" size={18} className="ml-2" />
              </Button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="mb-2"><p className="text-xl font-semibold">Номер телефона</p>
                <p className="text-sm text-muted-foreground mt-1">Для входа и восстановления доступа</p></div>
              <div className="relative">
                <Icon name="Phone" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input autoFocus value={phoneInput} onChange={e => setPhoneInput(formatPhone(e.target.value))}
                  onKeyDown={e => e.key === 'Enter' && handleOnboard()}
                  placeholder="+7 (___) ___-__-__" className="bg-secondary border-none h-12 text-base pl-10 rounded-xl" />
              </div>
              <Button onClick={handleOnboard} disabled={phoneInput.replace(/\D/g,'').length < 11}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-base">
                Продолжить <Icon name="ArrowRight" size={18} className="ml-2" />
              </Button>
              <button onClick={() => setStep(1)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center">← Назад</button>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="mb-2"><p className="text-xl font-semibold">Ваш ник</p>
                <p className="text-sm text-muted-foreground mt-1">По нику вас найдут в Prime</p></div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary font-bold text-base">@</span>
                <Input autoFocus value={nickInput.replace('@','')} onChange={e => setNickInput(e.target.value.replace('@',''))}
                  onKeyDown={e => e.key === 'Enter' && handleOnboard()}
                  placeholder="username" className="bg-secondary border-none h-12 text-base pl-8 rounded-xl" />
              </div>
              <Button onClick={handleOnboard} disabled={!nickInput.trim()}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-base">
                Войти в Prime <Icon name="Gem" size={17} className="ml-2" />
              </Button>
              <button onClick={() => setStep(2)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center">← Назад</button>
            </div>
          )}
          <div className="flex justify-center gap-2 mt-8">
            {[1,2,3].map(s => (
              <span key={s} className={`h-1 rounded-full transition-all duration-300 ${step === s ? 'w-8 bg-primary' : step > s ? 'w-4 bg-primary/50' : 'w-4 bg-secondary'}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── ГЛАВНЫЙ ЭКРАН ────────────────────────────────────────────
  return (
    <div className="h-screen w-full flex bg-background text-foreground font-sans overflow-hidden">

      {/* ── Боковая навигация ── */}
      <aside className="w-[68px] shrink-0 flex flex-col items-center py-4 gap-1 bg-card border-r border-border/60">
        <div className="flex flex-col items-center mb-4 select-none">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#F0C84E] to-[#9A7118] flex items-center justify-center shadow-lg shadow-primary/30">
            <Icon name="Gem" size={19} className="text-[#2a1f00]" />
          </div>
          <span className="text-[9px] font-display font-bold tracking-[0.18em] text-primary mt-1 uppercase">Prime</span>
        </div>

        {NAV.map(item => (
          <div key={item.key} className="relative group w-full flex justify-center">
            <button onClick={() => setActive(item.key)}
              className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                active === item.key ? 'bg-primary/20 text-primary' : 'text-muted-foreground/60 hover:bg-secondary hover:text-foreground'
              }`}>
              <Icon name={item.icon} size={20} />
              {active === item.key && <span className="absolute -left-[3px] w-[3px] h-5 rounded-r-full bg-primary" />}
            </button>
            <div className="pointer-events-none absolute left-[58px] top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <div className="bg-card border border-border text-sm px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl text-foreground">
                {item.label}
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-card" />
              </div>
            </div>
          </div>
        ))}

        {/* Переключатель темы */}
        <div className="relative group w-full flex justify-center mt-1">
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-muted-foreground/60 hover:bg-secondary hover:text-foreground transition-all">
            <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={20} />
          </button>
          <div className="pointer-events-none absolute left-[58px] top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <div className="bg-card border border-border text-sm px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl text-foreground">
              {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-card" />
            </div>
          </div>
        </div>

        {/* AI кнопка */}
        <div className="relative group w-full flex justify-center">
          <button onClick={() => { setAiEnabled(a => !a); if (!aiEnabled) setSelected(null); setActive('chats'); }}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              aiEnabled ? 'bg-primary/20 text-primary' : 'text-muted-foreground/60 hover:bg-secondary hover:text-foreground'
            }`}>
            <Icon name="Bot" size={20} />
            {aiEnabled && <span className="absolute -left-[3px] w-[3px] h-5 rounded-r-full bg-primary" />}
          </button>
          <div className="pointer-events-none absolute left-[58px] top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <div className="bg-card border border-border text-sm px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl text-foreground">
              {aiEnabled ? 'ПРАВИМ включён' : 'Включить ПРАВИМ'}
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-card" />
            </div>
          </div>
        </div>

        <div className="mt-auto group relative flex justify-center">
          <Avatar className="w-9 h-9 border-2 border-primary/40 cursor-pointer">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="pointer-events-none absolute left-[46px] bottom-0 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-card border border-border px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
              <div className="font-semibold text-sm">{myName}</div>
              <div className="text-xs text-muted-foreground">{myNick}</div>
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-card" />
            </div>
          </div>
        </div>
      </aside>

      {/* ── Панель списка ── */}
      <section className="w-[320px] shrink-0 flex flex-col bg-card/50 border-r border-border/60">
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[17px] font-display font-bold">{NAV.find(n => n.key === active)?.label}</h2>
            <div className="flex gap-1">
              {active === 'chats' && <AddContactDialog myNick={myNick} />}
              {active === 'contacts' && (
                <Button size="icon" variant="ghost" onClick={importPhoneContacts} disabled={importing}
                  className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <Icon name={importing ? 'Loader' : 'BookUser'} size={18} className={importing ? 'animate-spin' : ''} />
                </Button>
              )}
            </div>
          </div>
          {(active === 'chats' || active === 'contacts') && (
            <div className="relative">
              <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Поиск" className="pl-9 bg-secondary/80 border-none h-9 text-sm rounded-xl" />
            </div>
          )}
          {importResult && <p className="text-xs text-primary mt-2 text-center animate-fade-in">{importResult}</p>}
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">

          {/* Чаты */}
          {active === 'chats' && (
            filtered.length === 0
              ? <EmptyState icon="MessageSquare" text="Нет чатов. Добавьте контакт, чтобы начать." />
              : filtered.map(chat => (
                <button key={chat.id} onClick={() => setSelected(chat)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all ${
                    selected?.id === chat.id ? 'bg-primary/12' : 'hover:bg-secondary/60'
                  }`}>
                  <div className="relative shrink-0">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className={`${avatarColor(chat.name)} text-white font-semibold text-sm`}>
                        {chat.name.split(' ').map(w=>w[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {chat.online && <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-card" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[14px] truncate">{chat.name}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0 ml-2">{chat.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[13px] text-muted-foreground truncate">{chat.last}</span>
                      {chat.unread > 0 && (
                        <span className="shrink-0 ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
          )}

          {/* Контакты */}
          {active === 'contacts' && (
            filteredContacts.length === 0
              ? (
                <div className="px-2 space-y-3">
                  <EmptyState icon="Users" text="Контактов пока нет." />
                  <Button onClick={importPhoneContacts} disabled={importing}
                    className="w-full h-11 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 rounded-xl font-semibold">
                    <Icon name={importing ? 'Loader' : 'BookUser'} size={18} className={`mr-2 ${importing ? 'animate-spin' : ''}`} />
                    Импорт из телефонной книги
                  </Button>
                </div>
              )
              : filteredContacts.map((c, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-secondary/60 transition-colors">
                  <Avatar className="w-11 h-11 shrink-0">
                    <AvatarFallback className={`${avatarColor(c.name)} text-white font-semibold text-sm`}>
                      {c.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14px] truncate">{c.name}</div>
                    <div className="text-[12px] text-muted-foreground truncate">{c.phone}</div>
                  </div>
                  <a href={`tel:${c.phone.replace(/\D/g,'')}`}>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0">
                      <Icon name="Phone" size={16} />
                    </Button>
                  </a>
                </div>
              ))
          )}

          {/* Звонки */}
          {active === 'calls' && CALLS.map((call, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-secondary/60 transition-colors">
              <Avatar className="w-11 h-11 shrink-0">
                <AvatarFallback className={`${avatarColor(call.name)} text-white font-semibold text-sm`}>
                  {call.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[14px] truncate">{call.name}</div>
                <div className={`text-[12px] flex items-center gap-1.5 mt-0.5 ${call.type === 'missed' ? 'text-red-400' : 'text-muted-foreground'}`}>
                  <Icon name={call.type==='in'?'PhoneIncoming':call.type==='out'?'PhoneOutgoing':'PhoneMissed'} size={12} />
                  <span>{call.time} · {call.dur}</span>
                </div>
              </div>
              <a href={`tel:${call.phone.replace(/\D/g,'')}`}>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/10 shrink-0">
                  <Icon name="Phone" size={16} />
                </Button>
              </a>
            </div>
          ))}

          {/* Уведомления */}
          {active === 'notifications' && (
            <div className="space-y-2 px-1 pt-1">
              {NOTIFS.map((n, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-2xl bg-secondary/40 hover:bg-secondary/70 transition-colors cursor-pointer">
                  <div className={`w-10 h-10 rounded-xl ${n.bg} ${n.color} flex items-center justify-center shrink-0`}>
                    <Icon name={n.icon} size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[13px]">{n.title}</span>
                      <span className="text-[11px] text-muted-foreground">{n.time}</span>
                    </div>
                    <div className="text-[12px] text-muted-foreground truncate mt-0.5">{n.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Настройки */}
          {active === 'settings' && (
            <div className="px-1 pt-1 space-y-0.5">
              {[
                { icon:'Bell', label:'Уведомления', toggle:true, on:true },
                { icon:'ShieldCheck', label:'Сквозное шифрование', toggle:true, on:true },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-secondary/60 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 text-muted-foreground">
                    <Icon name={s.icon} size={17} />
                  </div>
                  <span className="flex-1 text-[14px] font-medium">{s.label}</span>
                  <Switch defaultChecked={s.on} />
                </div>
              ))}
              <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-secondary/60 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 text-muted-foreground">
                  <Icon name={theme==='dark'?'Moon':'Sun'} size={17} />
                </div>
                <span className="flex-1 text-[14px] font-medium">Тёмная тема</span>
                <Switch checked={theme==='dark'} onCheckedChange={v => setTheme(v ? 'dark' : 'light')} />
              </div>
              <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-secondary/60 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 text-primary">
                  <Icon name="Bot" size={17} />
                </div>
                <div className="flex-1">
                  <span className="text-[14px] font-medium">ПРАВИМ AI</span>
                  <div className="text-[11px] text-muted-foreground">Умный ассистент</div>
                </div>
                <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
              </div>
              {[
                { icon:'Lock', label:'Конфиденциальность' },
                { icon:'Database', label:'Данные и память' },
                { icon:'CircleHelp', label:'Помощь' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-secondary/60 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 text-muted-foreground">
                    <Icon name={s.icon} size={17} />
                  </div>
                  <span className="flex-1 text-[14px] font-medium">{s.label}</span>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                </div>
              ))}
              <div className="pt-3 px-3">
                <button onClick={() => { localStorage.clear(); setOnboarded(false); setMyName(''); setMyNick(''); setStep(1); setNameInput(''); setPhoneInput(''); setNickInput(''); }}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Выйти из аккаунта
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Чат / AI / заглушка ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-background">

        {/* AI режим */}
        {aiEnabled ? (
          <>
            <header className="h-[60px] shrink-0 flex items-center gap-3 px-5 border-b border-border/60 bg-card/40">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F0C84E] to-[#9A7118] flex items-center justify-center shadow-md">
                <Icon name="Bot" size={20} className="text-[#2a1f00]" />
              </div>
              <div>
                <div className="font-semibold text-[15px]">ПРАВИМ</div>
                <div className="text-[12px] text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  AI-ассистент · всегда онлайн
                </div>
              </div>
              <div className="ml-auto">
                <Button size="sm" variant="ghost" onClick={() => { setAiHistory([]); setMessages([]); }}
                  className="text-muted-foreground hover:text-foreground text-xs">
                  <Icon name="RotateCcw" size={14} className="mr-1" /> Очистить
                </Button>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F0C84E]/20 to-[#9A7118]/10 flex items-center justify-center mb-4 border border-primary/15">
                    <Icon name="Bot" size={30} className="text-primary/60" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-1">ПРАВИМ готов к работе</h3>
                  <p className="text-[13px] text-muted-foreground max-w-xs">Задайте любой вопрос — составьте письмо, проанализируйте текст или просто пообщайтесь.</p>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  {!msg.mine && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F0C84E] to-[#9A7118] flex items-center justify-center mr-2 mt-1 shrink-0">
                      <Icon name="Bot" size={14} className="text-[#2a1f00]" />
                    </div>
                  )}
                  <div className={`max-w-[65%] px-3.5 py-2.5 text-[14px] leading-relaxed rounded-[18px] ${
                    msg.mine ? 'bg-primary text-primary-foreground rounded-br-[5px]' : 'bg-card border border-border/60 rounded-bl-[5px]'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <div className={`text-[10px] mt-1 ${msg.mine ? 'text-primary-foreground/60' : 'text-muted-foreground'} text-right`}>{msg.time}</div>
                  </div>
                </div>
              ))}
              {aiThinking && (
                <div className="flex items-end gap-2 animate-fade-in">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F0C84E] to-[#9A7118] flex items-center justify-center shrink-0">
                    <Icon name="Bot" size={14} className="text-[#2a1f00]" />
                  </div>
                  <div className="bg-card border border-border/60 rounded-[18px] rounded-bl-[5px] px-4 py-3 flex gap-1 items-center">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="shrink-0 px-4 py-3 border-t border-border/60 bg-card/40">
              <div className="flex items-center gap-2 bg-secondary/80 rounded-2xl px-2 py-1">
                <input value={draft} onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (send(), e.preventDefault())}
                  placeholder="Спросите ПРАВИМ…"
                  className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground py-2.5 text-foreground" />
                <button onClick={send}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    draft.trim() ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground/40'
                  }`}>
                  <Icon name="Send" size={17} />
                </button>
              </div>
            </div>
          </>
        ) : selected ? (
          <>
            {/* Шапка чата */}
            <header className="h-[60px] shrink-0 flex items-center justify-between px-5 border-b border-border/60 bg-card/40">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className={`${avatarColor(selected.name)} text-white font-semibold text-sm`}>
                      {selected.name.split(' ').map(w=>w[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {selected.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-card" />}
                </div>
                <div>
                  <div className="font-semibold text-[15px]">{selected.name}</div>
                  <div className="text-[12px] text-muted-foreground">{selected.online ? 'в сети' : selected.handle}</div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {selected.phone && (
                  <a href={`tel:${(selected.phone||'').replace(/\D/g,'')}`}>
                    <Button size="icon" variant="ghost" className="h-9 w-9 text-green-500 hover:text-green-400 hover:bg-green-500/10">
                      <Icon name="Phone" size={18} />
                    </Button>
                  </a>
                )}
                {[{icon:'Search'},{icon:'EllipsisVertical'}].map((b,i) => (
                  <Button key={i} size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-primary">
                    <Icon name={b.icon} size={18} />
                  </Button>
                ))}
              </div>
            </header>

            {/* Сообщения */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2">
              <div className="flex justify-center mb-3">
                <span className="text-[11px] text-muted-foreground bg-secondary/70 px-3 py-1 rounded-full">Сегодня</span>
              </div>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[60%] text-[14px] leading-relaxed ${
                    msg.mine
                      ? 'bg-primary text-primary-foreground rounded-[18px] rounded-br-[5px]'
                      : 'bg-card border border-border/60 rounded-[18px] rounded-bl-[5px]'
                  } ${msg.type === 'image' ? 'p-1 overflow-hidden' : 'px-3.5 py-2'}`}>
                    {msg.type === 'image' && msg.img
                      ? <img src={msg.img} alt="фото" className="rounded-[14px] max-w-[240px] max-h-[300px] object-cover" />
                      : <p>{msg.text}</p>
                    }
                    {msg.type !== 'image' && (
                      <div className={`text-[10px] mt-1 ${msg.mine ? 'text-primary-foreground/60' : 'text-muted-foreground'} text-right flex items-center justify-end gap-1`}>
                        {msg.time} {msg.mine && <Icon name="CheckCheck" size={11} />}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Эмодзи-панель */}
            {showEmoji && (
              <div className="px-4 pb-1 animate-fade-in">
                <div className="bg-card border border-border/60 rounded-2xl p-3 flex flex-wrap gap-1.5">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setDraft(d => d + e)}
                      className="text-xl hover:scale-125 transition-transform active:scale-110 leading-none">
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Поле ввода */}
            <div className="shrink-0 px-4 py-3 border-t border-border/60 bg-card/40">
              <div className="flex items-center gap-2 bg-secondary/80 rounded-2xl px-2 py-1">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={sendPhoto} />
                <button onClick={() => fileRef.current?.click()}
                  className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-primary shrink-0 transition-colors">
                  <Icon name="Image" size={19} />
                </button>
                <button onClick={() => setShowEmoji(v => !v)}
                  className={`h-9 w-9 flex items-center justify-center shrink-0 transition-colors ${showEmoji ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                  <Icon name="Smile" size={19} />
                </button>
                <input value={draft} onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (send(), e.preventDefault())}
                  placeholder="Сообщение…"
                  className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground py-2 text-foreground" />
                <button onClick={send}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    draft.trim() ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground/40'
                  }`}>
                  <Icon name="Send" size={17} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 animate-scale-in">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#F0C84E]/20 to-[#9A7118]/10 flex items-center justify-center mb-5 border border-primary/15">
              <Icon name="Gem" size={40} className="text-primary/60" />
            </div>
            <h2 className="text-xl font-display font-bold mb-2 text-foreground/80">Prime Business</h2>
            <p className="text-[13px] text-muted-foreground max-w-xs leading-relaxed mb-6">
              Выберите чат слева или пригласите коллег по ссылке.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setAiEnabled(true)}
                className="bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 rounded-xl">
                <Icon name="Bot" size={17} className="mr-2" /> Открыть ПРАВИМ AI
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-secondary/60 flex items-center justify-center mb-3">
        <Icon name={icon} size={26} className="text-muted-foreground/50" />
      </div>
      <p className="text-[13px] text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function AddContactDialog({ myNick }: { myNick: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const generateInvite = async () => {
    if (inviteUrl) return;
    setLoading(true);
    try {
      const base = window.location.origin + window.location.pathname.replace(/\/$/, '');
      const res = await fetch(API.invite, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_nick: myNick || '@user', base_url: base }),
      });
      const data = await res.json();
      setInviteUrl(data.url || '');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const copy = () => {
    if (inviteUrl) { navigator.clipboard?.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (v) generateInvite(); }}>
      <DialogTrigger asChild>
        <Button size="icon" className="h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
          <Icon name="Plus" size={18} />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border/60 rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Добавить в Prime</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="link" className="mt-2">
          <TabsList className="w-full bg-secondary rounded-xl">
            <TabsTrigger value="link" className="flex-1 rounded-lg">Ссылка</TabsTrigger>
            <TabsTrigger value="nick" className="flex-1 rounded-lg">По нику</TabsTrigger>
            <TabsTrigger value="phone" className="flex-1 rounded-lg">Телефон</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="mt-4 space-y-3">
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Отправьте ссылку. После регистрации человек появится в ваших контактах автоматически.
            </p>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Icon name="Loader" size={22} className="animate-spin text-primary" />
              </div>
            ) : inviteUrl ? (
              <div className="bg-secondary/80 rounded-xl p-3 flex items-center gap-2">
                <Icon name="Link2" size={16} className="text-primary shrink-0" />
                <span className="text-[12px] font-mono truncate flex-1 text-muted-foreground">{inviteUrl}</span>
              </div>
            ) : null}
            <div className="flex gap-2">
              <Button onClick={copy} variant="secondary" className="flex-1 h-11 rounded-xl" disabled={!inviteUrl}>
                <Icon name={copied ? 'Check' : 'Copy'} size={16} className="mr-2" />
                {copied ? 'Скопировано!' : 'Копировать'}
              </Button>
              <Button
                onClick={() => inviteUrl && navigator.share?.({ url: inviteUrl, title: 'Приглашение в Prime' })}
                className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!inviteUrl}>
                <Icon name="Share2" size={16} className="mr-2" /> Поделиться
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="nick" className="mt-4 space-y-3">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary font-bold">@</span>
              <Input placeholder="username" className="pl-8 bg-secondary border-none h-11 rounded-xl" />
            </div>
            <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
              <Icon name="UserPlus" size={17} className="mr-2" /> Добавить
            </Button>
          </TabsContent>

          <TabsContent value="phone" className="mt-4 space-y-3">
            <div className="relative">
              <Icon name="Phone" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="+7 (___) ___-__-__" className="pl-10 bg-secondary border-none h-11 rounded-xl" />
            </div>
            <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
              <Icon name="UserPlus" size={17} className="mr-2" /> Добавить
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
