import { PatronId } from "@library/lending/domain";
import { PatronEvent } from "./patron-event";

export class BookCheckedOut implements PatronEvent {
  constructor(public readonly patronId: PatronId) {}
}
