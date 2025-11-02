import { HoldDuration } from "@library/lending/domain";
import { Either } from "fp-ts/lib/Either";
import { AvailableBook } from "../book/available-book";
import { Patron } from "../patron";

export type PlacingOnHoldPolicy = (
  book: AvailableBook,
  patron: Patron,
  duration: HoldDuration,
) => Either<Rejection, Allowance>;

export class Rejection {
  private constructor(public readonly reason: string) {}

  static withReason(reason: string): Rejection {
    return new Rejection(reason);
  }
}

export class Allowance {}
