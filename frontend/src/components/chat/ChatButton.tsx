import React, { useState } from 'react';
import ChatPanel from './ChatPanel';
import { Button } from '../common/Button';

const ChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-transform hover:scale-105 flex items-center justify-center"
        aria-label="Open AI Co‑Shopper"
      >
        <span className="text-xl">🤖</span>
        <span className="ml-2 hidden sm:inline">AI Co‑Shopper</span>
      </button>

      {isOpen && <ChatPanel onClose={() => setIsOpen(false)} />}
    </>
  );
};

export default ChatButton;