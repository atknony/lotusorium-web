import { AttributeDefinition, Prisma } from '@prisma/client';

type CategoryWithAttributes = Prisma.CategoryGetPayload<{
  include: { attributes: true };
}>;

function mapAttributeDefinition(attr: AttributeDefinition) {
  return {
    key: attr.key,
    label: attr.label,
    dataType: attr.dataType,
    unit: attr.unit,
    options: attr.options,
  };
}

/**
 * Public category shape. Exposes two attribute views, both ordered by the
 * admin's `sortOrder`:
 *  - `attributeDefinitions`: every definition, so the storefront can map a
 *    product's saved attribute keys back to human-readable labels/units on the
 *    detail page (independent of whether an attribute is filterable).
 *  - `filterableAttributes`: only the filterable subset, for the facet UI.
 */
export function toPublicCategory(category: CategoryWithAttributes) {
  const definitions = category.attributes.map(mapAttributeDefinition);
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    seo: {
      metaTitle: category.metaTitle,
      metaDescription: category.metaDescription,
      ogImage: category.ogImage,
      canonicalUrl: category.canonicalUrl,
    },
    attributeDefinitions: definitions,
    filterableAttributes: category.attributes
      .filter((a) => a.isFilterable)
      .map(mapAttributeDefinition),
  };
}
