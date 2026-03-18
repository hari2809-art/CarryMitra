import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { auth } from "./firebase";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
  }
}

export function setupRecaptcha() {
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
  }
  window.recaptchaVerifier = new RecaptchaVerifier(
    auth,
    "recaptcha-container",
    { size: "invisible" }
  );
}

export async function sendOTP(phoneNumber: string): Promise<ConfirmationResult> {
  setupRecaptcha();
  const appVerifier = window.recaptchaVerifier;
  const fullPhone = phoneNumber.startsWith("+") ? phoneNumber : "+91" + phoneNumber;
  const confirmation = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
  window.confirmationResult = confirmation;
  return confirmation;
}

export async function verifyOTP(otp: string) {
  const result = await window.confirmationResult.confirm(otp);
  return result.user;
}

export function getAuthErrorMessage(code: string): string {
  console.error("Firebase Auth Error:", code);
  switch (code) {
    case "auth/invalid-phone-number":
      return "Please enter a valid phone number";
    case "auth/too-many-requests":
      return "Too many attempts. Please try after 1 hour";
    case "auth/invalid-verification-code":
      return "Wrong OTP. Please try again";
    case "auth/code-expired":
      return "OTP expired. Please resend";
    case "auth/missing-phone-number":
      return "Please enter your phone number";
    default:
      return `Error (${code || "unknown"}): Please try again`;
  }
}
