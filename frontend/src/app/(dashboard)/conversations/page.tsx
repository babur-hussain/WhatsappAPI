'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Send, Sparkles, Loader2, MessageCircle, ArrowLeft, User, Bot } from "lucide-react";
import { io, Socket } from 'socket.io-client';

const API_BASE = 'https://loomiflow-backend-production-db59.up.railway.app/api/v1/conversations';

function getCookie(name: string) {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : '';
}

interface Conversation {
    id: string;
    customerPhone: string;
    customerName: string | null;
    profilePicture: string | null;
    status: string;
    lastMessage: string;
    lastMessageSender: string | null;
    lastMessageTime: string;
    messageCount: number;
}

interface Message {
    id: string;
    content: string;
    sender: 'CUSTOMER' | 'BOT' | 'ADMIN';
    timestamp: string;
}

interface LeadInfo {
    id: string;
    customerPhone: string;
    customerName: string | null;
    profilePicture: string | null;
    status: string;
    productInterest: string | null;
    createdAt: string;
}

export default function ConversationsPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [leadInfo, setLeadInfo] = useState<LeadInfo | null>(null);
    const [replyText, setReplyText] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    const getHeaders = () => ({
        'Authorization': `Bearer ${getCookie('accessToken')}`,
        'Content-Type': 'application/json',
    });

    useEffect(() => {
        fetchConversations();

        // Initialize Socket connection
        const token = getCookie('accessToken');
        if (token) {
            socketRef.current = io('https://loomiflow-backend-production-db59.up.railway.app', {
                auth: { token }
            });

            socketRef.current.on('connect', () => {
                console.log('Connected to socket server');
            });

            return () => {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                }
            };
        }
    }, []);

    useEffect(() => {
        if (!socketRef.current) return;

        const handleNewMessage = (data: { leadId: string, message: Message, lead: Conversation }) => {
            console.log('Received new_message event:', data);
            
            // Update messages if we have this conversation open
            if (selectedId === data.leadId) {
                setMessages(prev => {
                    // Check if message already exists (prevent duplicates)
                    if (prev.some(m => m.id === data.message.id)) return prev;
                    return [...prev, data.message];
                });
            }

            // Update conversations list unconditionally
            setConversations(prev => {
                const existingIndex = prev.findIndex(c => c.id === data.leadId);
                let newConvs = [...prev];
                
                if (existingIndex >= 0) {
                    const conv = newConvs.splice(existingIndex, 1)[0];
                    newConvs.unshift({
                        ...conv,
                        status: data.lead.status || conv.status,
                        lastMessage: data.lead.lastMessage,
                        lastMessageSender: data.lead.lastMessageSender,
                        lastMessageTime: data.lead.lastMessageTime
                    });
                } else {
                    newConvs.unshift(data.lead);
                }
                
                return newConvs;
            });
        };

        socketRef.current.on('new_message', handleNewMessage);

        return () => {
            socketRef.current?.off('new_message', handleNewMessage);
        };
    }, [selectedId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async (searchQuery?: string) => {
        try {
            const params = new URLSearchParams({ limit: '50' });
            if (searchQuery) params.set('search', searchQuery);
            const res = await fetch(`${API_BASE}?${params}`, { headers: getHeaders() });
            const data = await res.json();
            if (data.success) {
                setConversations(data.data.conversations);
            }
        } catch (e) {
            console.error('Failed to fetch conversations:', e);
        } finally {
            setLoading(false);
        }
    };

    const selectConversation = async (id: string) => {
        setSelectedId(id);
        setMessagesLoading(true);
        setAiSuggestion('');
        try {
            const res = await fetch(`${API_BASE}/${id}/messages?limit=100`, { headers: getHeaders() });
            const data = await res.json();
            if (data.success) {
                setMessages(data.data.messages);
                setLeadInfo(data.data.lead);
            }
        } catch (e) {
            console.error('Failed to fetch messages:', e);
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleSend = async () => {
        if (!replyText.trim() || !selectedId) return;
        setSending(true);
        try {
            const res = await fetch(`${API_BASE}/${selectedId}/reply`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ message: replyText }),
            });
            const data = await res.json();
            if (data.success) {
                setMessages(prev => [...prev, {
                    id: data.data.id,
                    content: replyText,
                    sender: 'ADMIN',
                    timestamp: new Date().toISOString(),
                }]);
                setReplyText('');
                setAiSuggestion('');
                // Refresh conversation list to update previews
                fetchConversations(search || undefined);
            }
        } catch (e) {
            console.error('Failed to send reply:', e);
        } finally {
            setSending(false);
        }
    };

    const handleAiSuggest = async () => {
        if (!selectedId) return;
        setAiLoading(true);
        try {
            const res = await fetch(`${API_BASE}/${selectedId}/suggest`, { headers: getHeaders() });
            const data = await res.json();
            if (data.success) {
                setAiSuggestion(data.data.reply);
                setReplyText(data.data.reply);
            }
        } catch (e) {
            console.error('AI suggestion failed:', e);
        } finally {
            setAiLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchConversations(search || undefined);
    };

    const formatTime = (ts: string) => {
        const d = new Date(ts);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffHrs = diffMs / (1000 * 60 * 60);

        if (diffHrs < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffHrs < 48) return 'Yesterday';
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const statusColor: Record<string, string> = {
        NEW: 'bg-blue-100 text-blue-700',
        CONTACTED: 'bg-yellow-100 text-yellow-700',
        CLOSED: 'bg-green-100 text-green-700',
    };

    // Format phone: strip leading country code 91 for Indian numbers, show last 10 digits
    const formatPhone = (phone: string) => {
        const digits = phone.replace(/\D/g, '');
        if (digits.startsWith('91') && digits.length === 12) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
        return `+${digits}`;
    };

    // Avatar component: shows profile picture or colored initial circle
    const Avatar = ({ name, phone, pic, size = 'md' }: { name: string | null; phone: string; pic: string | null; size?: 'sm' | 'md' | 'lg' }) => {
        const sizeClass = size === 'lg' ? 'w-12 h-12 text-base' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
        const label = (name || phone || '?')[0].toUpperCase();
        if (pic) {
            return (
                <img src={pic} alt={name || phone} className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement)!.style.display = 'flex'; }}
                />
            );
        }
        return (
            <div className={`${sizeClass} bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
                {label}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Conversation List */}
            <div className={`w-full md:w-96 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col ${selectedId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-3">
                        <MessageCircle className="w-5 h-5 text-indigo-500" />
                        Conversations
                    </h2>
                    <form onSubmit={handleSearch}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search by name or phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 text-sm"
                            />
                        </div>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            No conversations yet. Messages from WhatsApp will appear here.
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => selectConversation(conv.id)}
                                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedId === conv.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <Avatar name={conv.customerName} phone={conv.customerPhone} pic={conv.profilePicture} size="sm" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="font-semibold text-sm text-gray-900 truncate">
                                                    {conv.customerName || formatPhone(conv.customerPhone)}
                                                </span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColor[conv.status] || 'bg-gray-100 text-gray-600'}`}>
                                                    {conv.status}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 flex-shrink-0">
                                                {formatTime(conv.lastMessageTime)}
                                            </span>
                                        </div>
                                        {conv.customerName && (
                                            <div className="text-xs text-gray-400">{formatPhone(conv.customerPhone)}</div>
                                        )}
                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                            {conv.lastMessageSender === 'CUSTOMER' ? '' : '✓ '}
                                            {conv.lastMessage}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-gray-50 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
                {!selectedId ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium">Select a conversation</p>
                            <p className="text-sm mt-1">Choose a conversation from the list to view messages</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center gap-3">
                            <button onClick={() => setSelectedId(null)} className="md:hidden p-1 hover:bg-gray-100 rounded">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <Avatar
                                name={leadInfo?.customerName || null}
                                phone={leadInfo?.customerPhone || ''}
                                pic={leadInfo?.profilePicture || null}
                                size="md"
                            />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">
                                    {leadInfo?.customerName || formatPhone(leadInfo?.customerPhone || '')}
                                </h3>
                                <p className="text-xs text-gray-500">{formatPhone(leadInfo?.customerPhone || '')}</p>
                            </div>
                            {leadInfo && (
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[leadInfo.status] || 'bg-gray-100'}`}>
                                    {leadInfo.status}
                                </span>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messagesLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'CUSTOMER' ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${msg.sender === 'CUSTOMER'
                                            ? 'bg-white text-gray-800 rounded-bl-md'
                                            : msg.sender === 'BOT'
                                                ? 'bg-purple-500 text-white rounded-br-md'
                                                : 'bg-indigo-500 text-white rounded-br-md'
                                            }`}>
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                {msg.sender === 'CUSTOMER' ? (
                                                    <User className="w-3 h-3 opacity-60" />
                                                ) : (
                                                    <Bot className="w-3 h-3 opacity-60" />
                                                )}
                                                <span className="text-[10px] opacity-60 font-medium">
                                                    {msg.sender === 'CUSTOMER' ? 'Customer' : msg.sender === 'BOT' ? 'AI Bot' : 'You'}
                                                </span>
                                            </div>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            <p className={`text-[10px] mt-1 ${msg.sender === 'CUSTOMER' ? 'text-gray-400' : 'text-white/60'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* AI Suggestion Banner */}
                        {aiSuggestion && (
                            <div className="mx-4 mb-2 bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2">
                                <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-purple-700">AI Suggested Reply</p>
                                    <p className="text-sm text-purple-900 mt-0.5">{aiSuggestion}</p>
                                </div>
                            </div>
                        )}

                        {/* Reply Input */}
                        <div className="p-3 bg-white border-t border-gray-200">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleAiSuggest}
                                    disabled={aiLoading}
                                    title="Get AI Suggestion"
                                    className="flex-shrink-0 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                                >
                                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> : <Sparkles className="w-4 h-4 text-purple-500" />}
                                </Button>
                                <Input
                                    placeholder="Type a message..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    className="flex-1"
                                    disabled={sending}
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!replyText.trim() || sending}
                                    className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"
                                >
                                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
