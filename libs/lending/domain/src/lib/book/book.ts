import { BookId } from "@library/lending/domain";
import { Version } from "../../../../../shared/domain/src/lib/aggregates/version";

export interface Book {
  bookId: BookId;
  version: Version;
}
