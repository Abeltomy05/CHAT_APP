import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Video, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

const IncomingCallAlert = ({ incomingCall, onAccept, onDecline }) => {
    const navigate = useNavigate();
    const { socket } = useAuthStore();
    
    // Debug logging
    useEffect(() => {
      if (incomingCall) {
        console.log("Incoming call data:", incomingCall);
      }
    }, [incomingCall]);
    
    if (!incomingCall) return null;
    
    const handleAccept = () => {
      if (!socket || !socket.connected) {
        toast.error("Connection error. Please refresh the page.");
        onDecline();
        return;
      }
      
      try {
        // First, notify the caller that we've accepted
        socket.emit('acceptCall', { 
          to: incomingCall.from,
          signal: incomingCall.signal  // Echo back the signal for confirmation
        });
        
        // Generate room ID based on caller and current user
        const roomId = `${incomingCall.from}-${incomingCall.to}`;
        console.log("Accepting call, navigating to room:", roomId);
        
        // Call the accept handler from useAuthStore
        onAccept();
        
        // Navigate to call screen
        navigate(`/call/${roomId}`);
      } catch (error) {
        console.error("Error accepting call:", error);
        toast.error("Failed to accept call");
        onDecline();
      }
    };
    
    return (
      <div className="fixed top-4 right-4 z-50 bg-base-200 p-4 rounded-lg shadow-lg w-80">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium flex items-center gap-2">
            <Video size={20} className="text-blue-500" /> 
            Incoming Call
          </h3>
          <button 
            onClick={onDecline}
            className="p-1 rounded-full hover:bg-base-300"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="flex items-center gap-3 my-3">
          <div className="avatar">
            <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center">
              <img 
                src={incomingCall.avatar || "/avatar.png"} 
                alt={incomingCall.name}
                className="rounded-full"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/avatar.png";
                }}
              />
            </div>
          </div>
          <div>
            <p className="font-medium">{incomingCall.name || 'Someone'}</p>
            <p className="text-sm opacity-70">is calling you...</p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-2">
          <button 
            onClick={onDecline}
            className="flex-1 py-2 px-3 rounded bg-red-100 text-red-600 flex items-center justify-center gap-1 hover:bg-red-200"
          >
            <X size={18} /> Decline
          </button>
          <button 
            onClick={handleAccept}
            className="flex-1 py-2 px-3 rounded bg-green-100 text-green-600 flex items-center justify-center gap-1 hover:bg-green-200"
          >
            <Phone size={18} /> Accept
          </button>
        </div>
      </div>
    );
  };
export default IncomingCallAlert;