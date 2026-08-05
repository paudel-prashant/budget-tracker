import { describe, expect, it } from "vitest";
import {
  buildTransactionListQuery,
  buildTransactionWhere,
  countActiveFilters,
  parseTransactionListParams,
} from "@/lib/domain/transaction-filters";

describe("parseTransactionListParams — tags", () => {
  it("parses repeated `tag` query params, trimmed and lowercased", () => {
    const params = new URLSearchParams();
    params.append("tag", "  Work  ");
    params.append("tag", "URGENT");
    const result = parseTransactionListParams(params);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.params.tags).toEqual(["work", "urgent"]);
    }
  });

  it("leaves tags undefined when none are provided", () => {
    const result = parseTransactionListParams(new URLSearchParams());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.params.tags).toBeUndefined();
    }
  });

  it("drops blank tag values", () => {
    const params = new URLSearchParams();
    params.append("tag", "   ");
    params.append("tag", "work");
    const result = parseTransactionListParams(params);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.params.tags).toEqual(["work"]);
    }
  });
});

describe("buildTransactionWhere — tags", () => {
  it("adds a hasSome clause when tags are present", () => {
    const where = buildTransactionWhere("user-1", { tags: ["work", "urgent"] });
    expect(where.tags).toEqual({ hasSome: ["work", "urgent"] });
  });

  it("omits the tags clause when no tags are given", () => {
    const where = buildTransactionWhere("user-1", {});
    expect(where.tags).toBeUndefined();
  });

  it("still scopes to the given userId", () => {
    const where = buildTransactionWhere("user-1", {});
    expect(where.userId).toBe("user-1");
  });
});

describe("buildTransactionListQuery — tags", () => {
  it("serializes each tag as a repeated `tag` param", () => {
    const query = buildTransactionListQuery({
      page: 1,
      pageSize: 10,
      tags: ["work", "urgent"],
    });
    const params = new URLSearchParams(query);
    expect(params.getAll("tag")).toEqual(["work", "urgent"]);
  });

  it("omits `tag` entirely when there are no tags", () => {
    const query = buildTransactionListQuery({ page: 1, pageSize: 10 });
    const params = new URLSearchParams(query);
    expect(params.getAll("tag")).toEqual([]);
  });
});

describe("countActiveFilters — tags", () => {
  it("counts an active tag filter", () => {
    expect(countActiveFilters({ tags: ["work"] })).toBe(1);
  });

  it("does not count an empty tags array", () => {
    expect(countActiveFilters({ tags: [] })).toBe(0);
  });
});
