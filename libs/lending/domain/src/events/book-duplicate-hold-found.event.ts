import { BookId, PatronId } from "@library/lending/domain";

export class BookDuplicateHoldFoundEvent {
  constructor(
    public readonly bookId: BookId,
    public readonly secondPatronId: PatronId,
  ) {}
}
