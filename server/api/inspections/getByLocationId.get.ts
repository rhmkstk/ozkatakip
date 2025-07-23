export default defineEventHandler(async (event) => {
  try {
    const locationID = getQuery(event).location_id;

    if (!locationID) {
      throw createError({
        statusCode: 400,
        message: "Missing location_id parameter",
      });
    }

    const { data, error } = await event.context.supabase
      .from("inspections")
      .select(`created_at`)
      .eq("products.locations.location_id", locationID)
      .not("created_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(1).select(`
    created_at,
    products!inner(
      locations!inner(
        location_id
      )
    )
  `);

    console.log("data:", data);
    return data;
  } catch (error: unknown) {
    console.log("ERROR:", error);
    if (error instanceof Error) {
      throw createError({
        name: error.name,
        message: error.message,
      });
    }
    throw createError({
      statusCode: 500,
      message: "An unknown error occurred",
    });
  }
});
