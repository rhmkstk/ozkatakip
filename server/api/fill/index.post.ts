import { requireTenantContext, requireTenantProduct } from '~/server/utils/tenant';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const tenant = await requireTenantContext(event);

    if (!body?.product_id) {
      throw createError({
        statusCode: 400,
        message: 'product_id zorunludur',
      });
    }

    await requireTenantProduct(event, Number(body.product_id));

    const { data, error } = await event.context.supabase
      .from('fill_records')
      .insert({
        ...body,
        tenant_id: tenant.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error); // ✅ More info
      throw createError({
        statusCode: 500,
        message: error.message,
      });
    }

    return data;
  } catch (error: unknown) {
    console.error('Unexpected error:', error); // ✅ See full context
    if (error instanceof Error) {
      throw createError({
        statusCode: (error as any).statusCode || 500,
        message: error.message,
      });
    }
    throw createError({
      statusCode: 500,
      message: 'An unknown error occurred',
    });
  }
});
