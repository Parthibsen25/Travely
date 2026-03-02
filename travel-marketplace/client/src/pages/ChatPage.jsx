import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiFetch, mediaUrl } from '../utils/api';
import Loading from '../components/Loading';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount || 0));
}

export default function ChatPage() {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  const isAgency = user?.role === 'AGENCY';

  // If coming from package detail page with query params, auto-start conversation
  const startAgencyId = searchParams.get('agencyId');
  const startPackageId = searchParams.get('packageId');
  const startMessage = searchParams.get('message');

  const loadConversations = useCallback(async () => {
    try {
      const data = await apiFetch('/api/chat/conversations');
      setConversations(data.conversations || []);
      return data.conversations || [];
    } catch {
      // ignore
    }
    return [];
  }, []);

  // Auto-start conversation if params provided
  useEffect(() => {
    async function init() {
      const convs = await loadConversations();
      setLoading(false);

      if (startAgencyId && startMessage) {
        // Check if conversation already exists
        const existing = convs.find(
          (c) =>
            String(c.agencyId?._id || c.agencyId) === startAgencyId &&
            (!startPackageId || String(c.packageId?._id || c.packageId) === startPackageId)
        );
        if (existing) {
          setActiveConvId(existing._id);
        } else {
          try {
            const data = await apiFetch('/api/chat/conversations', {
              method: 'POST',
              body: JSON.stringify({
                agencyId: startAgencyId,
                packageId: startPackageId || undefined,
                message: startMessage
              })
            });
            if (data.conversation) {
              await loadConversations();
              setActiveConvId(data.conversation._id);
            }
          } catch (err) {
            console.error('Failed to start conversation:', err);
          }
        }
      }
    }
    init();
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      try {
        const data = await apiFetch(`/api/chat/conversations/${activeConvId}/messages`);
        setMessages(data.messages || []);
        // Refresh conversations to update unread counts
        loadConversations();
      } catch {
        // ignore
      }
    }
    loadMessages();

    // Poll for new messages every 3 seconds
    pollRef.current = setInterval(async () => {
      try {
        const data = await apiFetch(`/api/chat/conversations/${activeConvId}/messages`);
        setMessages(data.messages || []);
      } catch {
        // ignore
      }
    }, 3000);

    return () => clearInterval(pollRef.current);
  }, [activeConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvId || sending) return;

    setSending(true);
    try {
      const data = await apiFetch(`/api/chat/conversations/${activeConvId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: newMessage.trim() })
      });
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage('');
        loadConversations();
        inputRef.current?.focus();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  }

  const activeConv = conversations.find((c) => c._id === activeConvId);

  if (loading) return <Loading fullPage />;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 animate-page-enter">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">Messages</h1>
          <p className="text-xs text-slate-500">{isAgency ? 'Chat with customers about your packages' : 'Chat with agencies about packages'}</p>
        </div>
      </div>

      <div className="flex h-[calc(100vh-220px)] min-h-[500px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
        {/* Sidebar - Conversation List */}
        <div className={`${sidebarOpen && activeConvId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-200/80`}>
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-700">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600">No conversations yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  {isAgency ? 'Users will message you about packages' : 'Start a chat from any package detail page'}
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const unread = isAgency ? conv.agencyUnread : conv.userUnread;
                const otherName = isAgency
                  ? conv.userId?.name || 'User'
                  : conv.agencyId?.businessName || 'Agency';
                const isActive = conv._id === activeConvId;

                return (
                  <button
                    key={conv._id}
                    onClick={() => {
                      setActiveConvId(conv._id);
                      setSidebarOpen(false);
                    }}
                    className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                      isActive ? 'bg-cyan-50/80 border-r-2 border-cyan-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                      isAgency ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'
                    }`}>
                      {otherName[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`truncate text-sm ${unread > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {otherName}
                        </p>
                        <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(conv.lastMessageAt)}</span>
                      </div>
                      {conv.packageId && (
                        <p className="truncate text-[10px] text-cyan-600 font-medium mt-0.5">
                          {conv.packageId.title}
                        </p>
                      )}
                      <p className={`mt-0.5 truncate text-xs ${unread > 0 ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>
                        {conv.lastMessage || 'No messages'}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="mt-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cyan-500 px-1.5 text-[10px] font-bold text-white">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${!sidebarOpen || !activeConvId ? '' : 'hidden md:flex'} flex flex-1 flex-col`}>
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <button
                  onClick={() => { setSidebarOpen(true); setActiveConvId(null); }}
                  className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                  isAgency ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'
                }`}>
                  {(isAgency ? activeConv.userId?.name : activeConv.agencyId?.businessName || 'A')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {isAgency ? activeConv.userId?.name || 'User' : activeConv.agencyId?.businessName || 'Agency'}
                  </p>
                  {activeConv.packageId && (
                    <Link
                      to={`/app/packages/${activeConv.packageId._id}`}
                      className="flex items-center gap-1.5 truncate text-xs text-cyan-600 hover:text-cyan-700"
                    >
                      {activeConv.packageId.imageUrl && (
                        <img src={mediaUrl(activeConv.packageId.imageUrl)} alt="" className="h-4 w-4 rounded object-cover" />
                      )}
                      {activeConv.packageId.title}
                      {activeConv.packageId.price && (
                        <span className="text-slate-400">· {formatCurrency(activeConv.packageId.price)}</span>
                      )}
                    </Link>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-slate-400">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine =
                      (user.role === 'AGENCY' && msg.senderRole === 'AGENCY') ||
                      (user.role !== 'AGENCY' && msg.senderRole === 'USER');

                    return (
                      <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                            isMine
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-md'
                              : 'bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          <p className={`mt-1 text-[10px] ${isMine ? 'text-white/60' : 'text-slate-400'}`}>
                            {timeAgo(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 bg-white px-4 py-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20 transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center px-6">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100">
                <svg className="h-10 w-10 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-700">Select a conversation</h3>
              <p className="mt-1 text-sm text-slate-500">Choose from your conversations on the left to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
