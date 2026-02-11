import { httpRequest } from 'http-request';
import { logger } from 'log';

const SUBREQUEST_BASE_URL = ''; // This is typically request.hostname or harper gtm url
const HARPER_TOKEN = ''; // Base64 encoded Harper user:pass
const PMUSER_103_HINTS = 'PMUSER_103_HINTS';

export async function onClientRequest(request) {
	try {
		const secFetchMode = request.getHeader('sec-fetch-mode');
		const hasNavigate = Array.isArray(secFetchMode) ? secFetchMode.includes('navigate') : secFetchMode === 'navigate';
		if (!hasNavigate) {
			logger.log('Harper skipping non-navigation request');
			return;
		}

		// Whether device browser is Safari
		const isSafari = request.device.brandName === 'Safari' ? '1' : '0';

		// Device type for dynamic image sizing
		const width = request.device.resolutionWidth || 0;

		const encodedPageUrl = encodeURIComponent(`${request.scheme}://${request.host}${request.path}`);
		let url = `https://${SUBREQUEST_BASE_URL}/hints?s=${isSafari}&w=${width}`;

		// Extract version query param if present
		const params = new URLSearchParams(request.query);
		if (params.has('v')) {
			url += `&v=${params.get('v')}&q=${encodedPageUrl}`;
		} else {
			url += `&q=${encodedPageUrl}`;
		}

		const response = await httpRequest(url, {
			method: 'GET',
			timeout: 250,
			headers: {
				'Authorization': `Basic ${HARPER_TOKEN}`,
				'Content-Type': 'application/json',
			},
		});

		if (response.status === 200) {
			const data = await response.json();
			if (typeof data === 'string') {
				logger.log(`Harper successful hints call for ${request.url}`);
				request.setVariable(PMUSER_103_HINTS, data);
			} else {
				throw new Error('Harper invalid hints response format');
			}
		} else {
			logger.log(`Harper hints call failed: ${response.status}`);
		}
	} catch (exception) {
		logger.log(`Error occured while calling HDB: ${exception.message}`);
	}
}
