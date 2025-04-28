import React, { useRef, useState } from 'react'
import { useChatStore } from '../../store/useChatStore';
import { Image, Send, X } from 'lucide-react';
import { toast } from 'react-hot-toast';


const MessageInput = () => {
    const [text,setText] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);

    const {sendMessage,selectedUser, sendTypingStatus} = useChatStore()

    const handleImageChange = (e)=>{
      const file = e.target.files[0];
      if(!file.type.startsWith("image/")){
        toast.error("Please select an image file");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }

    const handleMessageChange = (e) => {
      const value = e.target.value;
      setText(value);
      setMessage(value); 
      
      // Trigger typing indicator when user types
      if (value.trim() !== '') {
        sendTypingStatus();
      }
    };

    const removeImage = ()=>{
        setImagePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    }

    const handleSendMessage = async(e)=>{
        e.preventDefault();
        if(!text.trim() && !imagePreview) return;
        try {
             await sendMessage({
                text: text.trim(),
                image: imagePreview,
             })

             setText("");
             setMessage("")
             setImagePreview(null);
             if(fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
          if (error.response) {
            // The server responded with a status code outside the 2xx range
            if (error.response.status === 403) {
              toast.error(error.response.data.error || "You cannot send messages to this user");
            } else {
              toast.error("Failed to send message");
            }
          } else if (error.request) {
            // The request was made but no response was received
            toast.error("No response from server. Check your connection.");
          } else {
            // Something happened in setting up the request
            toast.error("Failed to send message");
          }
          console.error("Failed to send message", error);
        
        }
    }

    return (
      <form onSubmit={handleSendMessage} className="px-2 sm:px-4 py-3 border-t">
        {/* Image Preview Section */}
        {imagePreview && (
          <div className="relative inline-block mb-2">
            <img 
              src={imagePreview} 
              alt="Selected" 
              className="w-16 h-16 object-cover rounded-md" 
            />
            <button 
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-1"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        )}
        
        {/* Input Section */}
        <div className="flex gap-2 items-center">
          <input 
            type="file" 
            onChange={handleImageChange} 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
          />
          
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
          >
            <Image size={20} />
          </button>
          
          <input 
            type="text" 
            value={text} 
            onChange={handleMessageChange} 
            placeholder={`Message ${selectedUser?.fullName || selectedUser?.name || ''}...`}
            className="w-full p-2 rounded-full bg-gray-100 dark:bg-gray-800 focus:outline-none"
          />
          
          <button 
            type="submit" 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
            disabled={!text.trim() && !imagePreview}
          >
            <Send size={20} className={!text.trim() && !imagePreview ? "text-gray-400" : ""} />
          </button>
        </div>
      </form>
    );
}

export default MessageInput