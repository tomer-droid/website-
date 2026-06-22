/* ============================================================
   Deploy firestore.rules via the Firebase Security Rules REST
   API, using the service-account key directly.

   We use this instead of `firebase deploy --only firestore:rules`
   because the CLI runs a serviceusage.services.get preflight that
   our service account isn't authorized for. The Rules API itself
   only needs the standard cloud-platform scope, which the service
   account has.

   Run:  node scripts/deploy-rules.js
   ============================================================ */
const fs = require("fs");
const path = require("path");
const https = require("https");
const { GoogleAuth } = require("google-auth-library");

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(__dirname, "..", "serviceAccountKey.json");
const key = JSON.parse(fs.readFileSync(keyPath, "utf8"));
const PROJECT = key.project_id;
const rulesSource = fs.readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8");

function api(token, method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: "firebaserules.googleapis.com",
        path: urlPath,
        method: method,
        headers: Object.assign(
          { Authorization: "Bearer " + token, "Content-Type": "application/json" },
          data ? { "Content-Length": Buffer.byteLength(data) } : {}
        )
      },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          const json = buf ? JSON.parse(buf) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(json);
          else reject(new Error(method + " " + urlPath + " -> " + res.statusCode + " " + buf));
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  const auth = new GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"]
  });
  const client = await auth.getClient();
  const token = (await client.getAccessToken()).token;

  console.log("Creating ruleset for project " + PROJECT + " …");
  const ruleset = await api(token, "POST", "/v1/projects/" + PROJECT + "/rulesets", {
    source: { files: [{ name: "firestore.rules", content: rulesSource }] }
  });
  console.log("  ✔ ruleset " + ruleset.name);

  console.log("Releasing to cloud.firestore …");
  const releaseName = "projects/" + PROJECT + "/releases/cloud.firestore";
  try {
    await api(token, "PATCH",
      "/v1/" + releaseName + "?updateMask.paths=ruleset_name",
      { name: releaseName, rulesetName: ruleset.name });
  } catch (e) {
    // No existing release to update -> create it.
    await api(token, "POST", "/v1/projects/" + PROJECT + "/releases",
      { name: releaseName, rulesetName: ruleset.name });
  }
  console.log("  ✔ released. firestore.rules is now live.");
})().catch((e) => { console.error("\n  ✖ " + e.message + "\n"); process.exit(1); });
