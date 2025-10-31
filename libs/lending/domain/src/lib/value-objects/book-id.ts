import { randomUUID } from "node:crypto";
import { Uuid } from "@library/shared/domain";

export class BookId extends Uuid {
  static generate(): BookId {
    return new BookId(randomUUID());
  }
}
