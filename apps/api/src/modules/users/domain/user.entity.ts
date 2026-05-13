export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly createdAt: Date,
  ) {}

  static create(props: { id: string; email: string; name: string }): User {
    return new User(props.id, props.email.toLowerCase().trim(), props.name.trim(), new Date());
  }
}
