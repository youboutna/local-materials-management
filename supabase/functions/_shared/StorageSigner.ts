/**
 * Server-side storage signer for S3 / MinIO / GCS (HMAC interoperability) and Azure Blob.
 * Credentials are read only from the execution environment; the browser receives
 * short-lived signed URLs, never keys.
 */

export type SignedProvider = "s3" | "minio" | "gcs" | "azure";
export type StorageOp = "PUT" | "GET" | "DELETE";

export interface S3Credentials {
  endpoint: string; // https://s3.eu-west-3.amazonaws.com | https://minio.local:9000 | https://storage.googleapis.com
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  buckets: string[];
}

export interface AzureCredentials {
  account: string;
  key: string; // base64 account key
  containers: string[];
  endpoint?: string; // defaults to https://<account>.blob.core.windows.net
}

type Env = (name: string) => string | undefined;

const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

async function hmac(key: ArrayBuffer | Uint8Array<ArrayBuffer>, data: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, enc.encode(data));
}

const sha256Hex = async (data: string) => hex(await crypto.subtle.digest("SHA-256", enc.encode(data)));

/** RFC 3986 encoding as required by SigV4 (slashes kept in paths). */
export const uriEncode = (value: string, keepSlash = false) =>
  encodeURIComponent(value)
    .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(keepSlash ? /%2F/g : /$^/, "/");

/** Reject traversal and absolute keys; keys stay opaque otherwise. */
export function validateObjectKey(path: unknown): string {
  if (typeof path !== "string" || !path.trim()) throw new Error("INVALID_PATH");
  const key = path.replace(/^\/+/, "");
  if (key.split("/").some((segment) => segment === ".." || segment === ".")) throw new Error("INVALID_PATH");
  if (key.length > 1024) throw new Error("INVALID_PATH");
  return key;
}

export function resolveBucket(requested: string | undefined, allowed: string[]): string {
  const bucket = requested?.trim() || allowed[0];
  if (!bucket || !allowed.includes(bucket)) throw new Error("BUCKET_NOT_ALLOWED");
  return bucket;
}

const list = (raw: string | undefined) => (raw ?? "").split(",").map((v) => v.trim()).filter(Boolean);

export function readS3Credentials(provider: "s3" | "minio" | "gcs", env: Env): S3Credentials | null {
  const p = provider === "gcs" ? "STORAGE_GCS" : "STORAGE_S3";
  const accessKeyId = env(provider === "gcs" ? `${p}_HMAC_ACCESS_ID` : `${p}_ACCESS_KEY_ID`);
  const secretAccessKey = env(provider === "gcs" ? `${p}_HMAC_SECRET` : `${p}_SECRET_ACCESS_KEY`);
  const endpoint = provider === "gcs" ? env(`${p}_ENDPOINT`) || "https://storage.googleapis.com" : env(`${p}_ENDPOINT`);
  const buckets = list(env(`${p}_BUCKETS`) || env(`${p}_BUCKET`));
  if (!accessKeyId || !secretAccessKey || !endpoint || buckets.length === 0) return null;
  return { endpoint: endpoint.replace(/\/$/, ""), region: env(`${p}_REGION`) || (provider === "gcs" ? "auto" : "us-east-1"), accessKeyId, secretAccessKey, buckets };
}

export function readAzureCredentials(env: Env): AzureCredentials | null {
  const account = env("STORAGE_AZURE_ACCOUNT");
  const key = env("STORAGE_AZURE_KEY");
  const containers = list(env("STORAGE_AZURE_CONTAINERS") || env("STORAGE_AZURE_CONTAINER"));
  if (!account || !key || containers.length === 0) return null;
  return { account, key, containers, endpoint: env("STORAGE_AZURE_ENDPOINT") };
}

const amzDate = (now: Date) => now.toISOString().replace(/[:-]|\.\d{3}/g, "");

