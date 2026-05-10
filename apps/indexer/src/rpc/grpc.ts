export interface YellowstoneConfig {
  endpoint: string;
  xToken?: string;
}

export class YellowstoneStreamClient {
  constructor(private readonly config: YellowstoneConfig) {}

  describe(): string {
    return `yellowstone endpoint=${this.config.endpoint}`;
  }
}
