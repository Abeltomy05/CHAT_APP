import { useState } from "react"
import { Settings, Eye, EyeOff, Mail, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore"
import toast from "react-hot-toast"
import Navbar from "../components/sample/navbar"

// Input component with transparent background
const Input = ({ type, name, placeholder, value, onChange, className, children }) => (
  <div className="relative">
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 border rounded-lg focus:outline-none bg-transparent"
    />
    {children}
  </div>
)

// Button component matching text color
const Button = ({ children, className, ...props }) => (
  <button
    className={`px-4 py-2 rounded-lg ${className}`}
    {...props}
  >
    {children}
  </button>
)

const MovingBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden">
    {[...Array(20)].map((_, i) => (
      <Mail
        key={i}
        size={76}
        className="absolute opacity-20 animate-float"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDuration: `${5 + Math.random() * 10}s`,
        }}
      />
    ))}
  </div>
)

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const { signup, isSigningUp } = useAuthStore()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    if(!formData.fullName && !formData.email && !formData.password) return toast.error("Please fill the fields")
    if (!formData.fullName) return toast.error("Full name is required")
    if (!formData.email) return toast.error("Email is required")
    else if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Email is invalid")
    if (!formData.password) return toast.error("Password is required")
    else if (formData.password.length < 6) return toast.error("Password must be at least 6 characters")
    if (formData.password !== formData.confirmPassword) return toast.error("Passwords do not match")
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = validateForm()
    if(success === true) signup(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-base-200 p-8 rounded-lg shadow-xl max-w-md w-full relative z-10">
      <h2 className="text-3xl font-bold text-center">Create Account</h2>
      <p className="text-xs mb-6 text-center">Get started with your free account</p>
      
      <div className="space-y-4">
        <Input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleChange}
        />

        <Input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />

        <Input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        >
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </Input>

        <Input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
      </div>

      <Button
        type="submit"
        className="w-full mt-6 text-white font-semibold"
        style={{ backgroundColor: 'var(--fallback-p,oklch(var(--p)))' }}
        disabled={isSigningUp}
      >
        {isSigningUp ? (
          <div className="flex items-center gap-2">
            <Loader2 className="size-5 animate-spin" />
            <span>Loading...</span>
          </div>
        ) : (
          "Sign Up"
        )}
      </Button>

      <div className="text-center mt-4">
        <p className="text-sm">
          Already have an account?{" "}
          <Link to="/login" className="link">
            Sign in
          </Link>
        </p>
      </div>

      {/* <div className="mt-4 text-center">
        <span>or</span>
      </div> */}

      {/* <Button
         type="button"
         className="w-full mt-4 flex items-center justify-center  border "
       >
         <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
           <path
             fill="#4285F4"
             d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
           />
           <path
             fill="#34A853"
             d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
           />
           <path
             fill="#FBBC05"
             d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
           />
           <path
             fill="#EA4335"
             d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
           />
           <path fill="none" d="M1 1h22v22H1z" />
         </svg>
         <span className="font-medium">Sign up with Google</span>
      </Button> */}
    </form>
  )
}

const SignupPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar/>
      <MovingBackground />
      <div className="flex items-center justify-center min-h-screen pt-16 px-4">
        <SignUpForm />
      </div>
    </div>
  )
}

export default SignupPage