// server/api/storage/inspection-photos/[...path].get.ts
import { resolveTenantContext } from '~/server/utils/tenant';
import { getAdminClient } from '~/server/utils/user-management';

export default defineEventHandler(async (event) => {
	const pathParam = getRouterParam(event, 'path');
	const filePath = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;
	const tenant = await resolveTenantContext(event);
	const supabase = process.env.SUPABASE_SERVICE_KEY
		? await getAdminClient(event)
		: event.context.supabase;

	// const supa = event.context.supabase.storage.from('inspection-photos');

	// 2) updated_at'ı bul (klasör + dosya adı ayır)
	// const parts = filePath.split('/');
	// const fileName = parts.pop()!;
	// const prefix = parts.join('/');

	// const { data: list } = await supa.list(prefix || '', { search: fileName });
	// const obj = list?.find(f => f.name === fileName);
	// const lastModified = obj?.updated_at ? new Date(obj.updated_at).toUTCString() : undefined;

	// 3) If-Modified-Since kontrolü
	// const ims = getHeader(event, 'if-modified-since');
	// if (lastModified && ims && new Date(ims).getTime() >= new Date(lastModified).getTime()) {
	//   setHeader(event, 'Cache-Control', 'private, must-revalidate');
	//   setHeader(event, 'Last-Modified', lastModified);
	//   event.node.res.statusCode = 304;
	//   return null;
	// }

	// 4) Dosyayı indir ve döndür
	if (tenant && filePath && !filePath.startsWith(`${tenant.slug}/`) && !filePath.startsWith('private/')) {
		throw createError({ statusCode: 403, statusMessage: 'Bu dosya aktif tenant disinda' });
	}

	const { data, error } = await supabase.storage.from('inspection-photos').download(filePath);
	if (error) {
		throw createError({ statusCode: 404 });
	}

	// Kayit extension icermese bile upload sirasinda saklanan content-type ile resmi servis et.
	const lower = filePath?.toLowerCase();
	const mime = data.type
		|| (lower?.endsWith('.png')
			? 'image/png'
			: lower?.endsWith('.webp')
				? 'image/webp'
				: lower?.endsWith('.svg')
					? 'image/svg+xml'
					: lower?.endsWith('.jpg') || lower?.endsWith('.jpeg')
						? 'image/jpeg'
						: 'application/octet-stream');

	setHeader(event, 'Content-Type', mime);
	setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable');

	return data;
});
