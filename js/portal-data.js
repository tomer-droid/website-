/* ============================================================
   Kamir Group — Investor Portal UI strings
   ------------------------------------------------------------
   This file holds ONLY the bilingual UI labels (chrome) for the
   investor dashboard. The actual investor data (properties,
   financials, distributions, documents) and the shared data
   (contacts, media) are loaded at runtime from Firestore — see
   js/portal.js. Access is gated by Google Sign-In + Firestore
   security rules (firestore.rules).

   window.KamirPortalData.DATA is populated at runtime after a
   successful, authorized sign-in.
   ============================================================ */
(function () {
  "use strict";

  /* Bilingual UI strings used across the dashboard chrome. */
  var UI = {
    welcome:      { he: "ברוכים הבאים",                       en: "Welcome back" },
    investorSince:{ he: "משקיע מאז",                          en: "Investor since" },
    logout:       { he: "התנתקות",                            en: "Log out" },
    portfolio:    { he: "תיק הנכסים שלי",                     en: "My portfolio" },
    properties:   { he: "נכסים",                              en: "Properties" },
    totalInvested:{ he: "סה\"כ הון מושקע",                    en: "Total invested" },
    portfolioValue:{ he: "שווי תיק נוכחי",                   en: "Current portfolio value" },
    monthlyCashflow:{ he: "תזרים חודשי נטו",                 en: "Monthly net cashflow" },
    avgYield:     { he: "תשואה ממוצעת על ההון",              en: "Avg cash-on-cash" },
    selectProperty:{ he: "בחירת נכס",                        en: "Select property" },
    /* section tabs */
    tabOverview:  { he: "סקירה",                              en: "Overview" },
    tabFinancials:{ he: "נתונים פיננסיים",                   en: "Financials" },
    tabDist:      { he: "תשלומים וחלוקות",                    en: "Payments" },
    tabPhotos:    { he: "תמונות",                             en: "Photos" },
    tabDocs:      { he: "מסמכים",                             en: "Documents" },
    tabContacts:  { he: "אנשי קשר",                           en: "Contacts" },
    tabMedia:     { he: "מדיה ועדכונים",                      en: "Media & updates" },
    /* overview */
    propertySpecs:{ he: "מפרט הנכס",                          en: "Property specs" },
    beds:         { he: "חדרי שינה",                          en: "Bedrooms" },
    baths:        { he: "חדרי רחצה",                          en: "Bathrooms" },
    sqft:         { he: "שטח (רגל²)",                    en: "Area (sqft)" },
    year:         { he: "שנת בנייה",                          en: "Year built" },
    type:         { he: "סוג נכס",                            en: "Property type" },
    keyMetrics:   { he: "מדדים עיקריים",                      en: "Key metrics" },
    /* financials labels */
    investment:   { he: "ההשקעה שלי (הון עצמי)",             en: "My investment (equity in)" },
    downPayment:  { he: "מקדמה (Down Payment)",               en: "Down payment" },
    closingReno:  { he: "עלויות סגירה ושיפוץ",               en: "Closing & renovation" },
    purchasePrice:{ he: "מחיר רכישה",                         en: "Purchase price" },
    currentValue: { he: "שווי נוכחי מוערך",                   en: "Estimated current value" },
    loanAmount:   { he: "סכום משכנתא (הלוואה)",              en: "Mortgage (loan amount)" },
    leverage:     { he: "אחוז מינוף",                         en: "Leverage" },
    mortgageBalance:{ he: "יתרת משכנתא נוכחית",              en: "Current mortgage balance" },
    equity:       { he: "הון עצמי בנכס (Equity)",            en: "Equity in property" },
    monthlyTable: { he: "פירוט חודשי",                        en: "Monthly breakdown" },
    grossRent:    { he: "שכירות ברוטו",                       en: "Gross rent" },
    mortgagePay:  { he: "החזר משכנתא",                        en: "Mortgage payment" },
    insurance:    { he: "ביטוח",                              en: "Insurance" },
    operating:    { he: "הוצאות תפעול וניהול",               en: "Operating & management" },
    netCashflow:  { he: "תזרים נטו לחודש",                    en: "Net monthly cashflow" },
    cashOnCash:   { he: "תשואה על ההון (שנתי)",              en: "Cash-on-cash (annual)" },
    perMonth:     { he: "/ חודש",                             en: "/ mo" },
    /* distributions */
    distIntro:    { he: "מתי מגיע כסף, כמה, ומה מנוכה לפני התשלום נטו.", en: "When you get paid, how much, and what is deducted before your net payout." },
    colPeriod:    { he: "תקופה",                              en: "Period" },
    colGross:     { he: "ברוטו",                              en: "Gross" },
    colMortgage:  { he: "משכנתא",                             en: "Mortgage" },
    colInsurance: { he: "ביטוח",                              en: "Insurance" },
    colOperating: { he: "תפעול",                              en: "Operating" },
    colNet:       { he: "נטו אליכם",                          en: "Net to you" },
    colStatus:    { he: "סטטוס",                              en: "Status" },
    statusPaid:   { he: "שולם",                               en: "Paid" },
    statusScheduled:{ he: "מתוכנן",                           en: "Scheduled" },
    nextPayout:   { he: "התשלום הבא",                         en: "Next payout" },
    /* photos */
    photosExterior:{ he: "חוץ",                               en: "Exterior" },
    photosInterior:{ he: "פנים",                              en: "Interior" },
    /* documents */
    docsIntro:    { he: "כל מסמכי הקנייה, הקבלות ומסמכי החברה — במקום אחד.", en: "All purchase documents, receipts and company papers — in one place." },
    download:     { he: "הורדה",                              en: "Download" },
    docDemoMsg:   { he: "המסמך יהיה זמין להורדה בקרוב. בינתיים נשמח לשלוח עותק — פנו אלינו.", en: "This document will be downloadable soon. In the meantime we're happy to send a copy — just reach out." },
    catPurchase:  { he: "רכישה",                              en: "Purchase" },
    catCompany:   { he: "חברה (LLC)",                         en: "Company (LLC)" },
    catInsurance: { he: "ביטוח",                              en: "Insurance" },
    catReceipts:  { he: "קבלות",                              en: "Receipts" },
    catLease:     { he: "השכרה",                              en: "Lease" },
    /* contacts */
    contactsIntro:{ he: "עם מי מדברים ומתי — אנשי הקשר שמלווים את הנכס שלכם.", en: "Who to talk to and when — the people who support your property." },
    whenToContact:{ he: "מתי לפנות",                          en: "When to contact" },
    call:         { he: "התקשרו",                             en: "Call" },
    email:        { he: "אימייל",                             en: "Email" },
    /* media */
    mediaIntro:   { he: "סרטוני הסבר ועדכונים שהכנו עבורכם — זהים לכל המשקיעים.", en: "Explainer videos and updates we've prepared for you — the same for every investor." },
    watch:        { he: "צפייה",                              en: "Watch" },
    openDrive:    { he: "פתיחה ב-Drive ↗",                    en: "Open in Drive ↗" },

    /* ---- auth / loading states ---- */
    loading:        { he: "טוען את הפורטל שלכם…",              en: "Loading your portal…" },
    signingIn:      { he: "מתחבר עם Google…",                 en: "Signing in with Google…" },
    signedIn:       { he: "התחברתם בהצלחה — טוען את הפורטל…",  en: "Signed in — loading your portal…" },
    signinError:    { he: "ההתחברות נכשלה. נסו שוב.",          en: "Sign-in failed. Please try again." },
    loadError:      { he: "אירעה תקלה בטעינת הנתונים. רעננו את הדף או נסו שוב מאוחר יותר.", en: "Something went wrong loading your data. Refresh the page or try again later." },
    noAccessTitle:  { he: "החשבון עדיין לא מחובר לתיק השקעות", en: "This account isn't linked to a portfolio yet" },
    noAccessMsg:    { he: "נכנסתם עם החשבון {email}, אבל הוא עדיין לא מחובר לאזור המשקיעים. אם אתם משקיעים שלנו — פנו אלינו ונחבר אתכם.", en: "You signed in as {email}, but it isn't linked to an investor account yet. If you're one of our investors, contact us and we'll set it up." },
    switchAccount:  { he: "התחברות עם חשבון אחר",             en: "Use a different account" },
    contactUs:      { he: "צרו קשר",                          en: "Contact us" },
    configMissing:  { he: "אזור המשקיעים נמצא בהגדרה. נסו שוב בקרוב.", en: "The investor area is being set up. Please check back soon." }
  };

  /* DATA is filled at runtime from Firestore after sign-in. */
  window.KamirPortalData = { UI: UI, DATA: null };
})();
