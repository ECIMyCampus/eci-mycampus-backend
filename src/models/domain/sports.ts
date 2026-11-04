export interface SportsFacilityProps {
  id?: string;
  code: string;
  name: string;
  sportTypes: string[];
  svgElementId: string;
  isActive: boolean;
}

export class SportsFacility {
  readonly id?: string;
  readonly code: string;
  readonly name: string;
  readonly sportTypes: string[];
  readonly svgElementId: string;
  readonly isActive: boolean;

  constructor(props: SportsFacilityProps) {
    this.id = props.id;
    this.code = props.code;
    this.name = props.name;
    this.sportTypes = [...props.sportTypes];
    this.svgElementId = props.svgElementId;
    this.isActive = props.isActive;
  }
}

