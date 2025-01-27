import {
  LimitNode,
  OffsetNode,
  SelectQueryNode,
  ValueNode,
  type PluginTransformQueryArgs,
  type PluginTransformResultArgs,
} from 'kysely';

export class PaginatePlugin {
  constructor(private readonly page: { pn: number; ps: number }) {}
  transformQuery({ queryId, node }: PluginTransformQueryArgs) {
    if (SelectQueryNode.is(node)) {
      node = SelectQueryNode.cloneWithLimit(
        node,
        LimitNode.create(ValueNode.create(this.page.ps)),
      );
      node = SelectQueryNode.cloneWithOffset(
        node,
        OffsetNode.create(ValueNode.create((this.page.pn - 1) * this.page.ps)),
      );
    }
    return node;
  }
  async transformResult({ queryId, result }: PluginTransformResultArgs) {
    return result;
  }
}
export class FilterPlugin<
  T extends {
    [K in keyof FTables]: FTables[K] extends { filter: infer U }
      ? [table: K, filter: U]
      : never;
  }[keyof FTables],
> {
  constructor(...e: T) {
    throw new Error('Not implemented');
  }
  transformQuery({ queryId, node }: PluginTransformQueryArgs) {
    if (SelectQueryNode.is(node)) {
    }
    return node;
  }
  async transformResult({ queryId, result }: PluginTransformResultArgs) {
    return result;
  }
}
