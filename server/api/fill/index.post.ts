export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    const { data, error } = await event.context.supabase
      .from('fill_records')
      .insert(body)
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
