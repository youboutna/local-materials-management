/**
 * BoqDocument — Aggregate of BoqLines under a single context (project/tender/bid).
 */
import { BoqLine, BoqSource } from './BoqLine';

export interface BoqDocumentProps {
  source: BoqSource;
  contextId: string;
  lines: BoqLine[];
}

export class BoqDocument {
  private constructor(private readonly props: Readonly<BoqDocumentProps>) {}

  static create(props: BoqDocumentProps): BoqDocument {
    return new BoqDocument(props);
  }

  get source() { return this.props.source; }
  get contextId() { return this.props.contextId; }
  get lines() { return this.props.lines; }

  totalHt(): number {
    return this.props.lines.reduce((acc, l) => acc + l.totalHt, 0);
  }
  totalTtc(): number {
    return this.props.lines.reduce((acc, l) => acc + l.totalTtc, 0);
  }
}
