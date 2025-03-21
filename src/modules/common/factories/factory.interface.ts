export interface IFactory<T> {
  create(data: any): T;

}
