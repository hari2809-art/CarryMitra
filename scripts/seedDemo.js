const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp } = require("firebase/firestore");
const fs = require('fs');
const path = require('path');

// Manual .env.local parsing
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length === 2) {
        process.env[parts[0].trim()] = parts[1].trim();
      }
    });
  }
} catch (e) {
  console.warn("⚠️ Warning: Could not parse .env.local manually", e.message);
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
};

async function seed() {
  if (!firebaseConfig.apiKey) {
    console.error("❌ Error: Firebase config missing in .env.local");
    return;
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log("🚀 Seeding CarryMitra Demo Data...");

  // 1. Seed Users
  const users = [
    {
      uid: "user_deepak",
      name: "Deepak Kumar",
      phone: "+91 9876543210",
      email: "deepak@carrymitra.com",
      dob: "1995-05-15",
      address: "Hyderabad",
      photoURL: "",
      isVerified: true,
      rating: 4.8,
      totalDeliveries: 12,
      totalEarnings: 3500,
      role: "carrier",
      createdAt: serverTimestamp()
    },
    {
      uid: "user_ravi",
      name: "Ravi Sharma",
      phone: "+91 8877665544",
      email: "ravi@carrymitra.com",
      dob: "1992-08-20",
      address: "Bangalore",
      photoURL: "",
      isVerified: true,
      rating: 4.5,
      totalDeliveries: 5,
      totalEarnings: 1200,
      role: "sender",
      createdAt: serverTimestamp()
    }
  ];

  for (const user of users) {
    await setDoc(doc(db, "users", user.uid), user);
    console.log(`✅ User ${user.name} created`);
  }

  // 2. Seed Parcels
  const parcels = [
    {
      parcelId: "CM1001",
      senderId: "user_ravi",
      senderName: "Ravi Sharma",
      carrierId: "user_deepak",
      pickupCity: "Hyderabad",
      deliveryCity: "Bangalore",
      category: "Electronics",
      weight: 1.5,
      description: "Laptop charger and power bank",
      photoURL: "",
      price: 350,
      status: "In Transit",
      distance: 570,
      eta: "4 hrs",
      createdAt: serverTimestamp()
    },
    {
      parcelId: "CM1002",
      senderId: "user_ravi",
      senderName: "Ravi Sharma",
      carrierId: null,
      pickupCity: "Tirupati",
      deliveryCity: "Chennai",
      category: "Documents",
      weight: 0.2,
      description: "Urgent legal papers",
      photoURL: "",
      price: 150,
      status: "Posted",
      distance: 140,
      eta: "3 hrs",
      createdAt: serverTimestamp()
    }
  ];

  for (const parcel of parcels) {
    const docRef = await addDoc(collection(db, "parcels"), parcel);
    console.log(`✅ Parcel ${parcel.parcelId} created`);

    // 3. Seed Chat Messages for #CM1001
    if (parcel.parcelId === "CM1001") {
      const messages = [
        { senderId: "user_ravi", senderName: "Ravi", text: "Hi Deepak, please handle carefully", timestamp: serverTimestamp(), type: "text" },
        { senderId: "user_deepak", senderName: "Deepak", text: "Sure Ravi, it's safe in my backpack", timestamp: serverTimestamp(), type: "text" }
      ];
      for (const msg of messages) {
        await addDoc(collection(db, "chats", docRef.id, "messages"), msg);
      }
      console.log(`✅ Messages for ${parcel.parcelId} created`);
    }
  }

  // 4. Seed Transactions
  const transactions = [
    { parcelId: "CM0988", amount: 450, type: "credit", status: "Paid to Bank", date: serverTimestamp() },
    { parcelId: "CM0955", amount: 300, type: "credit", status: "Paid to Bank", date: serverTimestamp() }
  ];

  for (const tx of transactions) {
    await addDoc(collection(db, "users", "user_deepak", "transactions"), tx);
  }
  console.log("✅ Transactions created");

  console.log("\n✨ Seeding Complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
