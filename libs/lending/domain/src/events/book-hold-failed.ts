import { PatronId } from "@library/lending/domain";
import { Rejection } from "../policies/placing-on-hold-policy";
import { PatronEvent } from "./patron-event";

export class BookHoldFailed implements PatronEvent {
  constructor(
    public readonly reason: string,
    public readonly patronId: PatronId,
  ) {}

  static bookHoldFailed(
    rejection: Rejection,
    patronId: PatronId,
  ): BookHoldFailed {
    return new BookHoldFailed(rejection.reason, patronId);
  }
}
