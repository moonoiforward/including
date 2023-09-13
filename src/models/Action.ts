export class Action {
  url: string;
  model: string;
  query: any;
  select: string;
  method: string;
  body: any;
  headers: any;
  sessions: any;
  then: Action[];

  constructor(data: any) {
    this.url = data["url"];
    this.model = data["model"];
    this.query = data["query"];
    this.select = data["select"];
    this.method = data["method"];
    this.body = data["body"];
    this.sessions = data["sessions"];
    this.headers = data["headers"];
    if (data["then"]) {
      this.then = data["then"].map((item: any) => {
        return Action.fromJSON(item);
      });
    } else {
      this.then = [];
    }
  }

  static fromJSON(data: any) {
    return new Action(data);
  }
}
