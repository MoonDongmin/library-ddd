import { BookId, LibraryBranchId, PatronId } from "@library/lending/domain";
import { PatronEvent } from "./patron-event";

export class BookHoldCanceled implements PatronEvent {
  constructor(
    public readonly patronId: PatronId,
    public readonly bookId: BookId,
    public readonly libraryBranchId: LibraryBranchId,
  ) {}
}
