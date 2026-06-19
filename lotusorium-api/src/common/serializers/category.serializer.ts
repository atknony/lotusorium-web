import { AttributeDefinition, Prisma } from '@prisma/client';

type CategoryWithAttributes = Prisma.CategoryGetPayload<{
  include: { attributes: true };
}>;

function mapFilterableAttribute(attr: AttributeDefinition) {
  return {
    key: attr.key,
    label: attr.label,
    dataType: attr.dataType,
    unit: attr.unit,
    options: attr.options,
  };
}

/** Public category shape, including its filterable attribute definitions. */
export function toPublicCategory(category: CategoryWithAttributes) {
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
    filterableAttributes: category.attributes
      .filter((a) => a.isFilterable)
      .map(mapFilterableAttribute),
  };
}
