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
    totalEquity:  { he: "סך הון עצמי בתיק",                  en: "Total equity in portfolio" },
    avgYield:     { he: "תשואה ממוצעת על ההון",              en: "Avg cash-on-cash" },
    selectProperty:{ he: "בחירת נכס",                        en: "Select property" },
    yourProperties:{ he: "הנכסים שלך",                       en: "Your properties" },
    portfolioCountOne:{ he: "נכס אחד בפורטפוליו",            en: "1 property in portfolio" },
    portfolioCountMany:{ he: "{n} נכסים בפורטפוליו",         en: "{n} properties in portfolio" },
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
    leaseStart:   { he: "מושכר מתאריך",                       en: "Leased since" },
    leaseEnd:     { he: "סיום חוזה שכירות",                   en: "Lease ends" },
    viewOnZillow: { he: "צפייה ב-Zillow",                     en: "View on Zillow" },
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
    noLoan:       { he: "ללא הלוואה — 100% הון עצמי",         en: "No loan — 100% equity" },
    /* financials — visual dashboard */
    finValueEquity:{ he: "שווי והון עצמי",                   en: "Value & equity" },
    finMonthlyFlow:{ he: "לאן הולכת השכירות",                en: "Where the rent goes" },
    moneyIn:      { he: "נכנס (שכירות)",                     en: "Comes in (rent)" },
    moneyOut:     { he: "יוצא (הוצאות)",                     en: "Goes out (expenses)" },
    moneyOutSub:  { he: "משכנתא · ביטוח · תפעול",            en: "Mortgage · insurance · operating" },
    youKeep:      { he: "נשאר לך נטו",                       en: "You keep (net)" },
    ofRent:       { he: "מהשכירות",                          en: "of rent" },
    ofRentShort:  { he: "% מהשכירות",                        en: "% of rent" },
    finViewLabel: { he: "תצוגה",                             en: "View" },
    finViewDonut: { he: "עוגה",                              en: "Donut" },
    finViewBars:  { he: "עמודות",                            en: "Bars" },
    finViewTable: { he: "טבלה",                              en: "Table" },
    finLedger:    { he: "פירוט הרכישה והשיפוץ",              en: "Purchase & renovation ledger" },
    interestRate: { he: "ריבית המשכנתא",                     en: "Mortgage interest rate" },
    openSheet:    { he: "פתיחת הגיליון המלא ↗",              en: "Open the full spreadsheet ↗" },
    colItem:      { he: "פירוט",                              en: "Item" },
    colVendor:    { he: "ספק / גורם",                         en: "Vendor" },
    colAmount:    { he: "סכום",                               en: "Amount" },
    totalSpent:   { he: "סך הכל הושקע",                       en: "Total invested" },
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
    distEmpty:    { he: "עדיין אין חלוקות רשומות לנכס זה. הן יופיעו כאן עם קבלת הדוח החודשי הראשון.", en: "No distributions recorded yet for this property. They'll appear here once the first monthly statement is in." },
    /* photos */
    photosExterior:{ he: "חוץ",                               en: "Exterior" },
    photosInterior:{ he: "פנים",                              en: "Interior" },
    photosIntro:  { he: "צילומים מקצועיים של הנכס. לחצו על תמונה להגדלה.", en: "Professional photos of the property. Click any photo to enlarge." },
    /* documents */
    docsIntro:    { he: "כל מסמכי הקנייה, הקבלות ומסמכי החברה — במקום אחד. אפשר גם להעלות מסמכים משלכם.", en: "All purchase documents, receipts and company papers — in one place. You can also upload your own." },
    driveFoldersTitle: { he: "תיקיות הנכס ב-Drive",            en: "Property folders on Drive" },
    driveFoldersIntro: { he: "המסמכים נשמרים ב-Google Drive. לחצו לצפייה בתיקייה כאן בפורטל.", en: "The files live in Google Drive. Click to view the folder right here in the portal." },
    download:     { he: "הורדה",                              en: "Download" },
    docDemoMsg:   { he: "המסמך יהיה זמין להורדה בקרוב. בינתיים נשמח לשלוח עותק — פנו אלינו.", en: "This document will be downloadable soon. In the meantime we're happy to send a copy — just reach out." },
    docsEmpty:    { he: "עדיין לא הועלו מסמכים לנכס זה.",       en: "No documents have been added for this property yet." },
    uploadTitle:  { he: "העלאת מסמך",                          en: "Upload a document" },
    uploadHint:   { he: "גררו לכאן קובץ או לחצו לבחירה · PDF, תמונה או מסמך · עד 25MB", en: "Drag a file here or click to choose · PDF, image or doc · up to 25MB" },
    uploadUnavailable:{ he: "ההעלאה תופעל בקרוב",              en: "Uploads activating soon" },
    uploadTooBig: { he: "הקובץ גדול מדי (מעל 25MB)",          en: "File too large (over 25MB)" },
    uploadFailed: { he: "ההעלאה נכשלה — נסו שוב",             en: "Upload failed — try again" },
    uploadDone:   { he: "הועלה בהצלחה ✓",                     en: "Uploaded ✓" },
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
    toolsTitle:   { he: "מערכות וקישורים",                    en: "Systems & links" },
    toolsIntro:   { he: "הכלים שבהם אנו מנהלים את הכספים והשכירות של הנכס — לכניסה ישירה.", en: "The systems we use to manage the property's banking and rentals — for direct access." },
    mercuryName:  { he: "Mercury — הבנק",                      en: "Mercury — Banking" },
    mercuryDesc:  { he: "חשבון הבנק של החברה: יתרות, העברות ותנועות.", en: "The company's bank account: balances, transfers and activity." },
    tenantcloudName:{ he: "TenantCloud — ניהול נכס",          en: "TenantCloud — Property management" },
    tenantcloudDesc:{ he: "מערכת ניהול השכירות: דיירים, תשלומים וקריאות שירות.", en: "Rental management: tenants, payments and service requests." },
    openLink:     { he: "פתיחה ↗",                            en: "Open ↗" },
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
    configMissing:  { he: "אזור המשקיעים נמצא בהגדרה. נסו שוב בקרוב.", en: "The investor area is being set up. Please check back soon." },

    /* ---- admin (manager preview) ---- */
    adminMode:      { he: "מצב מנהל",                          en: "Manager view" },
    adminViewing:   { he: "צופים בתיק של",                     en: "Viewing portfolio of" },
    adminNoInvestors:{ he: "עדיין אין משקיעים במערכת. הוסיפו משקיע ראשון כדי לצפות בתיק שלו כאן.", en: "There are no investors yet. Add your first investor to preview their portfolio here." }
  };

  /* DATA is filled at runtime from Firestore after sign-in. */
  window.KamirPortalData = { UI: UI, DATA: null };
})();
