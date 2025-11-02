import { BookId, LibraryBranchId } from "@library/lending/domain";
import { Version } from "../../../../../shared/domain/src/lib/aggregates/version";
import { BookPlacedOnHold } from "../../events/book-placed-on-hold";
import { Book } from "./book";
import { BookOnHold } from "./book-on-hold";

export class AvailableBook implements Book {
  constructor(
    public readonly bookId: BookId,
    public readonly libraryBranchId: LibraryBranchId,
    public readonly version: Version,
  ) {}

  handleBookPlacedOnHold(bookPlacedOnHold: BookPlacedOnHold): BookOnHold {
    return new BookOnHold(
      this.bookId,
      this.libraryBranchId,
      bookPlacedOnHold.patronId,
      this.version,
    );
  }
}
