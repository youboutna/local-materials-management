import { describe, expect, it, vi } from 'vitest';
import { SignedUrlStorageAdapter } from '../SignedUrlStorageAdapter';

const file = new File(['abc'], 'plan.pdf', { type: 'application/pdf' });

describe('SignedUrlStorageAdapter', () => {
  it('uploads with a server-signed URL, forwards provider headers and returns the object key', async () => {
    const gateway = { invokeFunction: vi.fn().mockResolvedValue({ data: { url: 'https://signed/put', method: 'PUT', headers: { 'x-ms-blob-type': 'BlockBlob' } }, error: null }) };
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    const adapter = new SignedUrlStorageAdapter('azure', gateway, 'docs', fetchImpl as unknown as typeof fetch);
    const res = await adapter.uploadFile(file, 'projects/p1/plan.pdf');
    expect(res).toEqual({ success: true, url: 'projects/p1/plan.pdf' });
    expect(gateway.invokeFunction).toHaveBeenCalledWith('storage-signer', { provider: 'azure', bucket: 'docs', op: 'PUT', path: 'projects/p1/plan.pdf' });
    expect(fetchImpl.mock.calls[0][1].headers['x-ms-blob-type']).toBe('BlockBlob');
  });

  it('reports a not-configured provider instead of pretending success', async () => {
    const gateway = { invokeFunction: vi.fn().mockResolvedValue({ data: { error: 'STORAGE_PROVIDER_NOT_CONFIGURED' }, error: null }) };
    const adapter = new SignedUrlStorageAdapter('gcs', gateway);
    expect(await adapter.uploadFile(file, 'a.pdf')).toEqual({ success: false, error: 'STORAGE_PROVIDER_NOT_CONFIGURED' });
  });

  it('proxies FTP uploads through the server as base64', async () => {
    const gateway = { invokeFunction: vi.fn().mockResolvedValue({ data: { success: true }, error: null }) };
    const adapter = new SignedUrlStorageAdapter('ftp', gateway);
    await adapter.uploadFile(file, 'a.pdf');
    expect(gateway.invokeFunction.mock.calls[0][1]).toMatchObject({ provider: 'ftp', op: 'FTP_UPLOAD', path: 'a.pdf', data: btoa('abc') });
  });

  it('fails loudly on a failed signed transfer', async () => {
    const gateway = { invokeFunction: vi.fn().mockResolvedValue({ data: { url: 'https://signed/get', method: 'GET' }, error: null }) };
    const fetchImpl = vi.fn().mockResolvedValue(new Response('denied', { status: 403 }));
    const adapter = new SignedUrlStorageAdapter('s3', gateway, undefined, fetchImpl as unknown as typeof fetch);
    expect((await adapter.downloadFile('a.pdf')).success).toBe(false);
  });
});
