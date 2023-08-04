interface ItemClass {
  name: string;
  quantity: number;
}
export interface ItemPool {
  standard: ItemClass[];
  legacy: ItemClass[];
}
