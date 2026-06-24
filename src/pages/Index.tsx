import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

type Chat = {
  id: number;
  name: string;
  handle: string;
  last: string;
  time: string;
  unread: number;
  online: boolean;
  group?: boolean;
};

type Message = {
  id: number;
  text: string;
  time: string;
  mine: boolean;
};

const initialChats: Chat[] = [
  { id: 1, name: 'Анна Соколова', handle: '@anna_s', last: 'Договор отправлю к 15:00', time: '14:32', unread: 2, online: true },
  { id: 2, name: 'Отдел продаж', handle: 'группа · 8 участников', last: 'Игорь: согласовали бюджет', time: '13:10', unread: 5, online: false, group: true },
  { id: 3, name: 'Дмитрий Орлов', handle: '@d_orlov', last: 'Спасибо за встречу', time: '11:48', unread: 0, online: true },
  { id: 4, name: 'Елена Власова', handle: '@e_vlasova', last: 'Файлы во вложении', time: 'Вчера', unread: 0, online: false },
  { id: 5, name: 'Совет директоров', handle: 'группа · 5 участников', last: 'Вы: повестка на четверг', time: 'Вчера', unread: 0, online: false, group: true },
];

const initialMessages: Message[] = [
  { id: 1, text: 'Добрый день! Подготовил коммерческое предложение по проекту.', time: '14:20', mine: false },
  { id: 2, text: 'Здравствуйте, Анна. Отлично, жду документы.', time: '14:25', mine: true },
  { id: 3, text: 'Уточните, удобно ли согласование во вторник?', time: '14:28', mine: false },
  { id: 4, text: 'Да, вторник подходит. Договор отправлю к 15:00.', time: '14:32', mine: false },
];

const navItems = [
  { key: 'chats', icon: 'MessageSquare', label: 'Чаты' },
  { key: 'calls', icon: 'Phone', label: 'Звонки' },
  { key: 'contacts', icon: 'Users', label: 'Контакты' },
  { key: 'notifications', icon: 'Bell', label: 'Уведомления' },
  { key: 'settings', icon: 'Settings', label: 'Настройки' },
];

const calls = [
  { name: 'Дмитрий Орлов', type: 'out', time: 'Сегодня, 11:48', dur: '12 мин', video: false },
  { name: 'Анна Соколова', type: 'in', time: 'Сегодня, 09:15', dur: '4 мин', video: true },
  { name: 'Отдел продаж', type: 'missed', time: 'Вчера, 18:02', dur: 'Пропущенный', video: false },
  { name: 'Елена Власова', type: 'in', time: 'Вчера, 14:30', dur: '23 мин', video: false },
];

