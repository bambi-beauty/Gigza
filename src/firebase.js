import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDkx5Zp3YplF_Wwgobn5QyQwWs-AVLe-Us",
  authDomain: "gigza-cf9f4.firebaseapp.com",
  projectId: "gigza-cf9f4",
  storageBucket: "gigza-cf9f4.firebasestorage.app",
  messagingSenderId: "876118501318",
  appId: "1:876118501318:web:27987a9107e3d26cc174c7",
  measurementId: "G-6L5D6SSHP1"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);



export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();