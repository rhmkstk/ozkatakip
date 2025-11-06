export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const ids = body?.ids as string[] | undefined;

  if (!Array.isArray(ids) || ids.length === 0) {
    throw createError({ statusCode: 400, message: "An array of product IDs is required" });
  }

  // 1) Önce bağlı inspections kayıtlarını sil
  const { error: inspErr, count: inspCount } = await event.context.supabase
    .from("inspections")
    .delete({ count: "exact" })
    .in("fire_extinguisher_id", ids);

  if (inspErr) {
    throw createError({ statusCode: 500, message: `Failed to delete inspections: ${inspErr.message}` });
  }

  // 2) Sonra products'u sil
  const { data: deletedProducts, error: prodErr } = await event.context.supabase
    .from("products")
    .delete()
    .in("id", ids)
    .select(); // silinen satırları geri döndür

  if (prodErr) {
    throw createError({ statusCode: 500, message: `Failed to delete products: ${prodErr.message}` });
  }

  return {
    message: "Products deleted successfully",
    inspectionsDeleted: inspCount ?? null,
    productsDeleted: deletedProducts.length,
    deleted: deletedProducts,
  };
});
