import { requireRole } from "@/lib/auth/permissions";
import { getCategories } from "@/features/admin/categories/queries";
import { CategoriesClient } from "./CategoriesClient";

export default async function CategoriesPage() {
  await requireRole("admin");
  // fetch all including inactive for admin view
  const categories = await getCategories(undefined, false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des catégories</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gérez les catégories de recettes et de charges
        </p>
      </div>
      <CategoriesClient categories={categories} />
    </div>
  );
}
