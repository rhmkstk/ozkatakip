
    export default defineEventHandler(async (event) => {
    try {
        const { data, error } = await event.context.supabase
            .from('fill_records')
            .select('*, products(brand, model_type, refill_date, next_refill_date, locations(*, building_id(*)))');

        if (error) {
            throw createError({
                statusCode: 500,
                message: error.message,
            });
        }

        return data;
    }
    catch (error: unknown) {
        console.error('ERROR:', error);
        if (error instanceof Error) {
            throw createError({
                statusCode: error.statusCode || 500,
                message: error.message,
            });
        }
        throw createError({
            statusCode: 500,
            message: 'An unknown error occurred',
        });
    }
})