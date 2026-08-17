import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { chatAPI, tripsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useImagePreview } from '../context/ImagePreviewContext';

export default function Chat() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const { showPreview } = useImagePreview();
  const toast = useToast();

  const [trip, setTrip] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const attachmentMenuRef = useRef(null);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Click outside to close attachment menu helper
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch trip details and past messages
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [tripData, messagesData] = await Promise.all([
          tripsAPI.getOne(tripId),
          chatAPI.getMessages(tripId),
        ]);
        setTrip(tripData);
        setMessages(messagesData);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load chat history.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [tripId]);

  // Configure Socket.io connection
  useEffect(() => {
    if (!user) return;

    // Connect to backend server port 5000 (proxied via client or absolute)
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('joinTrip', { tripId, userId: user.id });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('message', (message) => {
      setMessages((prev) => {
        // Prevent duplicate local messages if broadcast returns
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    });

    socket.on('messageEdited', (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
      );
    });

    socket.on('messageDeleted', ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    return () => {
      socket.emit('leaveTrip', { tripId });
      socket.disconnect();
    };
  }, [tripId, user]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    if (!socketConnected || !socketRef.current) {
      toast.error('Not connected to chat server. Trying to reconnect...');
      return;
    }

    const payload = {
      tripId,
      senderId: user.id,
    };

    if (inputText.trim()) {
      payload.text = inputText.trim();
    }

    if (selectedFile) {
      payload.file = selectedFile;
    }

    if (replyToMessage) {
      payload.replyTo = {
        messageId: replyToMessage._id,
        text: replyToMessage.text,
        senderName: getSenderName(replyToMessage.sender),
      };
    }

    // Emit send message event
    socketRef.current.emit('sendMessage', payload);

    setInputText('');
    setSelectedFile(null);
    setReplyToMessage(null);
  };

  const handleFileSelect = (file, fileType) => {
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('File size exceeds the 8MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result;
      setSelectedFile({
        url: base64Data,
        name: file.name,
        fileType: fileType,
      });
    };

    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file, 'image');
    }
    e.target.value = '';
  };

  const handleDocChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file, 'document');
    }
    e.target.value = '';
  };

  const handleStartEdit = (msg) => {
    setEditingMessageId(msg._id);
    setEditingText(msg.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = (messageId) => {
    if (!editingText.trim()) return;
    if (!socketConnected || !socketRef.current) {
      toast.error('Not connected to chat server.');
      return;
    }

    socketRef.current.emit('editMessage', {
      tripId,
      messageId,
      userId: user.id,
      text: editingText.trim(),
    });

    setEditingMessageId(null);
    setEditingText('');
  };

  const handleDeleteMessage = async (messageId) => {
    const confirmed = await toast.confirm('Are you sure you want to delete this message?', 'Delete');
    if (!confirmed) return;
    
    if (!socketConnected || !socketRef.current) {
      toast.error('Not connected to chat server.');
      return;
    }

    socketRef.current.emit('deleteMessage', {
      tripId,
      messageId,
      userId: user.id,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getSenderId = (sender) => {
    if (!sender) return '';
    return typeof sender === 'object' ? sender._id || sender.id || '' : sender;
  };

  const getSenderName = (sender) => {
    if (!sender) return 'Unknown User';
    return typeof sender === 'object' ? sender.name || 'Unknown User' : 'Crew Member';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex-shrink-0 bg-white border border-gray-100 rounded-3xl shadow-sm p-4 sm:p-5 mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/trips/${tripId}`}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            title="Back to Overview"
          >
            ←
          </Link>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-base sm:text-lg text-gray-900 truncate mt-0.5">
              {trip?.emoji} {trip?.name} Discussion
            </h1>
            <p className="text-xs text-gray-400 truncate pt-2">📍 {trip?.destination}</p>
          </div>
        </div>

        <Link
          to={`/trips/${tripId}/members`}
          className="text-xs text-primary-600 font-semibold hover:underline bg-primary-50 px-3 py-2 rounded-xl flex-shrink-0"
        >
          👥 View Crew
        </Link>
      </div>

      {/* Messages Window */}
      <div className="flex-1 bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
              <span className="text-4xl mb-4">💬</span>
              <h3 className="font-display font-bold text-gray-800 text-lg">No Messages Yet</h3>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                Break the ice! Start chatting with your travel crew about itinerary plans, hotel stays, or budget breakdowns.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const senderId = getSenderId(msg.sender);
              const isMe = senderId === user.id;
              const senderName = getSenderName(msg.sender);
              
              // Helper to check if the next message is from the same sender to group bubbles visually
              const nextMsg = messages[index + 1];
              const isNextSameSender = nextMsg && getSenderId(nextMsg.sender) === senderId;

              return (
                <div key={msg._id || index} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  {!isMe && !isNextSameSender ? (
                    <div 
                      onClick={() => typeof msg.sender === 'object' && msg.sender.avatar && showPreview(msg.sender.avatar, senderName)}
                      className={`w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-emerald-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm transition-transform ${typeof msg.sender === 'object' && msg.sender.avatar ? 'cursor-zoom-in hover:scale-105' : ''}`}
                    >
                      {typeof msg.sender === 'object' && msg.sender.avatar ? (
                        <img src={msg.sender.avatar} alt={senderName} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(senderName)
                      )}
                    </div>
                  ) : (
                    // Spacer for grouped message bubbles
                    <div className="w-8 flex-shrink-0" />
                  )}

                  {/* Message Bubble Container */}
                  <div className="flex flex-col">
                    {/* Sender Name (only if not self and first message in a group) */}
                    {!isMe && (index === 0 || getSenderId(messages[index - 1].sender) !== senderId) && (
                      <span className="text-[10px] font-semibold text-gray-400 ml-1 mb-1">{senderName}</span>
                    )}

                    {/* Text Bubble */}
                    {/* Text Bubble */}
                    {editingMessageId === msg._id ? (
                      <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-250">
                        <textarea
                          rows={2}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-64 p-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-primary-500 resize-none text-gray-850"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEdit(msg._id);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-white border border-gray-250 rounded-lg shadow-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(msg._id)}
                            className="px-2 py-1 text-xs font-semibold text-primary-700 bg-primary-650 hover:bg-primary-700 hover:text-white rounded-lg shadow-sm "
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={`group relative flex items-center gap-2 ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-200">
                          <button
                            onClick={() => setReplyToMessage(msg)}
                            className="p-1 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-gray-50 transition-colors"
                            title="Reply to message"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>
                          {isMe && (
                            <>
                              <button
                                onClick={() => handleStartEdit(msg)}
                                className="p-1 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-gray-50 transition-colors"
                                title="Edit message"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(msg._id)}
                                className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-gray-50 transition-colors"
                                title="Delete message"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm break-words flex flex-col gap-1.5 ${
                            isMe
                              ? 'bg-gradient-to-r from-primary-600 to-emerald-500 text-white rounded-tr-none'
                              : 'bg-gray-100 text-gray-800 rounded-tl-none'
                          }`}
                        >
                          {msg.replyTo && (
                            <div className={`px-2 py-1 rounded-lg border-l-4 text-xs select-none mb-1 text-left ${
                              isMe 
                                ? 'bg-black/10 border-white/40 text-emerald-105' 
                                : 'bg-black/5 border-primary-500 text-gray-500'
                            }`}>
                              <span className="font-semibold block text-[10px] mb-0.5">
                                ⤺ {msg.replyTo.senderName}
                              </span>
                              <span className="line-clamp-2 italic">{msg.replyTo.text}</span>
                            </div>
                          )}
                          {/* File / Document Attachment */}
                          {msg.file && msg.file.fileType === 'image' && (
                            <div 
                              onClick={() => showPreview(msg.file.url, msg.file.name)}
                              className="max-w-xs max-h-60 rounded-xl overflow-hidden cursor-zoom-in hover:scale-[1.01] transition-transform shadow-inner bg-black/5 mb-1"
                            >
                              <img src={msg.file.url} alt={msg.file.name} className="max-w-full max-h-60 object-contain rounded-xl" />
                            </div>
                          )}
                          {msg.file && msg.file.fileType === 'document' && (
                            <a 
                              href={msg.file.url} 
                              download={msg.file.name}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-sm max-w-xs transition-colors select-none mb-1 text-left ${
                                isMe
                                  ? 'bg-black/10 border-white/20 text-white hover:bg-black/20'
                                  : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
                              }`}
                            >
                              <span className="text-2xl">📄</span>
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate text-xs">{msg.file.name}</span>
                                <span className="text-[10px] text-gray-450">Click to download</span>
                              </div>
                            </a>
                          )}
                          {msg.text && <div>{msg.text}</div>}
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    {!isNextSameSender && (
                      <span className={`text-[9px] text-gray-400 mt-1 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Text Input Panel */}
        <div className="flex-shrink-0 border-t border-gray-100 p-4 sm:p-5 bg-gray-50/50 flex flex-col gap-2">
          {replyToMessage && (
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm text-sm animate-fade-in">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-xs font-semibold text-primary-600">
                  Replying to {getSenderName(replyToMessage.sender)}
                </span>
                <span className="text-xs text-gray-500 truncate max-w-lg italic">
                  {replyToMessage.text}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReplyToMessage(null)}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors font-semibold"
                title="Cancel reply"
              >
                ✕
              </button>
            </div>
          )}

          {selectedFile && (
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm text-sm animate-fade-in">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {selectedFile.fileType === 'image' ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                    <img src={selectedFile.url} alt="Staged upload" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <span className="text-2xl flex-shrink-0">📄</span>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-gray-700 truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-gray-400">Ready to send</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors font-semibold"
                title="Remove file"
              >
                ✕
              </button>
            </div>
          )}
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <input
            type="file"
            ref={docInputRef}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            onChange={handleDocChange}
            className="hidden"
          />
          <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
            <div className="relative flex-1 flex items-center">
              {showAttachmentMenu && (
                <div 
                  ref={attachmentMenuRef}
                  className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-1.5 w-44 z-20 flex flex-col gap-1 animate-scale-up"
                >
                  <button
                    type="button"
                    onClick={() => {
                      imageInputRef.current?.click();
                      setShowAttachmentMenu(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    <span>🖼️</span> Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      docInputRef.current?.click();
                      setShowAttachmentMenu(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    <span>📄</span> Documents
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="absolute left-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center font-bold text-lg transition-colors z-10"
                title="Add attachment"
              >
                +
              </button>
              <input
                type="text"
                placeholder={socketConnected ? "Message your travel crew..." : "Reconnecting to server..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={!socketConnected}
                className="flex-1 min-w-0 pl-12 pr-4 py-3 bg-white border border-gray-250 rounded-2xl text-sm shadow-sm focus:outline-none focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>
            <button
              type="submit"
              disabled={(!inputText.trim() && !selectedFile) || !socketConnected}
              className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-primary-600 to-emerald-500 text-white rounded-2xl shadow-md shadow-primary-500/10 hover:from-primary-700 hover:to-emerald-600 flex items-center justify-center transition-all disabled:opacity-50 disabled:shadow-none"
              title="Send message"
            >
              <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
