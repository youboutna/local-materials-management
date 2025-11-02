/**
 * Unit tests for error handling utilities
 * Testing strategy: Test error creation, classification, and handling
 */

import { describe, it, expect, vi } from 'vitest';
import { AppError, ErrorCode, ErrorLogger, handleAsync, validateRequired, retryOnError } from '../errorHandling';

describe('AppError', () => {
  it('should create an error with all properties', () => {
    const error = new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Test error',
      new Error('Original'),
      { field: 'test' }
    );

    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.message).toBe('Test error');
    expect(error.metadata).toEqual({ field: 'test' });
    expect(error.name).toBe('AppError');
  });

  it('should identify recoverable errors', () => {
    const networkError = new AppError(ErrorCode.NETWORK_ERROR, 'Network failed');
    const validationError = new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid data');

    expect(networkError.isRecoverable()).toBe(true);
    expect(validationError.isRecoverable()).toBe(false);
  });

  it('should provide user-friendly messages', () => {
    const error = new AppError(ErrorCode.NOT_FOUND, 'Resource not found');
    expect(error.getUserMessage()).toBe('Ressource introuvable');
  });

  it('should convert to JSON properly', () => {
    const error = new AppError(ErrorCode.DATABASE_ERROR, 'DB failed');
    const json = error.toJSON();

    expect(json.code).toBe(ErrorCode.DATABASE_ERROR);
    expect(json.message).toBe('DB failed');
    expect(json.userMessage).toBe('Erreur de base de données');
    expect(json.timestamp).toBeDefined();
  });
});

describe('ErrorLogger', () => {
  it('should log AppError with context', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new AppError(ErrorCode.DATABASE_ERROR, 'Test error');

    ErrorLogger.log(error, 'TestContext');

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should log regular Error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Regular error');

    ErrorLogger.log(error, 'TestContext');

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('handleAsync', () => {
  it('should return data on success', async () => {
    const [data, error] = await handleAsync(Promise.resolve('success'));

    expect(data).toBe('success');
    expect(error).toBeNull();
  });

  it('should return AppError on AppError rejection', async () => {
    const appError = new AppError(ErrorCode.NOT_FOUND, 'Not found');
    const [data, error] = await handleAsync(Promise.reject(appError));

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(AppError);
    expect(error?.code).toBe(ErrorCode.NOT_FOUND);
  });

  it('should wrap regular Error in AppError', async () => {
    const [data, error] = await handleAsync(Promise.reject(new Error('Regular error')));

    expect(data).toBeNull();
    expect(error).toBeInstanceOf(AppError);
    expect(error?.code).toBe(ErrorCode.INTERNAL_ERROR);
  });
});

describe('validateRequired', () => {
  it('should return value if not null/undefined', () => {
    expect(validateRequired('test', 'field')).toBe('test');
    expect(validateRequired(0, 'field')).toBe(0);
    expect(validateRequired(false, 'field')).toBe(false);
  });

  it('should throw AppError if null', () => {
    expect(() => validateRequired(null, 'field')).toThrow(AppError);
    expect(() => validateRequired(null, 'field')).toThrow('field is required');
  });

  it('should throw AppError if undefined', () => {
    expect(() => validateRequired(undefined, 'field')).toThrow(AppError);
  });
});

describe('retryOnError', () => {
  it('should succeed on first try', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retryOnError(fn, 3, 10);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on recoverable error', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new AppError(ErrorCode.NETWORK_ERROR, 'Failed'))
      .mockResolvedValue('success');

    const result = await retryOnError(fn, 3, 10);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not retry on non-recoverable error', async () => {
    const fn = vi.fn()
      .mockRejectedValue(new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid'));

    await expect(retryOnError(fn, 3, 10)).rejects.toThrow(AppError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should throw after max retries', async () => {
    const fn = vi.fn()
      .mockRejectedValue(new AppError(ErrorCode.NETWORK_ERROR, 'Failed'));

    await expect(retryOnError(fn, 3, 10)).rejects.toThrow(AppError);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
