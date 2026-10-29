import { categories } from "./categories";
import { customers } from "./customers";
import { designReviews } from "./design-reviews";
import { orders } from "./orders";
import { products } from "./products";
import { productOptions } from "./product-options";
import { rfqs } from "./rfqs";
import { suppliers } from "./suppliers";
import { roles } from "./roles";

/** Admin dashboard API — report section 4. Composition only; logic lives in the sibling files. */
export const admin = {
  products,
  productOptions,
  categories,
  orders,
  rfqs,
  designReviews,
  customers,
  suppliers,
  roles,
};
