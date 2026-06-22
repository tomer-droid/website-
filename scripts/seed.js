/* ============================================================
   Kamir Group — Firestore seed script
   ------------------------------------------------------------
   Populates Cloud Firestore with:
     • config/contacts  { items: [...] }   (shared, all investors)
     • config/media     { items: [...] }   (shared, all investors)
     • investors/{email}                    (one sample investor)
     • investors/{email}/properties/{id}    (their property data)

   This runs with the Firebase Admin SDK, which bypasses the
   Firestore security rules — so it can write data the client is
   never allowed to write.

   HOW TO RUN
   ----------
   1. In the Firebase console → Project settings → Service accounts
      → "Generate new private key". Save the JSON file as
      ./serviceAccountKey.json  in this project folder
      (it is gitignored and must NEVER be committed).
   2. From the project folder run:
        npm run seed
      or, with an explicit path:
        GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node scripts/seed.js

   To add a real investor, copy the sampleInvestor block, change
   the email + name + property data, and re-run. Re-running is safe
   (uses set/merge — it overwrites the same docs, never duplicates).
   ============================================================ */
"use strict";

const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");

/* ---- locate the service-account key ---- */
function loadCredential() {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const localPath = path.join(__dirname, "..", "serviceAccountKey.json");
  const keyPath = envPath && fs.existsSync(envPath) ? envPath
                : fs.existsSync(localPath) ? localPath
                : null;
  if (!keyPath) {
    console.error(
      "\n  ✖  No service-account key found.\n" +
      "     Put it at ./serviceAccountKey.json or set\n" +
      "     GOOGLE_APPLICATION_CREDENTIALS to its full path.\n"
    );
    process.exit(1);
  }
  return admin.credential.cert(require(keyPath));
}

admin.initializeApp({ credential: loadCredential() });
const db = admin.firestore();

/* ============================================================
   SHARED DATA — identical for every investor
   ============================================================ */
const contacts = [
  {
    name: { he: "תומר קמיר — Kamir Group", en: "Tomer Kamir — Kamir Group" },
    role: { he: "איש הקשר הראשי שלכם", en: "Your primary point of contact" },
    phone: "+972528022296", phoneLabel: "+972 52-802-2296", email: "tomer@shaykes.com",
    when: { he: "שאלות על ההשקעה, דוחות, חלוקות ועסקאות עתידיות.", en: "Investment questions, reports, distributions and future deals." }
  },
  {
    name: { he: "South Bend Management Co. — Louis Hiza", en: "South Bend Management Co. — Louis Hiza" },
    role: { he: "ניהול הנכס — בעלים ומנהל", en: "Property management — Owner & Manager" },
    phone: "+15745660202", phoneLabel: "+1 (574) 566-0202", email: "louis@southbendmanagementco.com",
    when: { he: "ניהול שוטף, ענייני דייר, הסכמי שכירות ומצב ההשכרה.", en: "Day-to-day management, tenant matters, leases and leasing status." }
  },
  {
    name: { he: "תחזוקה — Luna Coleman", en: "Maintenance — Luna Coleman" },
    role: { he: "תחזוקה ותיאום שוטף", en: "Maintenance & coordination" },
    phone: "+15745660202", phoneLabel: "+1 (574) 566-0202", email: "admin@southbendmanagementco.com",
    when: { he: "תקלות תחזוקה, הערכות שיפוץ ותיאום ביקורות בנכס.", en: "Maintenance issues, rent-ready estimates and property inspections." }
  },
  {
    name: { he: "Aldridge Insurance — Gregory Aldridge", en: "Aldridge Insurance — Gregory Aldridge" },
    role: { he: "סוכן ביטוח — פוליסות ותביעות", en: "Insurance agent — Policies & claims" },
    phone: "+15742329999", phoneLabel: "+1 (574) 232-9999 ext. 2109", email: "grussell@aldins.com",
    when: { he: "חידוש פוליסה, הצעות מחיר, הגשת תביעה או נזק לנכס.", en: "Policy renewal, quotes, filing a claim or property damage." }
  }
];

