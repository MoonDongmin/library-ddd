import { BookId, LibraryBranchId, PatronId } from "@library/lending/domain";
import { Version } from "../../../../../shared/domain/src/lib/aggregates/version";
import { BookHoldCanceled } from "../../events/book-hold-canceled";
import { AvailableBook } from "./available-book";
import { Book } from "./book";

export class BookOnHold implements Book {
  constructor(
    private readonly bookId: BookId,
    private readonly libraryBranchId: LibraryBranchId,
    private readonly patronId: PatronId,
    public readonly version: Version,
  ) {}

  by(patronId: PatronId): boolean {
    return this.patronId.equals(patronId);
  }

  handleHoldCanceled(holdCanceled: BookHoldCanceled): AvailableBook {
    return new AvailableBook(
      this.bookId,
      holdCanceled.libraryBranchId,
      this.version,
    );
  }
}
