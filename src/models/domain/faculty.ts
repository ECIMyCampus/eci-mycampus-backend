export interface FacultyProps {
  id?: string;
  name: string;
  slug: string;
  hexColor: string;
  isActive: boolean;
  createdAt?: Date;
}

export class Faculty {
  readonly id?: string;
  readonly name: string;
  readonly slug: string;
  readonly hexColor: string;
  readonly isActive: boolean;
  readonly createdAt?: Date;

  constructor(props: FacultyProps) {
    this.id = props.id;
    this.name = props.name;
    this.slug = props.slug;
    this.hexColor = props.hexColor;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
  }
}
