import { randomUUID } from "node:crypto";
import { Uuid } from "@library/shared/domain";

export class LibraryBranchId extends Uuid {
  static generate(): LibraryBranchId {
    return new LibraryBranchId(randomUUID());
  }
}
