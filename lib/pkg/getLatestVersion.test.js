import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLatestVersion } from './getLatestVersion.js';

describe('getLatestVersion', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	it('should return the version if request is successful', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async () => ({ version: '1.2.3' }),
		});

		const version = await getLatestVersion('my-package');
		expect(version).toBe('1.2.3');
		expect(fetch).toHaveBeenCalledWith('https://registry.npmjs.org/my-package/latest', expect.any(Object));
	});

	it('should return null if request fails', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: false,
		});

		const version = await getLatestVersion('my-package');
		expect(version).toBeNull();
	});

	it('should return null if there is a network error', async () => {
		vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

		const version = await getLatestVersion('my-package');
		expect(version).toBeNull();
	});

	it('should return null if timeout occurs', async () => {
		vi.mocked(fetch).mockRejectedValue(new Error('Timeout'));

		const version = await getLatestVersion('my-package');
		expect(version).toBeNull();
	});
});
