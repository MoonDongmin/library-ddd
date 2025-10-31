import { PatronId } from "@library/lending/domain";
import { PatronEvent } from "./patron-event";

export class BookHoldCancelingFailed implements PatronEvent {
  constructor(public readonly patronId: PatronId) {}
}
