export default defineEventHandler(async (event) => {
	try {
		// const body = await readBody(event);
		const formData = await readMultipartFormData(event);

		console.log('formData:', formData);
		if (!formData || !formData.length) {
			throw new Error('No file uploaded');
		}

		const filePart = formData.find(part => part.name === 'file');

		if (!filePart || !filePart.data) {
			throw new Error('File not found in form data');
		}

		const filePath = `private/${Date.now()}`;
		const { error: uploadError } = await event.context.supabase.storage.from('inspection-photos')
			.upload(filePath, filePart.data, {
				contentType: filePart.type || 'image/jpeg',
			});
		if (uploadError) {
			console.error('Upload failed:', uploadError.message);
			return uploadError;
		}

		const { data, erorr: signedUrlError } = await event.context.supabase.storage
			.from('inspection-photos')
			.createSignedUrl(filePath, 60 * 60); // URL valid for 1 hour

		if (signedUrlError) {
			console.error('createSignedUrl failed:', signedUrlError.message);
			return signedUrlError;
		}

		return data;
	}
	catch (error: unknown) {
		console.log('ERROR:', error);
	}
});