const Index = () => {
  const [active, setActive] = useState('chats');
  const [chats] = useState(initialChats);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(initialChats[0]);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');

  const sendMessage = () => {
    if (!draft.trim()) return;
    setMessages((m) => [
      ...m,
      { id: Date.now(), text: draft, time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }), mine: true },
    ]);
    setDraft('');
  };

  const filteredChats = chats.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.handle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen w-full flex bg-background text-foreground font-sans overflow-hidden">
      {/* Левая навигация */}
      <aside className="w-[72px] shrink-0 bg-card border-r border-border flex flex-col items-center py-5 gap-2">
        <div className="mb-4 flex flex-col items-center select-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E6B84A] to-[#A8801F] flex items-center justify-center shadow-lg shadow-primary/30">
            <Icon name="Hexagon" size={22} className="text-[#2a2008]" />
          </div>
          <span className="text-[10px] font-display font-bold tracking-widest text-primary mt-1 uppercase">Prime</span>
        </div>
        {navItems.map((item) => (
          <div key={item.key} className="relative group">
            <button
              onClick={() => setActive(item.key)}
              className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                active === item.key ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon name={item.icon} size={21} />
              {active === item.key && <span className="absolute left-0 w-1 h-6 rounded-r bg-primary" />}
            </button>
            {/* Тултип */}
            <div className="pointer-events-none absolute left-[56px] top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <div className="bg-[#1a1209] border border-primary/20 text-foreground text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                {item.label}
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1a1209]" />
              </div>
            </div>
          </div>
        ))}
        <div className="mt-auto">
          <Avatar className="w-10 h-10 border border-border">
            <AvatarFallback className="bg-secondary text-foreground text-sm font-semibold">МК</AvatarFallback>
          </Avatar>
        </div>
      </aside>

      {/* Список / разделы */}
      <section className="w-[340px] shrink-0 bg-card/40 border-r border-border flex flex-col">
        <header className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-display font-bold tracking-tight">
              {navItems.find((n) => n.key === active)?.label}
            </h1>
            {active === 'chats' && <AddContactDialog />}
          </div>
          {(active === 'chats' || active === 'contacts') && (
            <div className="relative">
              <Icon name="Search" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по нику или имени"
                className="pl-9 bg-secondary border-none h-10 text-sm"
              />
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {active === 'chats' &&
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors mb-0.5 ${
                  selectedChat?.id === chat.id ? 'bg-secondary' : 'hover:bg-secondary/50'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className={`${chat.group ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground'} font-semibold`}>
                      {chat.group ? <Icon name="Users" size={20} /> : chat.name.split(' ').map((w) => w[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {chat.online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm truncate">{chat.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">{chat.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-sm text-muted-foreground truncate">{chat.last}</span>
                    {chat.unread > 0 && (
                      <span className="shrink-0 ml-2 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}

          {active === 'contacts' &&
            filteredChats.filter((c) => !c.group).map((chat) => (
              <div key={chat.id} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors mb-0.5">
                <div className="relative shrink-0">
                  <Avatar className="w-11 h-11">
                    <AvatarFallback className="bg-secondary font-semibold">{chat.name.split(' ').map((w) => w[0]).join('')}</AvatarFallback>
                  </Avatar>
                  {chat.online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{chat.name}</div>
                  <div className="text-xs text-muted-foreground">{chat.handle}</div>
                </div>
                <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-primary">
                  <Icon name="Phone" size={17} />
                </Button>
              </div>
            ))}

          {active === 'calls' &&
            calls.map((call, i) => (
              <div key={i} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors mb-0.5">
                <Avatar className="w-11 h-11">
                  <AvatarFallback className="bg-secondary font-semibold">{call.name.split(' ').map((w) => w[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{call.name}</div>
                  <div className={`text-xs flex items-center gap-1 ${call.type === 'missed' ? 'text-destructive' : 'text-muted-foreground'}`}>
                    <Icon name={call.type === 'in' ? 'PhoneIncoming' : call.type === 'out' ? 'PhoneOutgoing' : 'PhoneMissed'} size={13} />
                    {call.time} · {call.dur}
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-primary">
                  <Icon name={call.video ? 'Video' : 'Phone'} size={17} />
                </Button>
              </div>
            ))}

          {active === 'notifications' && (
            <div className="space-y-2 px-1">
              {[
                { icon: 'MessageSquare', title: 'Новое сообщение', text: 'Анна Соколова отправила вам документ', time: '5 мин назад' },
                { icon: 'UserPlus', title: 'Новый контакт', text: 'Дмитрий Орлов добавил вас в контакты', time: '1 ч назад' },
                { icon: 'Users', title: 'Группа «Отдел продаж»', text: 'Вас добавили в группу', time: '3 ч назад' },
                { icon: 'PhoneMissed', title: 'Пропущенный звонок', text: 'Отдел продаж · вчера 18:02', time: 'Вчера' },
              ].map((n, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Icon name={n.icon} size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">{n.title}</div>
                    <div className="text-sm text-muted-foreground truncate">{n.text}</div>
                    <div className="text-xs text-muted-foreground/70 mt-0.5">{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {active === 'settings' && (
            <div className="px-1 space-y-1">
              {[
                { icon: 'Bell', label: 'Уведомления', toggle: true },
                { icon: 'Moon', label: 'Тёмная тема', toggle: true },
                { icon: 'ShieldCheck', label: 'Сквозное шифрование', toggle: true },
                { icon: 'Lock', label: 'Конфиденциальность', toggle: false },
                { icon: 'Database', label: 'Данные и память', toggle: false },
                { icon: 'CircleHelp', label: 'Помощь', toggle: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-muted-foreground">
                    <Icon name={s.icon} size={17} />
                  </div>
                  <span className="flex-1 text-sm font-medium">{s.label}</span>
                  {s.toggle ? (
                    <Switch defaultChecked />
                  ) : (
                    <Icon name="ChevronRight" size={17} className="text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Окно чата */}
      <main className="flex-1 flex flex-col bg-background min-w-0">
        {selectedChat && active === 'chats' ? (
          <>
            <header className="h-[72px] shrink-0 px-6 flex items-center justify-between border-b border-border bg-card/40">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-11 h-11">
                    <AvatarFallback className={`${selectedChat.group ? 'bg-primary/20 text-primary' : 'bg-secondary'} font-semibold`}>
                      {selectedChat.group ? <Icon name="Users" size={18} /> : selectedChat.name.split(' ').map((w) => w[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {selectedChat.online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />}
                </div>
                <div>
                  <div className="font-semibold">{selectedChat.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedChat.online ? 'в сети' : selectedChat.handle}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary">
                  <Icon name="Phone" size={19} />
                </Button>
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary">
                  <Icon name="Video" size={19} />
                </Button>
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary">
                  <Icon name="Search" size={19} />
                </Button>
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary">
                  <Icon name="EllipsisVertical" size={19} />
                </Button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3">
              <div className="text-center">
                <span className="text-xs text-muted-foreground bg-secondary/60 px-3 py-1 rounded-full">Сегодня</span>
              </div>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div
                    className={`max-w-[60%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.mine
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-card border border-border rounded-bl-md'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <div className={`text-[11px] mt-1 ${msg.mine ? 'text-primary-foreground/70' : 'text-muted-foreground'} text-right`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <footer className="shrink-0 px-6 py-4 border-t border-border bg-card/40">
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary shrink-0">
                  <Icon name="Paperclip" size={20} />
                </Button>
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Напишите сообщение…"
                  className="bg-secondary border-none h-11 text-sm"
                />
                <Button
                  onClick={sendMessage}
                  size="icon"
                  className="shrink-0 h-11 w-11 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Icon name="Send" size={19} />
                </Button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 animate-scale-in">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-5">
              <Icon name={navItems.find((n) => n.key === active)?.icon || 'MessageSquare'} size={36} className="text-primary" />
            </div>
            <h2 className="text-xl font-display font-bold mb-2">Prime Business</h2>
            <p className="text-muted-foreground max-w-sm text-sm">
              Защищённое общение для профессионалов. Выберите чат слева или начните новый разговор.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

const AddContactDialog = () => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const inviteLink = 'https://prime.app/i/mk-9f3a21';

  const copyLink = () => {
    navigator.clipboard?.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
          <Icon name="Plus" size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Добавить в Prime</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="nick" className="mt-2">
          <TabsList className="w-full bg-secondary">
            <TabsTrigger value="nick" className="flex-1">Ник</TabsTrigger>
            <TabsTrigger value="phone" className="flex-1">Телефон</TabsTrigger>
            <TabsTrigger value="link" className="flex-1">Ссылка</TabsTrigger>
          </TabsList>
          <TabsContent value="nick" className="mt-4 space-y-3">
            <div className="relative">
              <Icon name="AtSign" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="username" className="pl-9 bg-secondary border-none h-11" />
            </div>
            <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Icon name="UserPlus" size={18} className="mr-2" /> Добавить контакт
            </Button>
          </TabsContent>
          <TabsContent value="phone" className="mt-4 space-y-3">
            <div className="relative">
              <Icon name="Phone" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="+7 (___) ___-__-__" className="pl-9 bg-secondary border-none h-11" />
            </div>
            <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Icon name="UserPlus" size={18} className="mr-2" /> Добавить контакт
            </Button>
          </TabsContent>
          <TabsContent value="link" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Отправьте ссылку-приглашение. После регистрации в Prime по ней человек автоматически появится в ваших контактах.
            </p>
            <div className="flex items-center gap-2 bg-secondary rounded-lg p-2.5">
              <Icon name="Link2" size={17} className="text-primary shrink-0" />
              <span className="text-sm truncate flex-1 font-mono">{inviteLink}</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyLink} variant="secondary" className="flex-1 h-11">
                <Icon name={copied ? 'Check' : 'Copy'} size={17} className="mr-2" />
                {copied ? 'Скопировано' : 'Копировать'}
              </Button>
              <Button className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Icon name="Share2" size={17} className="mr-2" /> Поделиться
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default Index;