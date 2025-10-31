import { randomUUID } from "node:crypto";
import { Uuid } from "@library/shared/domain";

export class PatronId extends Uuid {
  static generate(): PatronId {
    return new PatronId(randomUUID());
  }
}
