
import { useState,useEffect } from "react"
import { Camera, User, Mail, Calendar, Shield, Users, Settings, LogOut, Loader2, UserX } from "lucide-react"
import { motion } from "framer-motion"
import { useAuthStore } from "../store/useAuthStore"
import { axiosIntance } from "../lib/axios"
import toast from 'react-hot-toast';

export default function ProfileDashboard() {
  const { authUser, isUpdatingProfile, profileUpdate } = useAuthStore()
  const [selectedImg, setSelectedImg] = useState(null)
  const [activeTab, setActiveTab] = useState("profile")
  const { blockedUsers, getBlockedUsers, setBlockedUsers } = useAuthStore();


  useEffect(() => {
    getBlockedUsers();
  }, [getBlockedUsers]);


  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = async () => {
      const base64Image = reader.result
      setSelectedImg(base64Image)
      await profileUpdate({ profilePic: base64Image })
    }
  }

  const handleUnblockUser = async (userId) => {
    try {
      await axiosIntance.post('/user/unblock', { userId });

      const updatedBlockedUsers = blockedUsers.filter(user => user._id !== userId);
      setBlockedUsers(updatedBlockedUsers);
      
      toast.success('User unblocked successfully');
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error(error.response?.data?.message || 'Failed to unblock user');
    }
  };

  const getInitial = (name) => {
    if (!name) return '?'; 
    return name.charAt(0).toUpperCase(); 
  };

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <header className="sticky top-0 z-10  border-b  shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold ">Account Settings</h1>
          <div className="flex items-center gap-4">
            <button className="flex items-center px-3 py-1.5 text-sm ">
              <Settings className="h-5 w-5 mr-2" />
              Settings
            </button>
            <button className="flex items-center px-3 py-1.5 text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400">
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className=" rounded-lg shadow-sm border  ">
            <div className="p-4 border-b ">
              <h2 className="font-semibold text-lg ">Navigation</h2>
            </div>
            <nav className="p-2">
              <button
                className={`flex items-center w-full text-left px-3 py-2 rounded-md ${
                  activeTab === "profile"
                    ? "bg-[#4a2e26] text-white"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onClick={() => setActiveTab("profile")}
              >
                <User className="mr-2 h-5 w-5" />
                Profile
              </button>
              <button
                className={`flex items-center w-full text-left px-3 py-2 rounded-md ${
                  activeTab === "blocked"
                    ? "bg-[#4a2e26] text-white"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onClick={() => setActiveTab("blocked")}
              >
                <UserX className="mr-2 h-5 w-5" />
                Blocked Users
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className=" rounded-lg shadow-sm border ">
                <div className="p-4 border-b ">
                  <h2 className="font-semibold text-lg ">Profile Information</h2>
                  <p className="text-sm ">Update your profile details and photo</p>
                </div>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Profile Picture */}
                    <div className="flex flex-col items-center">
                        <div className="relative">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-md overflow-hidden"
                          >
                            {authUser && authUser.profilePic ? (
                              <img
                                src={selectedImg || authUser.profilePic}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="flex items-center justify-center font-bold text-6xl border-2 rounded-full w-full h-full bg-gray-500">
                                {authUser && authUser.fullName ? authUser.fullName.charAt(0) : "?"}
                              </span>
                            )}
                          </motion.div>
                          <label
                            htmlFor="profile-upload"
                            className="absolute bottom-0 right-0 bg-[#4a2e26] p-2 rounded-full cursor-pointer shadow-lg hover:bg-[#5f3e31] transition-colors duration-300"
                          >
                            <Camera size={20} className="text-white" />
                          </label>
                          <input
                            id="profile-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </div>
                        <p className="text-sm">Click the camera icon <br /> to update</p>
                      </div>

                    {/* Profile Details */}
                    <div className="flex-1 space-y-4  w-full">
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-center space-x-3 p-3 bg-base-300 rounded-lg "
                      >
                        <User className="text-[#4a2e26] dark:text-white" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
                          <p className="font-semibold text-gray-700 dark:text-gray-200">
                            {authUser?.fullName || "JohnDoe123"}
                          </p>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-center space-x-3 p-3 bg-base-300 rounded-lg"
                      >
                        <Mail className="text-[#4a2e26] dark:text-white" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                          <p className="font-semibold text-gray-700 dark:text-gray-200">
                            {authUser?.email || "johndoe@example.com"}
                          </p>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-center space-x-3 p-3 bg-base-300 rounded-lg"
                      >
                        <Calendar className="text-[#4a2e26] dark:text-white" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Member since</p>
                          <p className="font-semibold text-gray-700 dark:text-gray-200">
                            {authUser?.createdAt || "January 1, 2023"}
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-8 bg-[#4a2e26] text-white py-3 rounded-lg hover:bg-[#5f3e31] transition-colors duration-300"
                  >
                    {isUpdatingProfile ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Updating...</span>
                      </div>
                    ) : (
                      "You can update your profile picture here "
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "blocked" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className=" rounded-lg shadow-sm border ">
                <div className="p-4 border-b ">
                  <h2 className="font-semibold text-lg ">Blocked Users</h2>
                  <p className="text-sm ">
                    Manage users you've blocked from contacting you
                  </p>
                </div>
                <div className="p-6">
                  {blockedUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <UserX className="mx-auto h-12 w-12 " />
                      <h3 className="mt-2 text-sm font-medium ">No blocked users</h3>
                      <p className="mt-1 text-sm ">
                        You haven't blocked any users yet.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto pr-2">
                      <div className="space-y-4">
                        {blockedUsers.map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center justify-between p-4 bg-base-300  rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="relative w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 overflow-hidden">
                             {user.profilePic ? (<img
                                  src={user.profilePic}
                                  alt={user.fullName}
                                  className="w-full h-full object-cover"
                                />):
                                (<span className="absolute inset-0 flex items-center justify-center font-medium">
                                  {user.fullName.charAt(0)}
                                </span>)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnblockUser(user._id)}
                              className="px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-md hover:text-white hover:bg-red-500 hover:border-red-500 transition-colors"
                            >
                              Unblock
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}

