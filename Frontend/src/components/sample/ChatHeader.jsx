import React, { useState,useRef,useEffect } from 'react'
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { X, MoreVertical, Trash, Ban, UserCheck, AlertTriangle,Users, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { axiosIntance } from '../../lib/axios';


const ChatHeader = () => {
    const { selectedUser, setSelectedUser } = useChatStore();
    const { onlineUsers, authUser, socket, blockedUsers, setBlockedUsers } = useAuthStore();

    const navigate = useNavigate();

    const [showMenu, setShowMenu] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showLeaveGroupModal, setShowLeaveGroupModal] = useState(false);
    const [showGroupMembers, setShowGroupMembers] = useState(false);

    const menuRef = useRef(null);
    const modalRef = useRef(null);
    const leaveGroupModalRef = useRef(null);
    const membersRef = useRef(null);

    const [isBlocked, setIsBlocked] = useState(false);
    const [fullGroupData, setFullGroupData] = useState(null);
  
    useEffect(() => {
      if (selectedUser && blockedUsers) {
        setIsBlocked(blockedUsers.some(user => user._id === selectedUser._id));
      }
    }, [selectedUser, blockedUsers]);

    useEffect(() => {
      if (selectedUser?.isGroup && showGroupMembers && !fullGroupData) {
        fetchFullGroupData();
      }
    }, [selectedUser, showGroupMembers]);

    const fetchFullGroupData = async () => {
      try {
        const response = await axiosIntance.get(`/message/getSinglegroup/${selectedUser._id}`);
        setFullGroupData(response.data);
        console.log("groupData",response.data)
      } catch (error) {
        console.error("Error fetching group details:", error);
        toast.error("Failed to load group member details");
      }
    };

    const requestMediaPermissions = async (videoEnabled = true) => {
      if (!selectedUser || !onlineUsers.includes(selectedUser._id) || !socket) {
        toast.error("User is offline");
        return;
      }
      
      try {
        // Just check if permissions are already granted without requesting
        const permissions = await navigator.permissions.query({ name: 'camera' });
        const micPermissions = await navigator.permissions.query({ name: 'microphone' });
        
        // If permissions aren't granted, let the CallScreen handle the request
        if (permissions.state === 'denied' || micPermissions.state === 'denied') {
          toast.error("You'll need to grant camera/microphone permissions on the next screen");
        }
        
        // Create a clean room ID - ensure we're using the right user ID for the call
        const roomId = `${socket.id}-${selectedUser._id}`;
        console.log("Creating call room:", roomId);
        navigate(`/call/${roomId}`);
      } catch (error) {
        console.error("Permission check error:", error);
        // Still navigate, let CallScreen handle permissions
        const roomId = `${socket.id}-${selectedUser._id}`;
        navigate(`/call/${roomId}`);
      }
    };

    const handleVideoCall = () => {
      if (!socket || !socket.connected) {
        toast.error("Not connected to chat server. Please refresh the page.");
        return;
      }
      requestMediaPermissions(true);
    };

    const handleVoiceCall = () => {
      requestMediaPermissions(false);
    };

    const handleClearChat = async() => {
      if (selectedUser) {
        const { clearChat } = useChatStore.getState();
        const success = await clearChat(selectedUser._id);
        
        if (success) {
          toast.success("Chat cleared successfully");
        }
        
        setShowMenu(false);
      }
    };

    const openBlockConfirmation = () => {
      setShowBlockModal(true);
      setShowMenu(false);
    };

    const openLeaveGroupConfirmation = () => {
      setShowLeaveGroupModal(true);
      setShowMenu(false);
    };

    const handleBlockUser = async () => {
      try {
        const response = await axiosIntance.post('/user/block', { userId: selectedUser._id });
        
        // Update the blocked users list in auth store
        const { getBlockedUsers } = useAuthStore.getState();
        await getBlockedUsers();
        
        toast.success(`${selectedUser.fullName} has been blocked`);
        setShowBlockModal(false);
        setSelectedUser(null);
      } catch (error) {
        toast.error(error.response?.data?.error || "Failed to block user");
        setShowBlockModal(false);
      }
    };

    const handleUnblockUser = async () => {
      try {
        const response = await axiosIntance.post('/user/unblock', { userId: selectedUser._id });
        
        // Update the blocked users list in auth store
        const { getBlockedUsers } = useAuthStore.getState();
        await getBlockedUsers();
        
        toast.success(`${selectedUser.fullName} has been unblocked`);
        setShowMenu(false);
      } catch (error) {
        toast.error(error.response?.data?.error || "Failed to unblock user");
      }
    };

    const handleLeaveGroup = async () => {
      try {
        const { leaveGroup } = useChatStore.getState();
        const response = await leaveGroup(selectedUser._id);

        const successMessage = response.message || `You have left ${selectedUser.name}`;
        toast.success(successMessage);
        setShowLeaveGroupModal(false);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to leave group");
        setShowLeaveGroupModal(false);
      }
    };

    const toggleGroupMembers = () => {
      setShowGroupMembers(!showGroupMembers);
    };

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setShowMenu(false);
        }
        if (modalRef.current && !modalRef.current.contains(event.target) && showBlockModal) {
          setShowBlockModal(false);
        }
        if (leaveGroupModalRef.current && !leaveGroupModalRef.current.contains(event.target) && showLeaveGroupModal) {
          setShowLeaveGroupModal(false);
        }
        if (membersRef.current && !membersRef.current.contains(event.target) && showGroupMembers) {
          setShowGroupMembers(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showBlockModal, showLeaveGroupModal]);

    const displayName = selectedUser.isGroup ? selectedUser.name : selectedUser.fullName;
    const statusText = selectedUser.isGroup 
    ? `${selectedUser.members?.length || 0} members` 
    : onlineUsers.includes(selectedUser._id) ? "Online" : "Offline";

    const groupMembers = fullGroupData?.members || selectedUser.members || [];
    const groupAdmin = fullGroupData?.admin?._id || selectedUser.admin;


    return (
      <>
         <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                {selectedUser.isGroup ? (
                  selectedUser.groupImage ? (
                    <img 
                      src={selectedUser.groupImage} 
                      alt={selectedUser.name}
                      onError={(e) => {
                        e.target.onerror = null;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                      {selectedUser.name?.charAt(0) || "G"}
                    </div>
                  )
                ) : (
                  <img 
                    src={selectedUser.profilePic || "/avatar.png"} 
                    alt={displayName}
                    onError={(e) => {
                      e.target.onerror = null;
                    }}
                  />
                )}
              </div>
            </div>
    
              {/* User info */}
              <div>
              <h3 className="font-medium">{displayName}</h3>
              <p className="text-sm text-base-content/70">
                {statusText}
              </p>
            </div>
          </div>

            {/* Call actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* {!selectedUser.isGroup && (
                <>
                  <button 
                    onClick={handleVoiceCall}
                    className={`p-2 rounded-full ${onlineUsers.includes(selectedUser._id) && !isBlocked ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 cursor-not-allowed'}`}
                    disabled={!onlineUsers.includes(selectedUser._id) || isBlocked}
                    title={isBlocked ? "Cannot call blocked user" : "Voice Call"}
                  >
                    <Phone size={20} />
                  </button>
                  
                  <button 
                    onClick={handleVideoCall}
                    className={`p-2 rounded-full ${onlineUsers.includes(selectedUser._id) && !isBlocked ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-400 cursor-not-allowed'}`}
                    disabled={!onlineUsers.includes(selectedUser._id) || isBlocked}
                    title={isBlocked ? "Cannot call blocked user" : "Video Call"}
                  >
                    <Video size={20} />
                  </button>
                </>
              )} */}

            {selectedUser.isGroup && (
              <div className="relative" ref={membersRef}>
                <button 
                  onClick={toggleGroupMembers}
                  className="p-2 rounded-full text-indigo-500 hover:bg-indigo-50"
                  title="View members"
                >
                  <Users size={20} />
                </button>
                
                {/* Group Members List */}
                {showGroupMembers && (
                  <div className="absolute right-0 mt-3 w-64 max-h-96 overflow-y-auto rounded-md bg-base-100 shadow-lg z-10 border border-base-300">
                    <div className="p-3 border-b border-base-200">
                      <h3 className="font-medium text-sm">Group Members</h3>
                      <p className="text-xs text-base-content/70">{groupMembers.length} members</p>
                    </div>
                    <div className="py-2">
                      {groupMembers.map((member) => (
                        <div key={member._id} className="flex items-center gap-3 px-4 py-2 hover:bg-base-200">
                          <div className="avatar">
                            <div className="size-8 rounded-full">
                              <img 
                                src={member.profilePic || "/avatar.png"} 
                                alt={member.fullName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/avatar.png";
                                }}
                                />
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium">{member.fullName}</p>
                                <p className="text-xs text-base-content/70">
                                  {onlineUsers.includes(member._id) ? "Online" : "Offline"}
                                  {member._id === groupAdmin  && " • Admin"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              
              {/* Menu button (three dots) */}
              <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full hover:bg-base-200"
                title="More options"
              >
                <MoreVertical size={20} />
              </button>
                
                {/* Dropdown menu */}
                {showMenu && (
                <div className="absolute right-0 mt-3 w-48 rounded-md bg-base-300 shadow-lg z-10 border border-base-100">
                  <div className="py-1">
                    <button
                      onClick={handleClearChat}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-base-200"
                    >
                      <Trash size={16} />
                      Delete for me
                    </button>
                    
                      {/* Only show block/unblock for individual users */}
                      {!selectedUser.isGroup && isBlocked ? (
                      <button
                        onClick={handleUnblockUser}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-green-600 hover:bg-base-200"
                      >
                        <UserCheck size={16} />
                        Unblock user
                      </button>
                      ) : !selectedUser.isGroup && (
                      <button
                        onClick={openBlockConfirmation}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-base-200"
                      >
                        <Ban size={16} />
                        Block user
                      </button>
                    )}
                       {selectedUser.isGroup &&(
                      <button
                        onClick={openLeaveGroupConfirmation}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-base-200"
                      >
                        <LogOut size={16} />
                        Leave group
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
    
              {/* Close button */}
              <button 
              onClick={() => setSelectedUser(null)}
              className="hidden sm:block"
            >
              <X />
            </button>
          </div>
        </div>
      </div>

        {/* Block User Confirmation Modal */}
         {showBlockModal && !selectedUser.isGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            ref={modalRef} 
            className="bg-base-200 p-6 rounded-lg shadow-lg max-w-md w-full mx-4"
          >
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-medium">Block User</h3>
            </div>
            
            <p className="mb-6">
              Are you sure you want to block <span className="font-semibold">{selectedUser.fullName}</span>? 
              This will:
            </p>
            
            <ul className="mb-6 space-y-2 list-disc pl-5">
              <li>Prevent them from sending you messages</li>
              <li>Disable voice and video calls</li>
            </ul>
            
            <p className="mb-6 text-sm text-base-content/70">
              You can unblock them later from your settings (user icon) if you change your mind.
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 rounded bg-base-300 hover:bg-base-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleBlockUser}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Block User
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveGroupModal && selectedUser.isGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            ref={leaveGroupModalRef} 
            className="bg-base-200 p-6 rounded-lg shadow-lg max-w-md w-full mx-4"
          >
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <LogOut size={24} />
              <h3 className="text-lg font-medium">Leave Group</h3>
            </div>
            
            <p className="mb-6">
              Are you sure you want to leave <span className="font-semibold">{selectedUser.name}</span>? 
              This will:
            </p>
            
            <ul className="mb-6 space-y-2 list-disc pl-5">
              <li>Remove you from the group permanently</li>
              <li>Delete all your access to previous messages</li>
              <li>Require a new invitation to rejoin the group</li>
            </ul>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowLeaveGroupModal(false)}
                className="px-4 py-2 rounded bg-base-300 hover:bg-base-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleLeaveGroup}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Leave Group
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatHeader