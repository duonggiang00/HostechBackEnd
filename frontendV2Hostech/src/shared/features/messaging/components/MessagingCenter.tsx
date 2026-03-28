import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  MoreVertical,
  Search,
  User,
  CheckCheck,
  Smile,
  Phone,
  Video,
  MessageSquare,
} from 'lucide-react';
import { motion } from 'framer-motion';

import type { Message, Conversation } from '../types';

export default function MessagingCenter() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1');
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversations: Conversation[] = [
    { id: '1', name: 'Ban quản lý', lastMessage: 'Yêu cầu sửa nước của bạn đã được lên lịch vào sáng mai lúc 10:00.', lastTimestamp: '10:45', unreadCount: 2, online: true },
    { id: '2', name: 'Lễ tân', lastMessage: 'Bưu phẩm của bạn đã được nhận tại quầy.', lastTimestamp: 'Hôm qua', unreadCount: 0, online: false },
    { id: '3', name: 'Bảo vệ', lastMessage: 'Đã hoàn tất diễn tập an toàn định kỳ trong tháng.', lastTimestamp: 'Thứ 2', unreadCount: 0, online: true },
  ];

  const messages: Message[] = [
    { id: '1', content: 'Chào anh/chị, sáng nay tôi đã báo sự cố rò nước trong phòng tắm.', senderId: 'user', senderName: 'Bạn', timestamp: '09:00', status: 'read', type: 'text' },
    { id: '2', content: 'Ban quản lý đã tiếp nhận yêu cầu của bạn. Bộ phận kỹ thuật sẽ kiểm tra trong thời gian sớm nhất.', senderId: '1', senderName: 'Ban quản lý', timestamp: '09:15', status: 'read', type: 'text' },
    { id: '3', content: 'Yêu cầu sửa nước của bạn đã được lên lịch vào sáng mai lúc 10:00.', senderId: '1', senderName: 'Ban quản lý', timestamp: '10:45', status: 'delivered', type: 'text' },
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

  const currentConversation = conversations.find((item) => item.id === selectedConversation);

  return (
    <div className="flex h-[750px] bg-slate-900/50 border border-white/5 rounded-5xl overflow-hidden backdrop-blur-xl">
      <div className="w-80 border-r border-white/5 flex flex-col bg-white/1">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black uppercase text-white tracking-widest">Hộp thư</h2>
            <button className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm cuộc trò chuyện..."
              className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/30 transition-all font-bold"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation.id)}
              className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${
                selectedConversation === conversation.id
                  ? 'bg-indigo-500/10 border border-indigo-500/20'
                  : 'hover:bg-white/3 border border-transparent'
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/5 text-slate-400">
                  <User className="w-6 h-6" />
                </div>
                {conversation.online && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-slate-900 rounded-full" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-black uppercase truncate ${selectedConversation === conversation.id ? 'text-white' : 'text-slate-300'}`}>
                    {conversation.name}
                  </span>
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{conversation.lastTimestamp}</span>
                </div>
                <p className="text-xs font-bold text-slate-500 truncate leading-relaxed">
                  {conversation.lastMessage}
                </p>
              </div>
              {conversation.unreadCount > 0 && (
                <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-black text-white">
                  {conversation.unreadCount}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white/1">
        {selectedConversation ? (
          <>
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                  {currentConversation?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-white tracking-widest leading-none mb-1">
                    {currentConversation?.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Kênh hỗ trợ đang hoạt động</span>
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

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-linear-to-b from-transparent to-indigo-500/2"
            >
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={`flex ${msg.senderId === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-4 max-w-[70%] ${msg.senderId === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border ${
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
                        <span className="text-xs font-black uppercase text-slate-600 tracking-tighter">{msg.timestamp}</span>
                        {msg.senderId === 'user' && (
                          <CheckCheck className={`w-3 h-3 ${msg.status === 'read' ? 'text-sky-400' : 'text-slate-600'}`} />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-6 bg-slate-950/30 backdrop-blur-xl border-t border-white/5">
              <div className="bg-slate-900 border border-white/10 rounded-3xl p-2 flex items-end gap-2 focus-within:border-indigo-500/50 transition-all shadow-2xl">
                <button className="p-3 rounded-2xl text-slate-500 hover:text-white transition-all">
                  <Paperclip className="w-5 h-5" />
                </button>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Nhập nội dung cần trao đổi..."
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
            <h3 className="text-xl font-black uppercase text-white mb-2">Chọn một hội thoại</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest max-w-sm leading-relaxed">
              Chọn cuộc trò chuyện ở cột bên trái để bắt đầu liên hệ với ban quản lý hoặc bộ phận hỗ trợ.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
