export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);
		const filePath = `uploads/${Date.now()}`;
		const { error: uploadError } = await event.context.supabase.storage.from('inspection-photos')
			.upload(filePath, body.file);

		if (uploadError) {
			console.error('Upload failed:', uploadError.message);
			return uploadError;
		}

		const { data } = await event.context.supabase.storage
			.from('inspection-photos')
			.getPublicUrl(filePath);

		return data.publicUrl;
	}
	catch (error: unknown) {
		console.log('ERROR:', error);
	}
});
