export default defineEventHandler(async (event) => {
    try{
        const rangeStartDate= getQuery(event).start_date;
        const rangeEndDate= getQuery(event).end_date;

        if (!rangeStartDate || !rangeEndDate) {
            throw createError({
                statusCode: 400,
                message: 'Missing start_date or end_date parameter',
            });
        }
        console.log('Start Date:', rangeStartDate);
        console.log('End Date:', rangeEndDate);

        const {data}= await event.context.supabase
        .from('products')
        .select('*, locations(*, building_id(*))')
        .gte('next_refill_date', rangeStartDate)
        .lte('next_refill_date', rangeEndDate)
        .order('next_refill_date', { ascending: true });
        console.log('got the products in specified date range:', data);
        return data;
    }
    catch (error: unknown) {
        console.log('ERROR:', error);
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
})