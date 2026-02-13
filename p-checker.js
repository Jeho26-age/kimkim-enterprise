import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBUEe_nqxaUKrYBjSJssxuRzns8AHsLkX0",
    authDomain: "kimkimenterprise-516c4.firebaseapp.com",
    projectId: "kimkimenterprise-516c4",
    storageBucket: "kimkimenterprise-516c4.firebasestorage.app",
    messagingSenderId: "782456699398",
    appId: "1:782456699398:web:c069d267ea8d62b197e187"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Enhanced Security: Verifies access and KICKS unauthorized users immediately with a delay for notifications.
 */
export async function verifyAccess(requiredLevel = 'staff', showPopup) {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            
            // Helper to handle the "Kick" with a delay
            const kickUser = (msg, icon, target = "signin.html") => {
                if (showPopup) {
                    showPopup(msg, icon);
                } else {
                    alert(msg); // Fallback if popup function isn't passed/available
                }
                
                // Wait 2 seconds so the user can read the message before the page changes
                setTimeout(() => {
                    window.location.replace(target);
                }, 2000);
            };

            // 1. If not logged in at all
            if (!user) {
                kickUser("Please sign in first to access this page.", "lock", "signin.html");
                return;
            }

            // 2. Fetch the Firestore Document
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.exists() ? userDoc.data() : null;

            // 3. If no profile exists
            if (!userData) {
                kickUser("Permission Denied: Profile not found.", "error", "signin.html");
                return;
            }

            const isAdmin = userData.isAdmin === true; 
            const isAuthorized = userData.isAuthorized === true;

            // 4. THE KICK LOGIC
            
            // If the page is ADMIN only, but user is NOT ADMIN
            if (requiredLevel === 'admin' && !isAdmin) {
                kickUser("Access Denied: Administrator rights required.", "error", "homepage.html");
                return;
            }

            // If the page is for STAFF, but user is NOT AUTHORIZED AND NOT ADMIN
            if (requiredLevel === 'staff' && !isAuthorized && !isAdmin) {
                kickUser("Access Denied: Your account is awaiting approval.", "error", "homepage.html");
                return;
            }

            // 5. If all checks pass
            document.body.style.visibility = "visible"; 
            resolve(userData);
        });
    });
}
