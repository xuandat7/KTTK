import { Product } from "../products/entities/products.entity";
import { Statistics } from "./entities/statistics.entity";

export interface IStatisticsCalculator {
  calculate(product: Product): Promise<Statistics>;
}
