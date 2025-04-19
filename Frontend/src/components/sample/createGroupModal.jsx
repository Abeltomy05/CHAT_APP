import React, { useState } from 'react';
import { X, Check, Users, Upload, Image as ImageIcon } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore'; 
import toast from 'react-hot-toast';

const CreateGroupModal = ({ onClose, users }) => {
  const { createGroup } = useChatStore();
  const { authUser } = useAuthStore();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupImage, setGroupImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out current user and already selected users, and apply search query
  const filteredUsers = users
    .filter(user => user._id !== authUser._id)
    .filter(user => !selectedUsers.some(selectedUser => selectedUser._id === user._id))
    .filter(user => user.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // For now, we'll just store the file object
      // In a real app, you'd handle uploading this to a server
      setGroupImage(file);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery('');
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user._id !== userId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one group member');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Convert the File object to base64 if needed
      let imageBase64 = null;
      if (groupImage) {
        imageBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(groupImage);
          reader.onloadend = () => {
            resolve(reader.result);
          };
        });
      }
      
      await createGroup({
        name: groupName,
        members: selectedUsers.map(user => user._id),
        groupImage: imageBase64
      });
      
      toast.success('Group created successfully');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Create New Group</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-base-200">
            <X className="size-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-grow overflow-auto p-4">
          {/* Group Name Input */}
          <div className="mb-4">
            <label htmlFor="groupName" className="block text-sm font-medium mb-1">
              Group Name
            </label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 bg-base-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-base-300"
              placeholder="Enter group name"
              required
            />
          </div>
          
          {/* Group Image Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Group Image (Optional)
            </label>
            <div className="flex items-center gap-3">
              <div className="size-16 rounded-full bg-base-200 flex items-center justify-center overflow-hidden">
                {groupImage ? (
                  <img 
                    src={URL.createObjectURL(groupImage)} 
                    alt="Group" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-6 text-zinc-500" />
                )}
              </div>
              <label className="cursor-pointer flex items-center gap-2 bg-base-200 hover:bg-base-300 px-3 py-2 rounded-lg transition-colors">
                <Upload className="size-4" />
                <span className="text-sm">Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          
          {/* Selected Members */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Selected Members ({selectedUsers.length})
            </label>
            {selectedUsers.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedUsers.map(user => (
                  <div key={user._id} className="flex items-center gap-1.5 bg-base-200 rounded-full pl-1 pr-2 py-1">
                    <div className="size-6 rounded-full bg-gray-500 flex items-center justify-center overflow-hidden">
                      {user.profilePic ? (
                        <img src={user.profilePic} alt={user.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-medium text-white">{user.fullName.charAt(0)}</span>
                      )}
                    </div>
                    <span className="text-xs">{user.fullName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(user._id)}
                      className="ml-1 text-zinc-500 hover:text-zinc-700"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-zinc-500 text-sm mb-3">
                No members selected
              </div>
            )}
          </div>
          
          {/* Member Search */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Add Members
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-base-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-base-300"
              placeholder="Search users..."
            />
          </div>
          
          {/* User List */}
          <div className="mb-4 max-h-40 overflow-y-auto bg-base-200 rounded-lg">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => handleUserSelect(user)}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-base-300 transition-colors"
                >
                  <div className="size-8 rounded-full bg-gray-500 flex items-center justify-center overflow-hidden">
                    {user.profilePic ? (
                      <img src={user.profilePic} alt={user.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-medium text-white">{user.fullName.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-sm">{user.fullName}</span>
                  <Check className="size-4 ml-auto text-zinc-400" />
                </button>
              ))
            ) : (
              <div className="text-center py-3 text-zinc-500 text-sm">
                {searchQuery ? 'No users found' : 'No more users available'}
              </div>
            )}
          </div>
        </form>
        
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-base-300 hover:bg-base-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {isLoading ? 'Creating...' : 'Create Group'}
            <Users className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;