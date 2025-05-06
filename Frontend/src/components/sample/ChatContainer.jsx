import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import MessageSkeleton from '../Skeletons/MessageSkeleton';
import TypingIndicator from './typingIndicator';
import { useAuthStore } from '../../store/useAuthStore';
import { formatMessageTime } from '../../lib/utils';

const ChatContainer = () => {
  const messagesEndRef = useRef(null);
  const { 
    messages, 
    selectedUser, 
    getMessages, 
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    isTyping,
    // resetChat,
    // checkUserInGroup  
  } = useChatStore();

  const { authUser } = useAuthStore();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);

      const subscription = subscribeToMessages();
      return () => {
        if (subscription) {
          unsubscribeFromMessages();
        }
      }
    }
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);


  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  
  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader/>
        <MessageSkeleton/>
        <MessageInput/>
      </div>
    );
  }

  // If no user is selected, show empty state
  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-gray-500">Select a conversation to start chatting</p>
      </div>
    );
  }

  const uniqueMessageIds = new Set();
  const deduplicatedMessages = messages.filter(message => {
    if (!message || !message._id) return false;
    if (uniqueMessageIds.has(message._id)) return false;
    uniqueMessageIds.add(message._id);
    return true;
  });

  return (
    <div className='flex-1 flex flex-col overflow-auto'>
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {deduplicatedMessages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          deduplicatedMessages.map((message) => {
            if (!message || !message.senderId) return null;
            
            // Get the correct sender info
            const isCurrentUser = selectedUser.isGroup 
              ? (typeof message.senderId === 'object' 
                  ? message.senderId._id === authUser._id 
                  : message.senderId === authUser._id)
              : message.senderId === authUser._id;
            
            // Get profile picture based on if it's a group or direct message
            const profilePic = selectedUser.isGroup
              ? (isCurrentUser 
                  ? authUser.profilePic 
                  : (typeof message.senderId === 'object' 
                      ? message.senderId.profilePic 
                      : "/avatar.png"))
              : (isCurrentUser
                  ? authUser.profilePic
                  : selectedUser.profilePic );
            
            // Get sender name (only shown for group messages)
            const senderName = selectedUser.isGroup && !isCurrentUser
              ? (typeof message.senderId === 'object' 
                  ? message.senderId.fullName 
                  : "Unknown User")
              : null;
              
            return (
              <div
                key={message._id}
                className={`chat ${isCurrentUser ? "chat-end" : "chat-start"}`}
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border">
                    <img
                      src={profilePic}
                      alt="profile pic"
                      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
                    />
                  </div> 
                </div>
                <div className="chat-header mb-1">
                  {senderName && <span className="font-bold mr-2">{senderName}</span>}
                  <time className="text-xs opacity-50 ml-1">
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>
                <div className="chat-bubble flex flex-col">
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="sm:max-w-[200px] rounded-md mb-2"
            
                    />
                  )}
                  {message.text && <p>{message.text}</p>}
                </div>
              </div>
            );
          })
        )}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;