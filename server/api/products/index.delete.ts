import { requireAdminUser } from '~/server/utils/user-management';

export default defineEventHandler(async (event) => {
  try {
    const { tenant } = await requireAdminUser(event);
    const body = await readBody(event);
    const ids = body?.ids as Array<number | string> | undefined;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw createError({ statusCode: 400, message: "An array of product IDs is required" });
    }

    const numericIds = ids
      .map((id) => (typeof id === "string" ? Number.parseInt(id, 10) : id))
      .filter((id) => Number.isFinite(id)) as number[];

    if (numericIds.length === 0) {
      throw createError({ statusCode: 400, message: "No valid product IDs provided" });
    }

    const supabase = event.context.supabase;

    // 1) Önce bağlı transactions kayıtlarını sil
    const { error: txnErr, count: txnCount } = await supabase
      .from("transactions")
      .delete({ count: "exact" })
      .eq("tenant_id", tenant.id)
      .in("product_id", numericIds);

    if (txnErr) {
      throw createError({
        statusCode: 500,
        message: `Failed to delete transactions: ${txnErr.message}`,
        data: { supabase: txnErr },
      });
    }

    // 2) Sonra bağlı fill_records kayıtlarını sil
    const { error: fillErr, count: fillCount } = await supabase
      .from("fill_records")
      .delete({ count: "exact" })
      .eq("tenant_id", tenant.id)
      .in("product_id", numericIds);

    if (fillErr) {
      throw createError({
        statusCode: 500,
        message: `Failed to delete fill records: ${fillErr.message}`,
        data: { supabase: fillErr },
      });
    }

    // 3) Sonra bağlı inspections kayıtlarını sil
    const { error: inspErr, count: inspCount } = await supabase
      .from("inspections")
      .delete({ count: "exact" })
      .eq("tenant_id", tenant.id)
      .in("fire_extinguisher_id", numericIds);

    if (inspErr) {
      throw createError({
        statusCode: 500,
        message: `Failed to delete inspections: ${inspErr.message}`,
        data: { supabase: inspErr },
      });
    }

    // 4) Sonra products'u sil
    const { data: deletedProducts, error: prodErr } = await supabase
      .from("products")
      .delete()
      .eq("tenant_id", tenant.id)
      .in("id", numericIds)
      .select(); // silinen satırları geri döndür

    if (prodErr) {
      throw createError({
        statusCode: 500,
        message: `Failed to delete products: ${prodErr.message}`,
        data: { supabase: prodErr },
      });
    }

    // 5) Silinen ürünlere bağlı location kayıtlarını sil
    const locationIds = Array.from(
      new Set(
        deletedProducts
          .map((product: { location: number | null }) => product.location)
          .filter((locationId: number | null): locationId is number => Number.isFinite(locationId))
      )
    );

    let locationsDeleted: number | null = null;
    if (locationIds.length > 0) {
      const { error: locationErr, count: locationCount } = await supabase
        .from("locations")
        .delete({ count: "exact" })
        .eq("tenant_id", tenant.id)
        .in("id", locationIds);

      if (locationErr) {
        throw createError({
          statusCode: 500,
          message: `Failed to delete locations: ${locationErr.message}`,
          data: { supabase: locationErr },
        });
      }

      locationsDeleted = locationCount ?? null;
    }

    return {
      message: "Products deleted successfully",
      transactionsDeleted: txnCount ?? null,
      fillRecordsDeleted: fillCount ?? null,
      inspectionsDeleted: inspCount ?? null,
      productsDeleted: deletedProducts.length,
      locationsDeleted,
      deleted: deletedProducts,
    };
  } catch (error: unknown) {
    console.error("[api/products DELETE] Error:", error);
    if (error instanceof Error) {
      throw createError({
        statusCode: (error as any).statusCode ?? 500,
        message: error.message,
        data: (error as any).data,
      });
    }
    throw createError({
      statusCode: 500,
      message: "Unknown error while deleting products",
    });
  }
});
