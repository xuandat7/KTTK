import { Inject, Injectable } from "@nestjs/common";

@Injectable()
class EntityFactory<T extends IEntity> {
  create(data: Partial<T>): T {
    return { ...data } as T;
  }
}
export { EntityFactory };