import {create} from "zustand"
import toast from "react-hot-toast";
import { axiosIntance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";


export const useChatStore = create((set,get)=>({
    messages:[],
    users:[],
    groups: [],
    selectedUser:null,
    isUsersLoading: false,
    isGroupsLoading: false,
    isMessagesLoading: false,
    isClearingChat: false,
    isTyping: false,  
    typingUsers: [],
    groupTypingUsers: [],
    typingTimeout: null,
    loading: false,
    error: null,
   


    getUsers: async() =>{
        set({isUsersLoading: true});
        try{
          const res = await axiosIntance.get("/message/users");
          set({users:res.data});
        }catch(error){
            toast.error(error.response.data.message);
        }finally{
            set({isUsersLoading:false})
        }
    },

    getGroups: async() => {
      set({isGroupsLoading: true});
      try{
        const res = await axiosIntance.get("message/groups");
        set({groups: res.data});

        const socket = useAuthStore.getState().socket;
        if (socket) {
          res.data.forEach(group => {
            socket.emit("joinGroup", group._id);
          });
        }
        return res.data;
      }catch(error){
          toast.error(error.response?.data?.message || "Failed to fetch groups");
      }finally{
          set({isGroupsLoading: false})
      }
  },

  createGroup: async(groupData) => {
    try {
        const res = await axiosIntance.post("/message/createGroup", groupData);
        
        // Add the new group to the groups array
        set(state => ({
            groups: [...state.groups, res.data]
        }));
        
        return res.data;
    } catch (error) {
        throw error;
    }
},

leaveGroup: async(groupId) => {
    try {
        const res = await axiosIntance.post("/message/leaveGroup", { groupId });
        
        // Remove the group from the groups array
        set(state => ({
            groups: state.groups.filter(group => group._id !== groupId)
        }));
        
        // If the selected user is the group being left, clear it
        const { selectedUser } = get();
        if (selectedUser && selectedUser._id === groupId) {
            set({ selectedUser: null, messages: [] });
        }
        
        // Notify socket
        const socket = useAuthStore.getState().socket;
        if (socket) {
            socket.emit("leaveGroup", { 
                groupId: groupId,
                userId: useAuthStore.getState().authUser._id 
            });
        }
        
        return res.data;
    } catch (error) {
        throw error;
    }
  },

resetChat: () => {
    const { unsubscribeFromMessages } = get();
    unsubscribeFromMessages();

    set({
      selectedUser: null,
      messages: [],
      isMessagesLoading: false,
      isTyping: false,
    });
  },

  clearSelectedUser: () => {
    const { unsubscribeFromMessages } = get();
    unsubscribeFromMessages();
    
    set({
      selectedUser: null,
      messages: [],
      isMessagesLoading: false,
      isTyping: false,
    });
  }, 

    getMessages: async(userId) => {
      if (!userId) return;
      
      const { selectedUser } = get();
      const isGroup = selectedUser?.isGroup;
      
      set({isMessagesLoading: true});
      
      try{
          const endpoint = isGroup 
              ? `/message/getGroupMessages/${userId}`
              : `/message/${userId}`;
              
          const res = await axiosIntance.get(endpoint);
          set({messages: res.data});
      } catch(error) {
          toast.error(error.response?.data?.message || "Failed to fetch messages");
      } finally {
          set({isMessagesLoading: false});
      }
    },

   sendMessage: async ({ text, image }) => {
        const { selectedUser } = get();
        
        if (!selectedUser) {
          throw new Error('No user or group selected');
        }
        
        set({ loading: true });
        
        try {
          const isGroup = selectedUser.isGroup;
          const endpoint = isGroup 
              ? `/message/sendGroupMessages/${selectedUser._id}`
              : `/message/send/${selectedUser._id}`;
              
          const response = await axiosIntance.post(
            endpoint,
            { text, image },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          
          // Add new message to the messages array
          set(state => ({
            messages: [...state.messages, response.data],
            loading: false,
            error: null
          }));
          
          return response.data;
        } catch (error) {
          set({ loading: false, error: error.response?.data || error.message });
          throw error;
        }
    },


    subscribeToMessages: () => {
      const { selectedUser } = get();
      if (!selectedUser) return;

      const socket = useAuthStore.getState().socket;
      if (!socket) return;

      if (selectedUser.isGroup) {
        socket.emit("joinGroup", selectedUser._id);
      }

      // Handle both direct and group messages
      socket.on('newMessage', (newMessage) => {
          const isGroup = selectedUser.isGroup;
          
          if (isGroup) {
              // For group messages, check if it's for the current group
              if (newMessage.groupId === selectedUser._id) {
                  set({
                      messages: [...get().messages, newMessage],
                      isTyping: false 
                  });
              }
          } else {
              // For direct messages, check if it's from the selected user
              if (newMessage.senderId === selectedUser._id) {
                  set({
                      messages: [...get().messages, newMessage],
                      isTyping: false 
                  });
              }
          }
      });
      
      get().subscribeToTyping();
      get().subscribeToGlobalTyping();
  },


    unsubscribeFromMessages: ()=>{
         const socket =useAuthStore.getState().socket; 
         if (!socket) return;

         socket.off('newMessage');
         get().unsubscribeFromTyping();
    },

    sendTypingStatus: () => {
      const { selectedUser, typingTimeout } = get();
      if (!selectedUser) return;
      
      const socket = useAuthStore.getState().socket;
      if (!socket) return;
      
      // Clear any existing timeout
      if (typingTimeout) clearTimeout(typingTimeout);
      
      const isGroup = selectedUser.isGroup;
      
      // Emit typing event
      if (isGroup) {
          socket.emit("groupTyping", { groupId: selectedUser._id });
      } else {
          socket.emit("typing", { recipientId: selectedUser._id });
      }

      const timeout = setTimeout(() => {
          if (isGroup) {
              socket.emit("groupStopTyping", { groupId: selectedUser._id });
          } else {
              socket.emit("stopTyping", { recipientId: selectedUser._id });
          }
      }, 2000);
      
      set({ typingTimeout: timeout });
  },


  subscribeToTyping: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    const isGroup = selectedUser.isGroup;
    
    if (isGroup) {
        socket.on("userGroupTyping", (data) => {
            if (data.groupId === selectedUser._id && data.senderId !== useAuthStore.getState().authUser._id) {
                set({ isTyping: true });
            }
        });
        
        socket.on("userGroupStopTyping", (data) => {
            if (data.groupId === selectedUser._id) {
                set({ isTyping: false });
            }
        });
    } else {
        socket.on("userTyping", (data) => {
            if (data.senderId === selectedUser._id) {
                set({ isTyping: true });
            }
        });
        
        socket.on("userStopTyping", (data) => {
            if (data.senderId === selectedUser._id) {
                set({ isTyping: false });
            }
        });
    }
},

subscribeToGlobalTyping: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    // Global typing events for all users (for sidebar)
    socket.on("userTyping", (data) => {
      set(state => {
        // Add typing user to the array if not already there
        if (!state.typingUsers.includes(data.senderId)) {
          return { typingUsers: [...state.typingUsers, data.senderId] };
        }
        return state;
      });
    });
    
    socket.on("userStopTyping", (data) => {
      set(state => ({
        typingUsers: state.typingUsers.filter(id => id !== data.senderId)
      }));
    });
    
    // Group typing events (for sidebar)
    socket.on("userGroupTyping", (data) => {
        set(state => {
          // Track both the user who's typing and the group they're typing in
          const typingKey = `${data.senderId}:${data.groupId}`;
          
          if (!state.groupTypingUsers) {
            state.groupTypingUsers = [];
          }
          
          if (!state.groupTypingUsers.includes(typingKey)) {
            return { 
              groupTypingUsers: [...state.groupTypingUsers, typingKey],
              // Also maintain the regular typingUsers array for backward compatibility
              typingUsers: [...state.typingUsers, data.senderId]
            };
          }
          return state;
        });
      });
    
      socket.on("userGroupStopTyping", (data) => {
        set(state => {
          const typingKey = `${data.senderId}:${data.groupId}`;
          
          return {
            groupTypingUsers: state.groupTypingUsers ? 
              state.groupTypingUsers.filter(key => key !== typingKey) : 
              [],
            typingUsers: state.typingUsers.filter(id => id !== data.senderId)
          };
        });
      });
  },

unsubscribeFromTyping: () => {
  const socket = useAuthStore.getState().socket;
  if (!socket) return;
  
  socket.off("userTyping");
  socket.off("userStopTyping");
  socket.off("userGroupTyping");
  socket.off("userGroupStopTyping");
  
  const { typingTimeout } = get();
  if (typingTimeout) clearTimeout(typingTimeout);
  
  set({ isTyping: false, typingTimeout: null });
}, 

unsubscribeFromGlobalTyping: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    socket.off("userTyping");
    socket.off("userStopTyping");
    socket.off("userGroupTyping");
    socket.off("userGroupStopTyping");
    
    set({ typingUsers: [],groupTypingUsers: [] });
  },

clearChat: async (userId) => {
  const { selectedUser } = get();
  const isGroup = selectedUser?.isGroup;
  
  set({ isClearingChat: true });
  
  try {
      const endpoint = isGroup 
          ? "/message/clearGroupMessages"
          : "/message/clear";
          
      const data = isGroup 
          ? { groupId: userId }
          : { userId };
          
      await axiosIntance.post(endpoint, data);
      
      // Clear messages in local state
      set({ messages: [] });
      
      // Notify socket about cleared chat
      const { socket } = useAuthStore.getState();
      if (socket) {
          if (isGroup) {
              socket.emit("groupChatCleared", { 
                  groupId: userId,
                  senderId: useAuthStore.getState().authUser._id 
              });
          } else {
              socket.emit("chatCleared", { 
                  receiverId: userId,
                  senderId: useAuthStore.getState().authUser._id 
              });
          }
      }
      
      return true;
  } catch (error) {
      console.error("Error clearing chat:", error);
      toast.error("Failed to clear chat");
      return false;
  } finally {
      set({ isClearingChat: false });
  }
},

    setSelectedUser: (selectedUser)=> set({selectedUser})
}))