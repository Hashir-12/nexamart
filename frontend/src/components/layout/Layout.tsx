import React, { useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import ChatPanel from '../chat/ChatPanel';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => setIsChatOpen(prev => !prev);
  const closeChat = () => setIsChatOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onChatToggle={toggleChat} />
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
      <Footer />
      {isChatOpen && <ChatPanel onClose={closeChat} />}
    </div>
  );
};

export default Layout;