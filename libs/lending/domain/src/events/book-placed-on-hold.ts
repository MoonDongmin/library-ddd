import {
  BookId,
  DateVO,
  LibraryBranchId,
  PatronId,
} from "@library/lending/domain";
import { PatronEvent } from "./patron-event";

export class BookPlacedOnHold implements PatronEvent {
  constructor(
    public readonly patronId: PatronId,
    public readonly bookId: BookId,
    public readonly libraryBranchId: LibraryBranchId,
    public readonly till: DateVO | null,
  ) {}
}
