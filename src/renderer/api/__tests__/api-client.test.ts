import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../api-client';
import { ApiError, NetworkError, AuthExpiredError } from '../../types/api';

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient('http://localhost:8080/api');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetch(status: number, body: unknown) {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status,
      json: () => Promise.resolve(body),
    });
  }

  // --- Response parsing ---

  it('returns data when code is 0', async () => {
    mockFetch(200, { code: 0, message: 'ok', data: { id: 1 } });
    const result = await client.request<{ id: number }>('/test');
    expect(result).toEqual({ id: 1 });
  });

  it('throws ApiError when code is not 0', async () => {
    mockFetch(200, { code: 1001, message: '参数错误', data: null });
    await expect(client.request('/test')).rejects.toThrow(ApiError);
    await expect(client.request('/test')).rejects.toThrow('参数错误');
  });

  // --- 401 interception ---

  it('throws AuthExpiredError and clears token on 401', async () => {
    client.setSessionToken('my-token');
    const lockHandler = vi.fn();
    client.setOnLock(lockHandler);

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 401,
      json: () => Promise.resolve({}),
    });

    await expect(client.request('/test')).rejects.toThrow(AuthExpiredError);
    expect(client.getSessionToken()).toBeNull();
    expect(lockHandler).toHaveBeenCalledOnce();
  });

  // --- Network error ---

  it('throws NetworkError on fetch failure', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(client.request('/test')).rejects.toThrow(NetworkError);
  });

  // --- Session token in headers ---

  it('attaches Authorization header when session token is set', async () => {
    client.setSessionToken('abc-123');
    mockFetch(200, { code: 0, message: 'ok', data: null });

    await client.request('/test');

    const [url, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = opts.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer abc-123');
  });

  it('does not attach Authorization header when no token', async () => {
    mockFetch(200, { code: 0, message: 'ok', data: null });

    await client.request('/test');

    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = opts.headers as Headers;
    expect(headers.get('Authorization')).toBeNull();
  });

  // --- Convenience methods ---

  it('get() sends GET request', async () => {
    mockFetch(200, { code: 0, message: 'ok', data: [] });
    await client.get('/items');
    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.method).toBe('GET');
  });

  it('post() sends POST with JSON body', async () => {
    mockFetch(200, { code: 0, message: 'ok', data: { id: 1 } });
    await client.post('/items', { name: 'test' });
    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(opts.body).toBe(JSON.stringify({ name: 'test' }));
  });

  it('put() sends PUT with JSON body', async () => {
    mockFetch(200, { code: 0, message: 'ok', data: null });
    await client.put('/items/1', { name: 'updated' });
    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.method).toBe('PUT');
  });

  it('delete() sends DELETE request', async () => {
    mockFetch(200, { code: 0, message: 'ok', data: null });
    await client.delete('/items/1');
    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.method).toBe('DELETE');
  });
});
