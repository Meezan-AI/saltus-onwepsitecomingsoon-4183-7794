import { banners } from "./banners";
import { categories } from "./categories";
import { customers } from "./customers";
import { designReviews } from "./design-reviews";
import { orders } from "./orders";
import { products } from "./products";
import { productOptions } from "./product-options";
import { rfqs } from "./rfqs";
import { eventPlanItems, eventPlans } from "./event-plans";
import { suppliers } from "./suppliers";
import { roles } from "./roles";
import { auditLog } from "./audit-log";

/** Admin dashboard API — report section 4. Composition only; logic lives in the sibling files. */
export const admin = {
  products,
  banners,
  productOptions,
  categories,
  orders,
  rfqs,
  eventPlanItems,
  eventPlans,
  designReviews,
  customers,
  suppliers,
  roles,
  auditLog,
};
