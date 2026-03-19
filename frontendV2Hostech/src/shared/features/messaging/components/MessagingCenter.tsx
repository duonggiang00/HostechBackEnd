import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  Search, 
  User, 
  Clock, 
  CheckCheck,
  Image as ImageIcon,
  Smile,
  Phone,
  Video,
  X,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import type { Message, Conversation } from '../types';

export default function MessagingCenter() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1');
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mock Data
  const conversations: Conversation[] = [
    { id: '1', name: 'Property Management', lastMessage: 'The plumbing repair is scheduled for tomorrow at 10 AM.', lastTimestamp: '10:45 AM', unreadCount: 2, online: true },
    { id: '2', name: 'Front Desk', lastMessage: 'Your package has arrived at the reception.', lastTimestamp: 'Yesterday', unreadCount: 0, online: false },
    { id: '3', name: 'Security Team', lastMessage: 'Monthly safety drill successfully completed.', lastTimestamp: 'Mon', unreadCount: 0, online: true },
  ];

  const messages: Message[] = [
    { id: '1', content: 'Hello, I reported a leak in the bathroom this morning.', senderId: 'user', senderName: 'You', timestamp: '9:00 AM', status: 'read', type: 'text' },
    { id: '2', content: 'Hi there! We have received your request. Our maintenance team will check it shortly.', senderId: '1', senderName: 'Property Staff', timestamp: '9:15 AM', status: 'read', type: 'text' },
    { id: '3', content: 'The plumbing repair is scheduled for tomorrow at 10 AM.', senderId: '1', senderName: 'Property Staff', timestamp: '10:45 AM', status: 'delivered', type: 'text' },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedConversation]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessage('');
  };

  return (
    <div className="flex h-[750px] bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
      {/* Sidebar - Conversations */}
      <div className="w-80 border-r border-white/5 flex flex-col bg-white/[0.01]">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black uppercase italic text-white tracking-widest">Inboxes</h2>
            <button className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search conversations..."
              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/30 transition-all font-bold"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv.id)}
              className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${
                selectedConversation === conv.id 
                  ? 'bg-indigo-500/10 border border-indigo-500/20' 
                  : 'hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/5 text-slate-400">
                  <User className="w-6 h-6" />
                </div>
                {conv.online && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-slate-900 rounded-full" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-black uppercase truncate ${selectedConversation === conv.id ? 'text-white' : 'text-slate-300'}`}>
                    {conv.name}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{conv.lastTimestamp}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 truncate leading-relaxed">
                  {conv.lastMessage}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-black text-white">
                  {conv.unreadCount}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white/[0.01]">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                  {conversations.find(c => c.id === selectedConversation)?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-white tracking-widest leading-none mb-1">
                    {conversations.find(c => c.id === selectedConversation)?.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Verified Agent Connected</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
                  <Video className="w-4 h-4" />
                </button>
                <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-gradient-to-b from-transparent to-indigo-500/[0.02]"
            >
              {messages.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={`flex ${msg.senderId === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-4 max-w-[70%] ${msg.senderId === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border ${
                      msg.senderId === 'user' 
                        ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' 
                        : 'bg-slate-800 border-white/10 text-slate-400'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`p-5 rounded-3xl ${
                        msg.senderId === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-xl shadow-indigo-500/10'
                          : 'bg-slate-800/80 border border-white/5 text-slate-300 rounded-tl-none'
                      }`}>
                        <p className="text-xs font-bold leading-relaxed tracking-wide">{msg.content}</p>
                      </div>
                      <div className={`flex items-center gap-2 mt-2 ${msg.senderId === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] font-black uppercase text-slate-600 tracking-tighter">{msg.timestamp}</span>
                        {msg.senderId === 'user' && (
                          <CheckCheck className={`w-3 h-3 ${msg.status === 'read' ? 'text-sky-400' : 'text-slate-600'}`} />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="p-6 bg-slate-950/30 backdrop-blur-xl border-t border-white/5">
              <div className="bg-slate-900 border border-white/10 rounded-3xl p-2 flex items-end gap-2 focus-within:border-indigo-500/50 transition-all shadow-2xl">
                <button className="p-3 rounded-2xl text-slate-500 hover:text-white transition-all">
                  <Paperclip className="w-5 h-5" />
                </button>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Type a secure message..."
                  className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-white py-3 px-2 resize-none min-h-[44px] max-h-32 placeholder:text-slate-600"
                />
                <button className="p-3 rounded-2xl text-slate-500 hover:text-white transition-all">
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
            <div className="w-32 h-32 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 mb-8 border-dashed">
              <MessageSquare className="w-12 h-12 text-indigo-500" />
            </div>
            <h3 className="text-xl font-black uppercase italic text-white mb-2">Secure Comms Hub</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-sm leading-relaxed">
              Select a secure channel from the left to begin interacting with property administration and maintenance teams.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
