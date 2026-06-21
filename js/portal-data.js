/* ============================================================
   Kamir Group — Investor Portal DEMO data
   ------------------------------------------------------------
   IMPORTANT: This is a CLIENT-SIDE DEMO prototype.
   - No real authentication. Credentials below are public demo
     credentials shown on the login screen on purpose.
   - All investor data here is illustrative / demo only. It does
     NOT contain any real investor's private financial details.
   - A production portal needs a secure backend (server-side auth,
     a database, and per-user access control). This file is only
     a front-end mockup of how that portal would look and feel.
   ============================================================ */
(function () {
  "use strict";

  /* Public demo credentials (shown on the login page). */
  var CREDS = { user: "demo", pass: "kamir2025" };

  /* Bilingual UI strings used across the dashboard chrome. */
  var UI = {
    welcome:      { he: "ברוכים הבאים",                       en: "Welcome back" },
    investorSince:{ he: "משקיע מאז",                          en: "Investor since" },
    logout:       { he: "התנתקות",                            en: "Log out" },
    demoBadge:    { he: "מצב הדגמה",                          en: "Demo mode" },
    demoNote:     { he: "זהו פורטל הדגמה. הנתונים להמחשה בלבד.", en: "This is a demo portal. All data is illustrative." },
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
    docDemoMsg:   { he: "במצב הדגמה אין קבצים אמיתיים להורדה.", en: "In demo mode there are no real files to download." },
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
    mediaIntro:   { he: "סרטונים ועדכונים שהעלינו עבורכם.",   en: "Videos and updates we've uploaded for you." },
    watch:        { he: "צפייה",                              en: "Watch" },
    mediaDemoMsg: { he: "במצב הדגמה הסרטונים אינם זמינים לצפייה.", en: "In demo mode videos are not available for playback." }
  };

  /* The demo investor + their property. Structured to support
     multiple properties per investor (array), seeded with one. */
  var DATA = {
    investor: {
      name:  { he: "ישראל ישראלי", en: "Israel Israeli" },
      since: { he: "ינואר 2026",    en: "January 2026" }
    },
    properties: [
      {
        id: "rerick",
        name:    { he: "רריק דרایב", en: "Rerick Drive" },
        address: "Rerick Dr",
        city:    { he: "סאות' בנד, אינדיאנה", en: "South Bend, Indiana" },
        status:  { he: "מושכר ומניב", en: "Leased & income-producing" },
        hero: "assets/portal/rerick-exterior.jpg",
        specs: {
          beds: 4, baths: "1.5", sqft: "1,462", year: 1955,
          type: { he: "בית פרטי", en: "Single-family home" }
        },
        financials: {
          investment: 71000,
          downPayment: 65000,
          closingReno: 6000,
          purchasePrice: 215000,
          currentValue: 232000,
          loanAmount: 150000,
          leveragePct: 70,
          mortgageBalance: 147800,
          equity: 84200,
          grossRent: 2150,
          monthlyMortgage: 950,
          monthlyInsurance: 95,
          monthlyOperating: 555,
          netCashflow: 550,
          cashOnCash: 9.3
        },
        distributions: [
          { period: { he: "ינואר 2026", en: "Jan 2026" }, gross: 2150, mortgage: 950, insurance: 95, operating: 555, net: 550, status: "paid" },
          { period: { he: "פברואר 2026", en: "Feb 2026" }, gross: 2150, mortgage: 950, insurance: 95, operating: 555, net: 550, status: "paid" },
          { period: { he: "מרץ 2026", en: "Mar 2026" }, gross: 2150, mortgage: 950, insurance: 95, operating: 555, net: 550, status: "paid" },
          { period: { he: "אפריל 2026", en: "Apr 2026" }, gross: 2150, mortgage: 950, insurance: 95, operating: 555, net: 550, status: "paid" },
          { period: { he: "מאי 2026", en: "May 2026" }, gross: 2150, mortgage: 950, insurance: 95, operating: 555, net: 550, status: "paid" },
          { period: { he: "יוני 2026", en: "Jun 2026" }, gross: 2150, mortgage: 950, insurance: 95, operating: 555, net: 550, status: "scheduled" }
        ],
        photos: {
          exterior: [
            { src: "assets/portal/rerick-exterior.jpg", caption: { he: "חזית הנכס", en: "Front exterior" } }
          ],
          interior: [
            { src: "assets/portal/rerick-living.jpg", caption: { he: "סלון", en: "Living room" } },
            { src: "assets/portal/rerick-kitchen.jpg", caption: { he: "מטבח", en: "Kitchen" } },
            { src: "assets/portal/rerick-bedroom.jpg", caption: { he: "חדר שינה", en: "Bedroom" } }
          ]
        },
        documents: [
          { name: { he: "חוזה רכישה", en: "Purchase Agreement" }, cat: "catPurchase", size: "1.4 MB" },
          { name: { he: "דוח סגירה (HUD-1)", en: "Closing Statement (HUD-1)" }, cat: "catPurchase", size: "820 KB" },
          { name: { he: "שטר בעלות (Warranty Deed)", en: "Warranty Deed" }, cat: "catPurchase", size: "540 KB" },
          { name: { he: "ביטוח כותרת (Title Insurance)", en: "Title Insurance Policy" }, cat: "catPurchase", size: "1.1 MB" },
          { name: { he: "דוח בדיקת נכס (Inspection)", en: "Inspection Report" }, cat: "catPurchase", size: "3.2 MB" },
          { name: { he: "מסמכי הקמת חברה (LLC)", en: "LLC Articles of Organization" }, cat: "catCompany", size: "680 KB" },
          { name: { he: "אישור מספר חברה (EIN)", en: "EIN Confirmation Letter" }, cat: "catCompany", size: "210 KB" },
          { name: { he: "הסכם תפעול (Operating Agreement)", en: "Operating Agreement" }, cat: "catCompany", size: "950 KB" },
          { name: { he: "פוליסת ביטוח נכס", en: "Property Insurance Policy" }, cat: "catInsurance", size: "1.0 MB" },
          { name: { he: "קבלות שיפוץ ושדרוג", en: "Renovation Receipts" }, cat: "catReceipts", size: "2.6 MB" },
          { name: { he: "הסכם שכירות מול הדייר", en: "Tenant Lease Agreement" }, cat: "catLease", size: "760 KB" }
        ],
        contacts: [
          {
            name: { he: "Kamir Group — מנהל תיק", en: "Kamir Group — Account Manager" },
            role: { he: "איש הקשר הראשי שלכם", en: "Your primary point of contact" },
            phone: "+972528022296", phoneLabel: "+972 52-802-2296", email: "tomer@shaykes.com",
            when: { he: "שאלות על ההשקעה, דוחות, חלוקות ועסקאות עתידיות.", en: "Investment questions, reports, distributions and future deals." }
          },
          {
            name: { he: "חברת ניהול הנכס", en: "Property Management Co." },
            role: { he: "ניהול שוטף ותחזוקה", en: "Day-to-day management & maintenance" },
            phone: "+15740000000", phoneLabel: "+1 (574) 000-0000", email: "manager@example.com",
            when: { he: "תקלות תחזוקה, ענייני דייר, מצב ההשכרה.", en: "Maintenance issues, tenant matters, leasing status." }
          },
          {
            name: { he: "רואה חשבון / הנהלת חשבונות", en: "Accountant / Bookkeeper" },
            role: { he: "מיסוי ודיווח", en: "Tax & reporting" },
            phone: "+15740000001", phoneLabel: "+1 (574) 000-0001", email: "cpa@example.com",
            when: { he: "מסמכי מס, דוחות שנתיים ותכנון מס.", en: "Tax documents, annual reports and tax planning." }
          },
          {
            name: { he: "סוכן ביטוח", en: "Insurance Agent" },
            role: { he: "פוליסות ותביעות", en: "Policies & claims" },
            phone: "+15740000002", phoneLabel: "+1 (574) 000-0002", email: "insurance@example.com",
            when: { he: "חידוש פוליסה, הגשת תביעה או נזק לנכס.", en: "Policy renewal, filing a claim or property damage." }
          }
        ],
        media: [
          {
            title: { he: "סרטון פתיחה — ברוכים הבאים", en: "Welcome video" },
            desc:  { he: "הסבר קצר על הפורטל ועל מה שתמצאו כאן.", en: "A short walkthrough of the portal and what you'll find here." },
            duration: "2:40", thumb: "assets/portal/rerick-exterior.jpg"
          },
          {
            title: { he: "סיור וידאו בנכס", en: "Property video tour" },
            desc:  { he: "סיור מלא בנכס לאחר השיפוץ.", en: "A full walkthrough of the property after renovation." },
            duration: "5:12", thumb: "assets/portal/rerick-living.jpg"
          },
          {
            title: { he: "עדכון רבעוני — Q1 2026", en: "Quarterly update — Q1 2026" },
            desc:  { he: "סיכום ביצועים והתקדמות לרבעון הראשון.", en: "Performance summary and progress for the first quarter." },
            duration: "3:55", thumb: "assets/portal/rerick-kitchen.jpg"
          }
        ]
      }
    ]
  };

  window.KamirPortalData = { CREDS: CREDS, UI: UI, DATA: DATA };
})();
