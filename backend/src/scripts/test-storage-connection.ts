/**
 * Standalone script to verify connectivity of all storage providers.
 * Run: npm run test:storage (from backend directory)
 *
 * 1. Loads and validates .env via validateEnv()
 * 2. Tests Local / S3 / Firebase connectivity as applicable
 * 3. Performs upload -> exists -> delete (ping-pong) for the active STORAGE_PROVIDER
 * 4. Prints a clean terminal report
 */

import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const TEST_KEY = "_test/connection-test.txt";
const TEST_BODY = Buffer.from("storage-connection-test", "utf8");

type CheckResult = { ok: boolean; message: string };

function line(): void {
  console.log("─".repeat(50));
}

function report(label: string, result: CheckResult): void {
  const icon = result.ok ? "✅" : "❌";
  console.log(`${icon} ${label}: ${result.message}`);
}

async function checkLocal(config: { local: { root: string } }): Promise<CheckResult> {
  const root = path.resolve(process.cwd(), config.local.root);
  try {
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }
    const probe = path.join(root, ".write-probe");
    fs.writeFileSync(probe, "ok", "utf8");
    fs.unlinkSync(probe);
    return { ok: true, message: "OK (path exists and writable)" };
  } catch (err: any) {
    return { ok: false, message: err?.message || "Not writable or missing" };
  }
}

async function checkS3(config: { s3: { accessKeyId: string; secretAccessKey: string; region: string; bucket: string } }): Promise<CheckResult> {
  const { accessKeyId, secretAccessKey, region, bucket } = config.s3;
  if (!accessKeyId || !secretAccessKey || !region || !bucket) {
    return { ok: false, message: "Missing AWS env (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET)" };
  }
  try {
    const { S3Client, HeadBucketCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return { ok: true, message: "Valid" };
  } catch (err: any) {
    const msg = err?.name === "NotFound" || err?.$metadata?.httpStatusCode === 404
      ? "Bucket not found"
      : err?.message || "Invalid";
    return { ok: false, message: msg };
  }
}

async function checkFirebase(config: {
  firebase: { projectId: string; clientEmail: string; privateKey: string; storageBucket: string };
}): Promise<CheckResult> {
  const { projectId, clientEmail, privateKey, storageBucket } = config.firebase;
  if (!projectId || !clientEmail || !privateKey || !storageBucket) {
    return { ok: false, message: "Missing Firebase env (FIREBASE_PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY, STORAGE_BUCKET)" };
  }
  try {
    const admin = await import("firebase-admin");
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
    }
    const bucket = admin.storage().bucket(storageBucket);
    const [exists] = await bucket.exists();
    return { ok: !!exists, message: exists ? "Valid" : "Bucket not accessible" };
  } catch (err: any) {
    return { ok: false, message: err?.message || "Invalid" };
  }
}

async function pingPongTest(provider: string): Promise<CheckResult> {
  try {
    const { getStorageService } = await import("../shared/storage/services/storage.service");
    const storage = getStorageService();

    await storage.upload({
      storageKey: TEST_KEY,
      body: TEST_BODY,
      contentType: "text/plain",
    });

    const found = await storage.exists(TEST_KEY);
    if (!found) {
      return { ok: false, message: "Upload succeeded but exists() returned false" };
    }

    await storage.delete(TEST_KEY);
    const gone = await storage.exists(TEST_KEY);
    if (gone) {
      return { ok: false, message: "Delete succeeded but object still exists" };
    }

    return { ok: true, message: "Granted" };
  } catch (err: any) {
    return { ok: false, message: err?.message || "Ping-pong failed" };
  }
}

async function main(): Promise<void> {
  console.log("\n  Storage connection test\n");
  line();

  let env: ReturnType<typeof import("../config/env.validation").validateEnv>;
  try {
    const { validateEnv } = await import("../config/env.validation");
    env = validateEnv();
  } catch (err: any) {
    console.log("❌ Environment validation failed:");
    console.log("   " + (err?.message || String(err)));
    console.log("\n   Ensure .env is present and STORAGE_PROVIDER is one of: local, firebase, s3\n");
    process.exit(1);
  }

  const { getStorageConfig } = await import("../config/storage.config");
  const config = getStorageConfig();
  const active = config.provider;

  report(`STORAGE_PROVIDER (Active)`, { ok: true, message: `${active} – OK` });
  line();

  const localResult = await checkLocal(config);
  report("📁 Local: path exists & writable", localResult);

  if (active === "s3" || (config.s3.bucket && config.s3.region)) {
    const s3Result = await checkS3(config);
    report("🔑 AWS credentials / bucket", s3Result);
  } else {
    console.log("⏭️  🔑 AWS: skipped (not active, env not set)");
  }

  if (active === "firebase" || (config.firebase.storageBucket && config.firebase.privateKey)) {
    const fbResult = await checkFirebase(config);
    report("🔑 Firebase credentials / bucket", fbResult);
  } else {
    console.log("⏭️  🔑 Firebase: skipped (not active, env not set)");
  }

  line();
  console.log("Ping-pong (upload → exists → delete) for active provider:");
  const pingResult = await pingPongTest(active);
  report("📁 Write permissions (ping-pong)", pingResult);
  line();
  console.log("");

  if (active === "local" && !localResult.ok) {
    process.exit(1);
  }
  if (!pingResult.ok) {
    process.exit(1);
  }
  if (active === "s3") {
    const s3Result = await checkS3(config);
    if (!s3Result.ok) process.exit(1);
  }
  if (active === "firebase") {
    const fbResult = await checkFirebase(config);
    if (!fbResult.ok) process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
