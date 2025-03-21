import { IFactory } from "src/modules/common/factories/factory.interface";
import { Product } from "../entities/products.entity";

export class ProductFactory implements IFactory<Product> {
    create(data: any): Product {
        const product = new Product();
        product.name = data.name;
        product.description = data.description;
        product.price = data.price;
        product.attributes = data.attributes;
        return product;
    }
  
}