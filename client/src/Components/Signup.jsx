
import { useState } from "react";
import { X, User, Mail, Lock, Phone } from "lucide-react";
import { auth, GoogleProvider, GithubProvider } from "./Firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import google from '../assets/google.jpeg';
import Github from '../assets/github.png';

const Signup = () => {
  const navigate = useNavigate();
  const [openPopUp, setOpenPopUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredentials.user;

      await updateProfile(user, { displayName: name });

      console.log("Signup successful", user);
      navigate("/login");
    } catch (err) {
      console.error("Signup error", err.message);
    }
  };

  // Google Signup
  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, GoogleProvider);
      console.log("Google Signup Successful:", result.user);
      navigate("/login");
    } catch (err) {
      console.error("Google Signup Error:", err.message);
    }
  };

  // GitHub Signup
  const handleGithubSignup = async () => {
    try {
      const result = await signInWithPopup(auth, GithubProvider);
      console.log("GitHub Signup Successful:", result.user);
      navigate("/dashboard");
    } catch (err) {
      console.error("GitHub Signup Error:", err.message);
    }
  };
  const handleclick=()=>{
    navigate('/');
  }

  return (
    <div className="flex italic flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-pink-100">
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between bg-gray-800 text-white p-6 rounded-t-lg">
              <h2 className="text-2xl font-semibold">Create Account</h2>
              <button onClick={handleclick} className="text-white hover:text-indigo-200">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex items-center">
                <label htmlFor="name" className="w-1/3 text-sm font-medium text-gray-700">Full Name</label>
                <div className="relative w-2/3">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    id="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border text-black border-gray-300 rounded-md "
                    required
                  />
                </div>
              </div>

              <div className="flex items-center">
                <label htmlFor="email" className="w-1/3 text-sm font-medium text-gray-700">Email</label>
                <div className="relative w-2/3">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    id="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-black border border-gray-300 rounded-md "
                    required
                  />
                </div>
              </div>

              <div className="flex items-center">
                <label htmlFor="password" className="w-1/3 text-sm font-medium text-gray-700">Password</label>
                <div className="relative w-2/3">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    id="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-black border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center">
                <label htmlFor="confirmPassword" className="w-1/3 text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="relative w-2/3">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-black border border-gray-300 rounded-md "
                    required
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-gray-900 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md">
                Create Account
              </button>
            </form>
            <div className="flex justify-center my-2">
             <p className="text-gray-600">or</p>
            </div>


            <div className="flex justify-center gap-4">
            <button
                 type="button"
                 onClick={handleGoogleSignup}
                 className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-300 transition duration-300 hover:bg-gray-100"
               >
                 <img src={google} alt="Google Logo" className="w-8 h-8 rounded-full" />
               </button>

               <button
                 type="button"
                 onClick={handleGithubSignup}
                 className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-300 transition duration-300 hover:bg-gray-100"
               >
                 <img src={Github} alt="GitHub Logo" className="w-8 h-8 rounded-full" />
               </button>
             </div>

            <div className="px-6 pb-6 mt-2 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <a href="/login" className="text-gray-600 hover:text-gray-800 font-medium">Login</a>
              </p>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Signup;
