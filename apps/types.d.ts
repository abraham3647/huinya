declare const process: {
  env: Record<string, string | undefined>;
  argv: string[];
  exitCode?: number;
};

declare module 'node:http' {
  export const createServer: any;
}

declare module 'node:url' {
  export const URL: any;
}

declare module 'kafkajs' {
  export const Kafka: any;
}

declare module 'neo4j-driver' {
  const neo4j: any;
  export default neo4j;
}
