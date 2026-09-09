import React, { useState, useRef, useEffect } from 'react';
import { Message, Product } from '../../types';
import { sendMessageStream } from '../../services/chatService';
import MessageBubble from './MessageBubble';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useCart } from '../../hooks/useCart';

interface ChatPanelProps {
  onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ onClose }) => {
  const { refreshCart } = useCart(); // <-- add this
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 Hi! I’m your AI Co‑Shopper. Ask me about products, compare options, or get recommendations!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantPlaceholderId: string | null = null;
    let accumulatedContent = '';
    let placeholderAdded = false;

    try {
      await sendMessageStream(
        userMessage.content,
        messages,
        (token) => {
          if (!placeholderAdded) {
            assistantPlaceholderId = 'assistant-' + Date.now();
            const placeholder: Message = {
              id: assistantPlaceholderId,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, placeholder]);
            placeholderAdded = true;
          }
          accumulatedContent += token;
          if (assistantPlaceholderId) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantPlaceholderId
                  ? { ...msg, content: accumulatedContent }
                  : msg
              )
            );
          }
        },
        async (finalContent, productCards) => {
          if (assistantPlaceholderId) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantPlaceholderId
                  ? { ...msg, content: finalContent, productCards }
                  : msg
              )
            );
          } else {
            const finalMsg: Message = {
              id: 'assistant-' + Date.now(),
              role: 'assistant',
              content: finalContent,
              productCards,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, finalMsg]);
          }
          setIsLoading(false);
          // Refresh cart after AI response in case it was modified
          await refreshCart();
        },
        (error) => {
          console.error('Stream error:', error);
          if (assistantPlaceholderId) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantPlaceholderId
                  ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
                  : msg
              )
            );
          } else {
            const errorMsg: Message = {
              id: 'assistant-' + Date.now(),
              role: 'assistant',
              content: 'Sorry, I encountered an error. Please try again.',
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
          }
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      if (assistantPlaceholderId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantPlaceholderId
              ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
              : msg
          )
        );
      } else {
        const errorMsg: Message = {
          id: 'assistant-' + Date.now(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'Find a laptop for university under $900',
    'Best headphones for music production',
    'Compare smartphones with great cameras',
  ];

  return (
    <div className="fixed bottom-20 right-4 w-[420px] max-w-[calc(100vw-2rem)] h-[640px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span className="font-semibold text-gray-800">AI Co‑Shopper</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500">
            <span className="animate-pulse">⏳</span>
            <span>AI is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length < 2 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="text-sm bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1 text-gray-700"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatPanel;