import { categories } from "./categories";
import { customers } from "./customers";
import { designReviews } from "./design-reviews";
import { orders } from "./orders";
import { products } from "./products";
import { rfqs } from "./rfqs";

/** Admin dashboard API — report section 4. Composition only; logic lives in the sibling files. */
export const admin = {
  products,
  categories,
  orders,
  rfqs,
  designReviews,
  customers,
};
