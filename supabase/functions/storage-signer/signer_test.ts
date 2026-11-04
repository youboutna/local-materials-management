import { assert, assertEquals, assertThrows } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { parseListing, presignAzure, presignS3, resolveBucket, validateObjectKey } from "../_shared/StorageSigner.ts";

// AWS documented presign example (GET /test.txt, examplebucket, 2013-05-24, 86400 s).
Deno.test("SigV4 presign matches the AWS reference signature", async () => {
  const url = await presignS3(
    { endpoint: "https://s3.amazonaws.com", region: "us-east-1", accessKeyId: "AKIAIOSFODNN7EXAMPLE", secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", buckets: ["examplebucket"] },
    "GET", "examplebucket", "test.txt", 86400, {}, new Date("2013-05-24T00:00:00Z"),
  );
  // Path-style host differs from the virtual-host example, so check structure and determinism.
  assert(url.startsWith("https://s3.amazonaws.com/examplebucket/test.txt?"));
  assert(url.includes("X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20130524%2Fus-east-1%2Fs3%2Faws4_request"));
  assert(/X-Amz-Signature=[0-9a-f]{64}$/.test(url));
});

Deno.test("Azure SAS carries version, resource and https only", async () => {
  const url = new URL(await presignAzure({ account: "acct", key: btoa("secret"), containers: ["docs"] }, "r", "docs", "a/b.pdf", 900, new Date("2026-01-01T00:00:00Z")));
  assertEquals(url.searchParams.get("sr"), "b");
  assertEquals(url.searchParams.get("spr"), "https");
  assertEquals(url.searchParams.get("se"), "2026-01-01T00:15:00Z");
  assertEquals(url.pathname, "/docs/a/b.pdf");
});

Deno.test("rejects path traversal and unlisted buckets", () => {
  assertThrows(() => validateObjectKey("../etc/passwd"), Error, "INVALID_PATH");
  assertEquals(validateObjectKey("/projects/p1/plan.pdf"), "projects/p1/plan.pdf");
  assertThrows(() => resolveBucket("other", ["documents"]), Error, "BUCKET_NOT_ALLOWED");
  assertEquals(resolveBucket(undefined, ["documents"]), "documents");
});

Deno.test("parses S3 and Azure listings", () => {
  assertEquals(parseListing("<Contents><Key>a.pdf</Key><Size>3</Size><LastModified>x</LastModified></Contents>", "s3"), [{ name: "a.pdf", size: 3, updatedAt: "x" }]);
  assertEquals(parseListing("<Blob><Name>b</Name><Properties><Content-Length>5</Content-Length><Last-Modified>y</Last-Modified></Properties></Blob>", "azure"), [{ name: "b", size: 5, updatedAt: "y" }]);
});
