import { describe, expect, it } from 'vitest';
import { getPreviewKind } from './types';

describe('getPreviewKind', () => {
  it('uses the PDF filename when storage reports a generic MIME type', () => {
    expect(getPreviewKind('application/octet-stream', 'specification.PDF')).toBe('pdf');
  });

  it('uses a known MIME type ahead of a conflicting filename extension', () => {
    expect(getPreviewKind('image/png', 'scan.pdf')).toBe('image');
  });

  it('recognizes previewable extensions when MIME metadata is missing', () => {
    expect(getPreviewKind(null, 'report.docx')).toBe('office');
  });
});