/** AWS Signature V4 query presign (path-style), accepted by S3, MinIO and GCS interoperability. */
export async function presignS3(
  creds: S3Credentials,
  method: "PUT" | "GET" | "DELETE",
  bucket: string,
  key: string,
  expiresSeconds = 900,
  extraQuery: Record<string, string> = {},
  now = new Date(),
): Promise<string> {
  const url = new URL(creds.endpoint);
  const datetime = amzDate(now);
  const date = datetime.slice(0, 8);
  const scope = `${date}/${creds.region}/s3/aws4_request`;
  const canonicalPath = `/${uriEncode(bucket)}${key ? `/${uriEncode(key, true)}` : ""}`;
  const query: Record<string, string> = {
    ...extraQuery,
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${creds.accessKeyId}/${scope}`,
    "X-Amz-Date": datetime,
    "X-Amz-Expires": String(expiresSeconds),
    "X-Amz-SignedHeaders": "host",
  };
  const canonicalQuery = Object.keys(query).sort().map((k) => `${uriEncode(k)}=${uriEncode(query[k])}`).join("&");
  const canonicalRequest = [method, canonicalPath, canonicalQuery, `host:${url.host}`, "", "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", datetime, scope, await sha256Hex(canonicalRequest)].join("\n");
  let signingKey = await hmac(enc.encode(`AWS4${creds.secretAccessKey}`), date);
  for (const part of [creds.region, "s3", "aws4_request"]) signingKey = await hmac(signingKey, part);
  const signature = hex(await hmac(signingKey, stringToSign));
  return `${url.protocol}//${url.host}${canonicalPath}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

const b64decode = (value: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
const b64encode = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));

/** Azure Blob service SAS (version 2020-12-06). Resource "b" for a blob, "c" for container listing. */
export async function presignAzure(
  creds: AzureCredentials,
  permissions: string,
  container: string,
  blob: string | null,
  expiresSeconds = 900,
  now = new Date(),
): Promise<string> {
  const version = "2020-12-06";
  const expiry = new Date(now.getTime() + expiresSeconds * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
  const resource = blob ? "b" : "c";
  const canonical = `/blob/${creds.account}/${container}${blob ? `/${blob}` : ""}`;
  const stringToSign = [permissions, "", expiry, canonical, "", "", "https", version, resource, "", "", "", "", "", "", ""].join("\n");
  const sig = b64encode(await hmac(b64decode(creds.key), stringToSign));
  const base = creds.endpoint?.replace(/\/$/, "") || `https://${creds.account}.blob.core.windows.net`;
  const params = new URLSearchParams({ sv: version, sr: resource, sp: permissions, se: expiry, spr: "https", sig });
  const path = `/${uriEncode(container)}${blob ? `/${uriEncode(blob, true)}` : ""}`;
  return `${base}${path}?${params.toString()}${blob ? "" : "&restype=container&comp=list"}`;
}

export const AZURE_PERMISSIONS: Record<StorageOp, string> = { PUT: "cw", GET: "r", DELETE: "d" };

export interface ListedObject { name: string; size: number; updatedAt: string }

/** Minimal XML extraction for ListObjectsV2 / Azure List Blobs responses. */
export function parseListing(xml: string, provider: SignedProvider): ListedObject[] {
  const entry = provider === "azure" ? /<Blob>([\s\S]*?)<\/Blob>/g : /<Contents>([\s\S]*?)<\/Contents>/g;
  const tag = (block: string, name: string) => block.match(new RegExp(`<${name}>([^<]*)</${name}>`))?.[1] ?? "";
  return [...xml.matchAll(entry)].map(([, block]) => ({
    name: tag(block, provider === "azure" ? "Name" : "Key"),
    size: Number(tag(block, provider === "azure" ? "Content-Length" : "Size")) || 0,
    updatedAt: tag(block, provider === "azure" ? "Last-Modified" : "LastModified"),
  }));
}