const media = [
  {
    title: { he: "ניווט במידע שלכם", en: "Navigating your information" },
    desc:  { he: "סיור קצר בפורטל — איפה כל דבר נמצא ואיך לקרוא אותו.", en: "A short tour of the portal — where everything is and how to read it." },
    driveId: "14GQ5C63Vk9vRmG450qSfentdaHX6tXbL"
  },
  {
    title: { he: "פורטל הניהול (מחשב)", en: "The management portal (desktop)" },
    desc:  { he: "סקירה של פורטל הניהול במחשב.", en: "A walkthrough of the management portal on desktop." },
    driveId: "1n7SWgueXfWQfArLYhljivYzPuqTCQtyJ"
  },
  {
    title: { he: "לאן הכסף הולך ומתי", en: "Where the money goes and when" },
    desc:  { he: "הסבר על מסלול התשלומים — ממה שמתקבל ועד לתשלום נטו אליכם.", en: "How the cash flows — from rent collected to your net payout." },
    driveId: "1UT45C4i1hQ7QEa56Mqfjhq9kBbs-wOd9"
  },
  {
    title: { he: "הוצאות שוטפות", en: "Operating expenses" },
    desc:  { he: "מה כוללות ההוצאות החודשיות על הנכס.", en: "What the monthly property expenses include." },
    driveId: "1mw3emopyKSrv3aMK_IKyqjSArMVp3PIk"
  },
  {
    title: { he: "עליית ערך ושחיקת משכנתא — הסבר", en: "Appreciation & mortgage paydown — explained" },
    desc:  { he: "שני המנועים שבונים לכם הון לאורך זמן.", en: "The two engines that build your equity over time." },
    driveId: "13wSl76xH3nGMi4G_x1hgKQMQUXUVpC--"
  },
  {
    title: { he: "דוח CMA", en: "The CMA report" },
    desc:  { he: "איך אנחנו מעריכים שווי נכס מול עסקאות דומות באזור.", en: "How we value a property against comparable local sales." },
    driveId: "1S2vzBq9EXPMRFdymWvOEY_xVrIbLBSOQ"
  }
];

/* ============================================================
   SAMPLE INVESTOR — copy this block per real investor
   ============================================================ */
const sampleInvestor = {
  /* doc ID = lowercased email. */
  email: "tomer@shaykes.com",
  doc: {
    name:  { he: "תומר קמיר", en: "Tomer Kamir" },
    since: { he: "2026",       en: "2026" }
  },
  properties: [
    /* ----------------------------------------------------------
       PROPERTY 1 — 1216 E Jefferson Blvd, Mishawaka, IN 46545
       Cash purchase (no loan).
         purchase $82,000 + renovation $57,000  => $139,000 invested
         current value $200,000 (all equity)
         rent $1,600/mo  −  property tax $150  −  insurance $90
                         => net cashflow $1,360/mo
         cash-on-cash = 1,360*12 / 139,000 = 11.7%
       ---------------------------------------------------------- */
    {
      id: "jefferson",
      order: 1,
      name:    { he: "1216 E Jefferson Blvd", en: "1216 E Jefferson Blvd" },
      address: "1216 E Jefferson Blvd",
      city:    { he: "משוואקה, אינדיאנה 46545", en: "Mishawaka, Indiana 46545" },
      status:  { he: "מושכר ומניב", en: "Leased & income-producing" },
      hero: "assets/properties/jefferson.jpg",
      specs: {
        beds: 3, baths: 2, sqft: "1,100", year: "—",
        type: { he: "בית פרטי", en: "Single-family home" }
      },
      financials: {
        investment: 139000,
        downPayment: 139000,
        closingReno: 57000,
        purchasePrice: 82000,
        currentValue: 200000,
        loanAmount: 0,
        leveragePct: 0,
        mortgageBalance: 0,
        equity: 200000,
        grossRent: 1600,
        monthlyMortgage: 0,
        monthlyInsurance: 90,
        monthlyOperating: 150,
        netCashflow: 1360,
        cashOnCash: 11.7
      },
      distributions: [],
      photos: {
        exterior: [
          { src: "assets/properties/jefferson.jpg", caption: { he: "חזית הנכס", en: "Front exterior" } }
        ],
        interior: []
      },
      documents: []
    }
    /* ----------------------------------------------------------
       PROPERTY 2 — 636 S 25th St, South Bend, IN 46615  (4/2, 1,800 sqft)
       purchase $117,500 + reno $32,000 = $149,500; loan $130,000
       (ends Feb 2056) => cash invested $19,500; value $200,000;
       equity $70,000; PITI $1,034/mo all-in.
       PENDING: monthly rent (needed for net cashflow) — add once known.
       ---------------------------------------------------------- */
  ]
};

/* ============================================================
   WRITE
   ============================================================ */
async function seed() {
  console.log("Seeding Firestore…\n");

  /* shared config */
  await db.collection("config").doc("contacts").set({ items: contacts });
  console.log("  ✔ config/contacts  (" + contacts.length + " contacts)");
  await db.collection("config").doc("media").set({ items: media });
  console.log("  ✔ config/media     (" + media.length + " videos)");

  /* sample investor + properties */
  const emailKey = sampleInvestor.email.toLowerCase();
  const investorRef = db.collection("investors").doc(emailKey);
  await investorRef.set(sampleInvestor.doc, { merge: true });
  console.log("  ✔ investors/" + emailKey);

  for (const prop of sampleInvestor.properties) {
    await investorRef.collection("properties").doc(prop.id).set(prop);
    console.log("      ↳ properties/" + prop.id);
  }

  console.log(
    "\nDone.\n\n" +
    "  NOTE: the sample investor email is \"" + sampleInvestor.email + "\".\n" +
    "  Edit scripts/seed.js (sampleInvestor) with each real\n" +
    "  investor's Google email + property data, then re-run.\n"
  );
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n  ✖ Seed failed:\n", err);
    process.exit(1);
  });
