import { useState } from "react";
import { X, User, Mail, Lock, Phone, Calendar, Heart, Scale, Ruler, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { auth, GoogleProvider, GithubProvider } from "./Firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./Firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import google from '../assets/google.jpeg';
import Github from '../assets/github.png';
import LoginModal from "./LoginModal";

const Signup = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [step, setStep] = useState(1); // 1: Account, 2: Personal Details
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Account details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Personal details (optional)
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");

  const [createdUser, setCreatedUser] = useState(null);

  // Step 1: Create account
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredentials.user;
      await updateProfile(user, { displayName: name });
      setCreatedUser(user);
      localStorage.setItem("Email", email);
      localStorage.setItem("Name", name);
      setStep(2); // Move to personal details ste
    } catch (err) {
      console.error("Signup error", err.message);
      alert(err.message);
    }
    setIsLoading(false);
  };

  // Step 2: Save personal details
  const handleSaveDetails = async () => {
    if (!createdUser) return;
    setIsLoading(true);
    try {
      const userRef = doc(db, "users", createdUser.uid);
      await setDoc(userRef, {
        phone,
        dob,
        gender,
        bloodGroup,
        weight,
        height,
        emergencyContact: {
          name: emergencyName,
          phone: emergencyPhone,
          relation: emergencyRelation
        }
      }, { merge: true });
      navigate("/chatbot");
    } catch (err) {
      console.error("Error saving details:", err);
      navigate("/chatbot"); // Still navigate even if save fails
    }
    setIsLoading(false);
  };

  // Skip personal details
  const handleSkip = () => {
    navigate("/chatbot");
  };

  // Google Signu
  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, GoogleProvider);
      localStorage.setItem("Email", result.user.email);
      localStorage.setItem("Name", result.user.displayName);
      setCreatedUser(result.user);
      setName(result.user.displayName || "");
      setEmail(result.user.email || "");
      setStep(2); // Go to personal details after Google signup
    } catch (err) {
      console.error("Google Signup Error:", err.message);
    }
  };

  // GitHub Signup
  const handleGithubSignup = async () => {
    try {
      const result = await signInWithPopup(auth, GithubProvider);
      localStorage.setItem("Email", result.user.email);
      localStorage.setItem("Name", result.user.displayName || "");
      setCreatedUser(result.user);
      setName(result.user.displayName || "");
      setEmail(result.user.email || "");
      setStep(2); // Go to personal details after GitHub signup
    } catch (err) {
      console.error("GitHub Signup Error:", err.message);
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-pink-100">
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div>
              <h2 className="text-2xl font-bold">
                {step === 1 ? "Create Account" : "Personal Details"}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {step === 1 ? "Join Dr.Chat today" : "Help us personalize your experience"}
              </p>
            </div>
            <button onClick={handleClose} className="text-white hover:text-blue-200 transition">
              <X size={24} />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 py-4 bg-gray-50">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all
              ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"}`}>
              {step > 1 ? <Check size={16} /> : "1"}
            </div>
            <div className={`w-16 h-1 rounded ${step > 1 ? "bg-blue-600" : "bg-gray-300"}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all
              ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"}`}>
              2
            </div>
          </div>

          {/* Step 1: Account Details */}
          {step === 1 && (
            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-black border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-black border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-black border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? "Creating..." : "Continue"} <ChevronRight size={18} />
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-gray-500 text-sm">or continue with</span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>

              {/* Social Signup */}
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  className="flex items-center justify-center w-14 h-14 rounded-xl bg-white border-2 border-gray-200 transition duration-300 hover:border-blue-400 hover:shadow-md"
                >
                  <img src={google} alt="Google" className="w-8 h-8 rounded-full" />
                </button>
                <button
                  type="button"
                  onClick={handleGithubSignup}
                  className="flex items-center justify-center w-14 h-14 rounded-xl bg-white border-2 border-gray-200 transition duration-300 hover:border-gray-600 hover:shadow-md"
                >
                  <img src={Github} alt="GitHub" className="w-8 h-8 rounded-full" />
                </button>
              </div>

              {/* Login Link */}
              <p className="text-center text-sm text-gray-600 mt-4">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium underline"
                >
                  Login
                </button>
              </p>
            </form>
          )}

          {/* Step 2: Personal Details */}
          {step === 2 && (
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-gray-600 text-sm mb-4">
                These details help Dr.Chat provide personalized health advice. You can skip and fill later in Profile.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Phone */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone size={14} className="inline mr-1" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 XXXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar size={14} className="inline mr-1" /> Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Heart size={14} className="inline mr-1" /> Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Scale size={14} className="inline mr-1" /> Weight (kg)
                  </label>
                  <input
                    type="number"
                    placeholder="65"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Ruler size={14} className="inline mr-1" /> Height (cm)
                  </label>
                  <input
                    type="number"
                    placeholder="170"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-800 mb-3">Emergency Contact (Optional)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="px-3 py-2 border text-black border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="px-3 py-2 border text-black border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Relation"
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    className="px-3 py-2 border text-black border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSkip}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleSaveDetails}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save & Continue"} <Check size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => navigate('/chatbot')}
      />
    </div>
  );
};

export default Signup;

/*updated*/