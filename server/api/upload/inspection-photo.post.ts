import { requireTenantMembership } from '~/server/utils/tenant';
import { getAdminClient } from '~/server/utils/user-management';

export default defineEventHandler(async (event) => {
	try {
		// const body = await readBody(event);
		const formData = await readMultipartFormData(event);
		const { tenant } = await requireTenantMembership(event);
		const supabase = process.env.SUPABASE_SERVICE_KEY
			? await getAdminClient(event)
			: event.context.supabase;

		if (!formData || !formData.length) {
			throw new Error('No file uploaded');
		}

		const filePart = formData.find(part => part.name === 'file');

		if (!filePart || !filePart.data) {
			throw new Error('File not found in form data');
		}

		const getFileExtension = () => {
			const fileName = filePart.filename ?? '';
			const fileNameExtension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : '';

			if (fileNameExtension) {
				return `.${fileNameExtension}`;
			}

			const mimeExtensionMap: Record<string, string> = {
				'image/jpeg': '.jpg',
				'image/png': '.png',
				'image/webp': '.webp',
				'image/gif': '.gif',
				'image/svg+xml': '.svg',
			};

			return mimeExtensionMap[filePart.type || ''] ?? '';
		};

		const now = new Date();
		const filePath = `${tenant.slug}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${Date.now()}${getFileExtension()}`;
		const { error: uploadError } = await supabase.storage.from('inspection-photos')
			.upload(filePath, filePart.data, {
				contentType: filePart.type || 'image/jpeg',
			});
		if (uploadError) {
			console.error('Upload failed:', uploadError.message);
			return uploadError;
		}

		// const { data, erorr: signedUrlError } = await event.context.supabase.storage
		// 	.from('inspection-photos')
		// 	.createSignedUrl(filePath, 60 * 5); // URL valid for 1 hour

		// if (signedUrlError) {
		// 	console.error('createSignedUrl failed:', signedUrlError.message);
		// 	return signedUrlError;
		// }

		return { filePath };
	}
	catch (error: unknown) {
		console.log('ERROR:', error);
	}
});
