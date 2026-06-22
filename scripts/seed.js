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
       Cash purchase (no loan). Total cash deployed (from the
       expense ledger) = $142,940. Current value $200,000 (all equity).
       Steady-state rent $1,650/mo; net cashflow ~$1,410/mo.
       Expenses + sheetUrl mirror the investor's Google Sheet.
       ---------------------------------------------------------- */
    {
      id: "jefferson",
      order: 1,
      name:    { he: "1216 E Jefferson Blvd", en: "1216 E Jefferson Blvd" },
      address: "1216 E Jefferson Blvd",
      city:    { he: "משוואקה, אינדיאנה 46545", en: "Mishawaka, Indiana 46545" },
      status:  { he: "מושכר ומניב", en: "Leased & income-producing" },
      tenant:  { he: "מאוכלס", en: "Occupied" },
      hero: "assets/properties/jefferson.jpg",
      specs: {
        beds: 3, baths: 2, sqft: "1,100", year: "—",
        type: { he: "בית פרטי", en: "Single-family home" }
      },
      financials: {
        investment: 142940,
        downPayment: 142940,
        closingReno: 60940,
        purchasePrice: 82000,
        currentValue: 200000,
        loanAmount: 0,
        leveragePct: 0,
        mortgageBalance: 0,
        equity: 200000,
        grossRent: 1650,
        monthlyMortgage: 0,
        monthlyInsurance: 90,
        monthlyOperating: 150,
        netCashflow: 1410,
        cashOnCash: 11.8
      },
      /* full purchase + renovation ledger — mirrors the Google Sheet */
      sheetUrl: "https://docs.google.com/spreadsheets/d/17SodrlOAY7DZDBGSSgNYYCP1MAiO06CuxBm9GDnIbKI/edit",
      expenses: [
        { label: { he: "פיקדון רציני (EMD)",        en: "Earnest money deposit (EMD)" }, vendor: "Michiana Title",        amount: 1025 },
        { label: { he: "בדיקת טרמיטים",              en: "Termite inspection" },          vendor: "J&J Termites",          amount: 40 },
        { label: { he: "בדיקת ביוב",                 en: "Sewer inspection" },            vendor: "Roto-Rooter",           amount: 248 },
        { label: { he: "הצעת מחיר (קבלן)",           en: "Contractor estimate" },         vendor: "Cody",                  amount: 150 },
        { label: { he: "סגירת עסקה (Closing)",       en: "Closing" },                     vendor: "Michiana Title",        amount: 80748 },
        { label: { he: "ביטוח — תשלום 1",            en: "Insurance — payment 1" },       vendor: "Foremost Insurance",    amount: 155 },
        { label: { he: "פיקדון תשתיות (יוטיליטיס)",  en: "Utilities deposit" },           vendor: "Mishawaka Utilities",   amount: 150 },
        { label: { he: "שיפוץ — תשלום 1",            en: "Renovation — payment 1" },      vendor: "Gvan Inc",              amount: 14500 },
        { label: { he: "קריאת שרברב (דליפת גז)",     en: "Plumber call (gas leak)" },     vendor: "JD Plumbing & Heating", amount: 75 },
        { label: { he: "תיקון דליפת גז",             en: "Gas leak repair" },             vendor: "Abe's Plumbing",        amount: 950 },
        { label: { he: "ביטוח — תשלום 2",            en: "Insurance — payment 2" },       vendor: "Foremost Insurance",    amount: 148 },
        { label: { he: "שיפוץ — תשלום 2",            en: "Renovation — payment 2" },      vendor: "Gvan Inc",              amount: 14500 },
        { label: { he: "ביטוח — תשלום 3",            en: "Insurance — payment 3" },       vendor: "Foremost Insurance",    amount: 147 },
        { label: { he: "תשתיות (יוטיליטיס)",         en: "Utilities" },                   vendor: "Mishawaka Utilities",   amount: 190 },
        { label: { he: "ארנונה (Property tax)",      en: "Property tax" },                vendor: "St. Joseph County",     amount: 473 },
        { label: { he: "טיפול נגד טרמיטים",          en: "Termite treatment" },           vendor: "J&J Termites",          amount: 900 },
        { label: { he: "ביטוח — תשלום 4",            en: "Insurance — payment 4" },       vendor: "Foremost Insurance",    amount: 147 },
        { label: { he: "שיפוץ — תשלום 3",            en: "Renovation — payment 3" },      vendor: "Slone Rehab LLC",       amount: 14000 },
        { label: { he: "תשתיות (יוטיליטיס)",         en: "Utilities" },                   vendor: "Mishawaka Utilities",   amount: 118 },
        { label: { he: "צילום וידאו לנכס",           en: "Property video" },              vendor: "Magen Williamson",      amount: 280 },
        { label: { he: "שיפוץ — תשלום אחרון",        en: "Renovation — final payment" },  vendor: "Slone Rehab LLC",       amount: 13500 },
        { label: { he: "ארנונה (Property tax)",      en: "Property tax" },                vendor: "St. Joseph County",     amount: 496 }
      ],
      distributions: [
        { period: { he: "מרץ 2026", en: "March 2026" }, gross: 1950, mortgage: 0, insurance: 0, operating: 300.50, net: 1649.50, status: { he: "שולם", en: "Paid" } },
        { period: { he: "אפריל 2026", en: "April 2026" }, gross: 1375, mortgage: 0, insurance: 0, operating: 337.25, net: 1037.75, status: { he: "שולם", en: "Paid" } }
      ],
      photos: {
        exterior: [
          { src: "assets/properties/jefferson.jpg", caption: { he: "חזית הנכס", en: "Front exterior" } }
        ],
        interior: []
      },
      documents: []
    },
    /* ----------------------------------------------------------
       PROPERTY 2 — 636 S 25th St, South Bend, IN 46615  (4/2, 1,800 sqft)
       Purchase $117,500 + renovation, financed with a $130,000 private
       loan (FCI). Total out-of-pocket cash (from the expense ledger) =
       $72,968. Current value $200,000; equity ~$70,000.
       Steady-state rent $2,000/mo; debt service ~$1,034/mo.
       ---------------------------------------------------------- */
    {
      id: "twentyfifth",
      order: 2,
      name:    { he: "636 S 25th St", en: "636 S 25th St" },
      address: "636 S 25th St",
      city:    { he: "סאות' בנד, אינדיאנה 46615", en: "South Bend, Indiana 46615" },
      status:  { he: "מושכר ומניב", en: "Leased & income-producing" },
      tenant:  { he: "מאוכלס", en: "Occupied" },
      hero: "assets/properties/s25th.jpg",
      specs: {
        beds: 4, baths: 2, sqft: "1,800", year: "1907",
        type: { he: "בית פרטי", en: "Single-family home" }
      },
      financials: {
        investment: 72968,
        downPayment: 72968,
        closingReno: 32000,
        purchasePrice: 117500,
        currentValue: 200000,
        loanAmount: 130000,
        leveragePct: 65,
        mortgageBalance: 130000,
        equity: 70000,
        grossRent: 2000,
        monthlyMortgage: 1034,
        monthlyInsurance: 0,
        monthlyOperating: 200,
        netCashflow: 766,
        cashOnCash: 12.6
      },
      sheetUrl: "https://docs.google.com/spreadsheets/d/16675HgsH2P3Emge-IcIqY2u3pQkripUZwHDh0euBMtI/edit",
      expenses: [
        { label: { he: "פיקדון רציני (EMD)",          en: "Earnest money deposit (EMD)" }, vendor: "Michiana Title LLC",       amount: 1000 },
        { label: { he: "בדיקת מבנה (Inspection)",     en: "Home inspection" },             vendor: "Gold Key Inspections",     amount: 718 },
        { label: { he: "סגירת עסקה (Closing)",        en: "Closing" },                     vendor: "Michiana Title LLC",       amount: 28046 },
        { label: { he: "ביטוח שנתי",                  en: "Annual insurance" },            vendor: "Foremost Insurance",       amount: 2099 },
        { label: { he: "משלוח מסמכי סגירה (DHL)",     en: "Closing docs shipping (DHL)" }, vendor: "DHL",                      amount: 138 },
        { label: { he: "שיפוץ — תשלום 1",             en: "Renovation — payment 1" },      vendor: "AC Hill Design LLC",       amount: 9500 },
        { label: { he: "תשלום ריבית 1 (משכנתא)",      en: "Interest payment 1" },          vendor: "FCI Lender Services",      amount: 977 },
        { label: { he: "שיפוץ — תשלום 2",             en: "Renovation — payment 2" },      vendor: "AC Hill Design LLC",       amount: 9500 },
        { label: { he: "תיקון ביוב",                  en: "Sewer repair" },                vendor: "Abe's Plumbing",           amount: 3434 },
        { label: { he: "תשלום ריבית 2",               en: "Interest payment 2" },          vendor: "FCI Lender Services",      amount: 966 },
        { label: { he: "צילום וידאו לשיפוץ",          en: "Renovation video" },            vendor: "MWP",                      amount: 380 },
        { label: { he: "שיפוץ — תשלום 3",             en: "Renovation — payment 3" },      vendor: "AC Hill Design LLC",       amount: 9715 },
        { label: { he: "תשלום ריבית 3",               en: "Interest payment 3" },          vendor: "FCI Lender Services",      amount: 966 },
        { label: { he: "תשלום ריבית 4",               en: "Interest payment 4" },          vendor: "FCI Lender Services",      amount: 966 },
        { label: { he: "תשלום ריבית 5",               en: "Interest payment 5" },          vendor: "FCI Lender Services",      amount: 966 },
        { label: { he: "מרזבים חדשים",                en: "New gutters" },                 vendor: "Lipnal Construction LLC",  amount: 650 },
        { label: { he: "שמאות (Appraisal)",           en: "Appraisal" },                   vendor: "Lending Specialty LLC",    amount: 725 },
        { label: { he: "תשלום ריבית 6",               en: "Interest payment 6" },          vendor: "FCI Lender Services",      amount: 966 },
        { label: { he: "תשלום ריבית 7",               en: "Interest payment 7" },          vendor: "FCI Lender Services",      amount: 966 },
        { label: { he: "העברת שמאות",                 en: "Appraisal transfer" },          vendor: "Appraisal Nation",         amount: 290 }
      ],
      distributions: [
        { period: { he: "מרץ 2026", en: "March 2026" }, gross: 2000, mortgage: 1034, insurance: 0, operating: 257.97, net: 708.03, status: { he: "שולם", en: "Paid" } },
        { period: { he: "אפריל 2026", en: "April 2026" }, gross: 1419.35, mortgage: 1034, insurance: 0, operating: 99.35, net: 286.00, status: { he: "שולם", en: "Paid" } }
      ],
      photos: {
        exterior: [
          { src: "assets/properties/s25th.jpg", caption: { he: "חזית הנכס", en: "Front exterior" } }
        ],
        interior: []
      },
      documents: []
    }
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
