import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { authorizeRequest, corsHeaders, jsonResponse } from "../_shared/http.ts";
import {
  AZURE_PERMISSIONS, parseListing, presignAzure, presignS3, readAzureCredentials, readS3Credentials,
  resolveBucket, validateObjectKey, type SignedProvider, type StorageOp,
} from "../_shared/StorageSigner.ts";

/**
 * Signs short-lived URLs for S3 / MinIO / GCS / Azure, lists objects server-side,
 * and proxies FTP transfers (FTP has no browser-accessible signed URLs).
 * Body: { provider, op: PUT|GET|DELETE|LIST|FTP_UPLOAD|FTP_DOWNLOAD, path, bucket?, prefix?, data? (base64) }
 */
const env = (name: string) => Deno.env.get(name);
const SIGNED: SignedProvider[] = ["s3", "minio", "gcs", "azure"];
const FTP_MAX_BYTES = 20 * 1024 * 1024;

async function handleSigned(provider: SignedProvider, body: Record<string, unknown>) {
  const op = String(body.op) as StorageOp | "LIST";
  if (provider === "azure") {
    const creds = readAzureCredentials(env);
    if (!creds) return jsonResponse({ error: "STORAGE_PROVIDER_NOT_CONFIGURED", provider }, 501);
    const container = resolveBucket(body.bucket as string | undefined, creds.containers);
    if (op === "LIST") {
      const url = new URL(await presignAzure(creds, "l", container, null));
      if (body.prefix) url.searchParams.set("prefix", String(body.prefix));
      const res = await fetch(url);
      if (!res.ok) return jsonResponse({ error: "Provider request failed", status: res.status, details: await res.text() }, res.status);
      return jsonResponse({ files: parseListing(await res.text(), provider) });
    }
    if (!(op in AZURE_PERMISSIONS)) return jsonResponse({ error: "INVALID_OP" }, 400);
    const key = validateObjectKey(body.path);
    const url = await presignAzure(creds, AZURE_PERMISSIONS[op as StorageOp], container, key);
    return jsonResponse({ url, method: op, headers: op === "PUT" ? { "x-ms-blob-type": "BlockBlob" } : {} });
  }
  const creds = readS3Credentials(provider, env);
  if (!creds) return jsonResponse({ error: "STORAGE_PROVIDER_NOT_CONFIGURED", provider }, 501);
  const bucket = resolveBucket(body.bucket as string | undefined, creds.buckets);
  if (op === "LIST") {
    const query: Record<string, string> = { "list-type": "2" };
    if (body.prefix) query.prefix = String(body.prefix);
    const res = await fetch(await presignS3(creds, "GET", bucket, "", 60, query));
    if (!res.ok) return jsonResponse({ error: "Provider request failed", status: res.status, details: await res.text() }, res.status);
    return jsonResponse({ files: parseListing(await res.text(), provider) });
  }
  if (!["PUT", "GET", "DELETE"].includes(op)) return jsonResponse({ error: "INVALID_OP" }, 400);
  const url = await presignS3(creds, op as StorageOp, bucket, validateObjectKey(body.path));
  return jsonResponse({ url, method: op, headers: {} });
}

async function handleFtp(body: Record<string, unknown>) {
  const host = env("STORAGE_FTP_HOST");
  const user = env("STORAGE_FTP_USER");
  const password = env("STORAGE_FTP_PASSWORD");
  if (!host || !user || !password) return jsonResponse({ error: "STORAGE_PROVIDER_NOT_CONFIGURED", provider: "ftp" }, 501);
  const root = (env("STORAGE_FTP_ROOT") || "").replace(/\/$/, "");
  const { Client } = await import("npm:basic-ftp@5");
  const { Readable, Writable } = await import("node:stream");
  const client = new Client(30_000);
  try {
    await client.access({ host, user, password, port: Number(env("STORAGE_FTP_PORT") || 21), secure: env("STORAGE_FTP_SECURE") === "true" });
    const op = String(body.op);
    if (op === "LIST") {
      const entries = await client.list(`${root}/${String(body.prefix ?? "")}`.replace(/\/+/g, "/"));
      return jsonResponse({ files: entries.filter((e) => e.isFile).map((e) => ({ name: e.name, size: e.size, updatedAt: e.modifiedAt?.toISOString() ?? "" })) });
    }
    const target = `${root}/${validateObjectKey(body.path)}`;
    if (op === "FTP_UPLOAD") {
      const bytes = Uint8Array.from(atob(String(body.data ?? "")), (c) => c.charCodeAt(0));
      if (bytes.byteLength === 0 || bytes.byteLength > FTP_MAX_BYTES) return jsonResponse({ error: "INVALID_SIZE" }, 413);
      await client.ensureDir(target.substring(0, target.lastIndexOf("/")) || "/");
      await client.uploadFrom(Readable.from([bytes]), target);
      return jsonResponse({ success: true, size: bytes.byteLength });
    }
    if (op === "FTP_DOWNLOAD") {
      const chunks: Uint8Array[] = [];
      await client.downloadTo(new Writable({ write(chunk, _e, cb) { chunks.push(chunk); cb(); } }), target);
      const all = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0));
      let offset = 0;
      for (const c of chunks) { all.set(c, offset); offset += c.byteLength; }
      let binary = "";
      for (let i = 0; i < all.length; i += 0x8000) binary += String.fromCharCode(...all.subarray(i, i + 0x8000));
      return jsonResponse({ data: btoa(binary) });
    }
    if (op === "DELETE") { await client.remove(target); return jsonResponse({ success: true }); }
    return jsonResponse({ error: "INVALID_OP" }, 400);
  } finally {
    client.close();
  }
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  try {
    const auth = await authorizeRequest(request);
    if ("response" in auth) return auth.response;
    const body = await request.json() as Record<string, unknown>;
    const provider = String(body.provider);
    if (provider === "ftp") return await handleFtp(body);
    if (SIGNED.includes(provider as SignedProvider)) return await handleSigned(provider as SignedProvider, body);
    return jsonResponse({ error: "UNSUPPORTED_PROVIDER", provider }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "STORAGE_REQUEST_FAILED";
    const status = ["INVALID_PATH", "BUCKET_NOT_ALLOWED"].includes(message) ? 400 : 502;
    console.error("storage-signer failed:", message);
    return jsonResponse({ error: message }, status);
  }
});
