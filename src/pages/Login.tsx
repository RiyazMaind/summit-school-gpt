import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/integrations/firebase/auth-context";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getCurrentSchool } from "@/config/schools";

export default function Login() {
  const navigate = useNavigate();
  const { login, userProfile, loading } = useAuth();
  const school = getCurrentSchool();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!loginId || !password) {
      toast.error("Please enter login ID and password");
      return;
    }

    setIsLoggingIn(true);
    try {
      await login(loginId, password);
      toast.success("Login successful!");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    if (!loading && userProfile) {
      const role = userProfile.role;
      if (role === "admin") navigate("/admin");
      else if (role === "teacher") navigate("/teacher");
      else if (role === "student") navigate("/student");
    }
  }, [loading, userProfile, navigate]);

  return (
    <motion.div
      className="min-h-screen grid md:grid-cols-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >

      {/* LEFT SIDE */}
      <div
        className="hidden md:flex relative items-center justify-center text-white overflow-hidden"
        style={{
          backgroundImage: `url('${school.background}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* subtle zoom */}
        <div className="absolute inset-0 scale-110 bg-[url('${school.background}')] bg-cover bg-center animate-[zoom_20s_linear_infinite]" />

        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 text-center px-10 max-w-md">

          {/* LOGO */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <img
              src={school.logo}
              alt="logo"
              className="h-44 w-44 object-contain rounded-full bg-white p-3 shadow-2xl hover:scale-105 transition-transform duration-300"
            />
          </motion.div>

          <motion.h1
            className="text-3xl font-semibold tracking-tight"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {school.name}
          </motion.h1>

          <motion.p
            className="text-gray-200 mt-4 text-sm leading-relaxed"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {school.description}
          </motion.p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center bg-[#F9FAFB] px-6">

        <motion.div
          className="w-full max-w-md bg-white p-8 rounded-xl shadow-md border border-gray-200"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >

          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Sign in to your account
          </h2>

          {/* LOGIN */}
          <div className="mb-4">
            <label className="text-sm text-gray-700">Login ID or Email</label>
            <Input
              type="text"
              placeholder="Enter your login ID"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="mt-1 border-gray-300 focus:border-[#D4AF37] focus:ring-[#D4AF37] transition-all duration-200"
            />
          </div>

          {/* PASSWORD */}
          <div className="mb-6">
            <label className="text-sm text-gray-700">Password</label>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 border-gray-300 focus:border-[#D4AF37] focus:ring-[#D4AF37] pr-10 transition-all duration-200"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Default password is same as your login ID
            </p>
          </div>

          {/* BUTTON */}
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#b8962e] text-black font-semibold 
            hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {isLoggingIn ? "Signing in..." : "Sign in"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {/* ROLES */}
          <div className="mt-6 text-xs text-gray-500 border-t pt-4">
            <p className="font-medium text-gray-700 mb-2">Access:</p>
            <p>Admin – Manage system</p>
            <p>Teacher – Create assessments</p>
            <p>Student – Learn & explore</p>
          </div>
        </motion.div>
      </div>

      {/* KEYFRAME (add in global css if needed) */}
      <style>
        {`
          @keyframes zoom {
            0% { transform: scale(1.05); }
            100% { transform: scale(1.15); }
          }
        `}
      </style>
    </motion.div>
  );
}