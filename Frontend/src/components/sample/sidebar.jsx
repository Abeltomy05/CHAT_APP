import React, { useEffect, useState } from 'react'
import { useChatStore } from '../../store/useChatStore'
import SidebarSkeleton from '../Skeletons/SidebarSkeleton';
import { Search,Users,MessageSquare ,UserPlus } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import CreateGroupModal from './createGroupModal';
import SidebarTypingIndicator from './TypingSidebar';

const Sidebar = () => {
    const {getUsers, users, selectedUser, setSelectedUser, isUsersLoading,getGroups, groups,typingUsers,subscribeToGlobalTyping  } = useChatStore();
    const {onlineUsers,authUser} = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [showOnlineOnly,setShowOnlineOnly] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [activeTab, setActiveTab] = useState('contacts');

 
    useEffect(()=>{
        getUsers();
        getGroups();

        subscribeToGlobalTyping();
    },[getUsers, getGroups, subscribeToGlobalTyping])

    const filteredUsers = users
                       //for online only
                      .filter(user => showOnlineOnly ? onlineUsers.includes(user._id) : true)
                      //search query
                      .filter(user => user.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
    
                      const filteredGroups = groups
                      .filter(group => group.name.toLowerCase().includes(searchQuery.toLowerCase()));

   const isUserTyping = (userId) => {
        return typingUsers && typingUsers.includes(userId);
    };
    
    const isGroupTyping = (group) => {
        if (!typingUsers || !group || !group._id) return false;
        
        // Check if we have the groupTypingUsers array available
        if (useChatStore.getState().groupTypingUsers) {
            const groupTypingUsers = useChatStore.getState().groupTypingUsers;
            
            // Check if any user is typing in this specific group
            return groupTypingUsers.some(typingKey => {
                const [_, groupId] = typingKey.split(':');
                return groupId === group._id;
            });
        } 
    
        // Fallback to the old method if groupTypingUsers isn't available
        return group.members && 
               group.members.some(memberId => 
                  memberId !== authUser._id && typingUsers.includes(memberId)
               );
    };
    if(isUsersLoading) return <SidebarSkeleton />
  
    return (
      <aside className="h-full w-27 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
          <div className="border-b border-base-300 w-full pt-4 flex flex-col h-full">
              {/* Tabs */}
              <div className="flex items-center px-4 mb-3">
                  <button 
                      onClick={() => setActiveTab('contacts')}
                      className={`flex items-center gap-2 p-2 flex-1 justify-center rounded-l-lg ${
                          activeTab === 'contacts' ? 'bg-base-300 font-medium' : 'hover:bg-base-200'
                      }`}>
                      <Users className="size-5" />
                      <span className="text-sm">Contacts</span>
                  </button>
                  <button 
                      onClick={() => setActiveTab('groups')}
                      className={`flex items-center gap-2 p-2 flex-1 justify-center rounded-r-lg ${
                          activeTab === 'groups' ? 'bg-base-300 font-medium' : 'hover:bg-base-200'
                      }`}>
                      <MessageSquare className="size-5" />
                      <span className="text-sm">Groups</span>
                  </button>
              </div>

              {activeTab === 'contacts' && (
                  <div className='mt-1 ml-5 hidden lg:flex items-center gap-2'>
                      <label className='cursor-pointer flex items-center gap-2'>
                          <input type="checkbox" checked={showOnlineOnly} 
                              onChange={(e) => setShowOnlineOnly(e.target.checked)}
                              className='checkbox checkbox-xs'
                          />
                          <span className='text-xs'>Show online only</span>
                      </label>
                      <span className='text-xs text-zinc-500'>({onlineUsers.length - 1} online)</span>
                  </div>
              )}

              {activeTab === 'groups' && (
                  <div className='mt-1 ml-5 hidden lg:flex items-center'>
                      <button 
                          onClick={() => setShowCreateGroupModal(true)}
                          className='text-xs flex items-center gap-1 bg-base-200 hover:bg-base-300 p-1.5 px-2 rounded-md transition-colors'>
                          <UserPlus className="size-3.5" />
                          Create New Group
                      </button>
                  </div>
              )}

              <div className="px-2 my-3">
                  <div className="relative">
                      <input
                          type="text"
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-3 lg:px-4 py-1.5 lg:py-2 text-sm lg:text-base
                              bg-base-200 rounded-lg pr-8 lg:pr-10 
                              focus:outline-none focus:ring-2 
                              focus:ring-base-300 transition-all"
                      />
                      <Search className="absolute right-2 lg:right-3 top-1/2 transform 
                          -translate-y-1/2 text-zinc-400 
                          size-4 lg:size-5" />
                  </div>
              </div>

              {/* Contacts List */}
              {activeTab === 'contacts' && (
                  <div className='overflow-y-auto w-full py-3 flex-grow scrollbar-thin'>
                      {filteredUsers.length !== 0 ? (
                          filteredUsers.map((user) => (
                              <button
                                  key={user._id}
                                  onClick={() => setSelectedUser({ ...user, isGroup: false })}
                                  className={`
                                  w-full px-2 py-3 flex items-center gap-3
                                  hover:bg-base-300 transition-colors
                                  ${selectedUser?._id === user._id && !selectedUser?.isGroup ? "bg-base-300 ring-1 ring-base-300" : ""}
                                  `}
                              >
                                  <div className="relative flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14">
                                      {user.profilePic ? (
                                          <img
                                              src={user.profilePic}
                                              alt={user.fullName?.charAt(0) || "?"}
                                              className="w-12 h-12 lg:w-14 lg:h-14 rounded-full object-cover"
                                               referrerPolicy="no-referrer"
                                                crossOrigin="anonymous"
                                          />
                                      ) : (
                                        <span className="w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center font-semibold text-lg lg:text-xl text-white bg-gray-500 rounded-full border-2 border-gray-400">
                                        {user.fullName?.charAt(0) || "?"}
                                      </span>
                                      )}
                                      {onlineUsers.includes(user._id) && (
                                          <span className="absolute bottom-0.5 right-1 lg:right-2 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                                      )}
                                  </div>

                                  <div className="flex-1 min-w-0 text-left">
                                      <div className="font-medium truncate text-sm lg:text-base">
                                          {user.fullName}
                                      </div>
                                      <div className="text-xs lg:text-sm text-zinc-400">
                                          {isUserTyping(user._id) ? (
                                              <SidebarTypingIndicator />
                                          ) : (
                                              onlineUsers.includes(user._id) ? "Online" : "Offline"
                                          )}
                                      </div>
                                  </div>
                              </button>
                          ))
                      ) : (
                          <div className='text-center text-zinc-500 py-4'>No users found</div>
                      )}
                  </div>
              )}

              {/* Groups List */}
              {activeTab === 'groups' && (
                  <div className='overflow-y-auto w-full py-3 flex-grow scrollbar-thin'>
                      <div className="flex items-center justify-center mb-2 lg:hidden">
                          <button 
                              onClick={() => setShowCreateGroupModal(true)}
                              className='text-xs flex items-center gap-1 bg-base-200 hover:bg-base-300 p-1.5 px-2 rounded-md transition-colors'>
                              <UserPlus className="size-3.5" />
                              Create Group
                          </button>
                      </div>

                      {filteredGroups.length !== 0 ? (
                          filteredGroups.map((group) => (
                              <button
                                  key={group._id}
                                  onClick={() => setSelectedUser({ ...group, isGroup: true })}
                                  className={`
                                  w-full px-2 py-3 flex items-center gap-3
                                  hover:bg-base-300 transition-colors
                                  ${selectedUser?._id === group._id && selectedUser?.isGroup ? "bg-base-300 ring-1 ring-base-300" : ""}
                                  `}
                              >
                                  <div className="relative flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14">
                                      {group.groupImage ? (
                                          <img
                                              src={group.groupImage}
                                              alt={group.name}
                                              className="w-12 h-12 lg:w-16 lg:h-16 rounded-full object-cover"
                                          />
                                      ) : (
                                          <span className="flex items-center justify-center font-bold text-xl border-2 rounded-full w-full h-full bg-indigo-600 text-white">
                                              {group.name?.charAt(0) || "G"}
                                          </span>
                                      )}
                                  </div>

                                  <div className="flex-1 min-w-0 text-left">
                                      <div className="font-medium truncate text-sm lg:text-base">
                                          {group.name}
                                      </div>
                                      <div className="text-xs lg:text-sm text-zinc-400">
                                          {isGroupTyping(group) ? (
                                              <SidebarTypingIndicator />
                                          ) : (
                                              `${group.members?.length || 0} members`
                                          )}
                                      </div>
                                  </div>
                              </button>
                          ))
                      ) : (
                          <div className='text-center text-zinc-500 py-4'>
                              No groups found
                          </div>
                      )}
                  </div>
              )}
          </div>
          
          {/* Create Group Modal */}
          {showCreateGroupModal && (
              <CreateGroupModal 
                  onClose={() => setShowCreateGroupModal(false)} 
                  users={users}
              />
          )}
      </aside>
  )
}

export default Sidebar