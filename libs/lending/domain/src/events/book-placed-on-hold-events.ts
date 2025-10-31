import { PatronId } from "@library/lending/domain";
import { BookPlacedOnHold } from "./book-placed-on-hold";
import { MaximumNumberOnHoldsReached } from "./maximum-number-on-holds-reached";
import { PatronEvent } from "./patron-event";

export class BookPlacedOnHoldEvents implements PatronEvent {
  private constructor(
    public readonly patronId: PatronId,
    public readonly bookPlaceOnHold: BookPlacedOnHold,
    public readonly maximumNumberOnHoldsReached?: MaximumNumberOnHoldsReached,
  ) {}

  static event(patronId: PatronId, bookPlacedOnHold: BookPlacedOnHold) {
    return new BookPlacedOnHoldEvents(patronId, bookPlacedOnHold);
  }

  static events(
    patronId: PatronId,
    bookPlacedOnHold: BookPlacedOnHold,
    maximumNumberOnHoldsReached: MaximumNumberOnHoldsReached,
  ): BookPlacedOnHoldEvents {
    return new BookPlacedOnHoldEvents(
      patronId,
      bookPlacedOnHold,
      maximumNumberOnHoldsReached,
    );
  }
}
