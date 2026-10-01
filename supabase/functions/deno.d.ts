/**
 * Ambient type definitions for the Deno runtime in Supabase Edge Functions.
 *
 * Supabase Edge Functions execute in a cloud Deno environment where the `Deno`
 * global namespace is provided automatically at runtime.
 *
 * This file provides IDE IntelliSense and silences TypeScript warnings
 * (e.g. "Cannot find name 'Deno'") in editors when the Deno VS Code extension
 * is not installed or active.
 */

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): Record<string, string>;
  }

  export const env: Env;

  export interface ConnectOptions {
    hostname: string;
    port: number;
    transport?: "tcp";
  }

  export interface ConnectTlsOptions {
    hostname: string;
    port: number;
    caCerts?: string[];
    certFile?: string;
    keyFile?: string;
  }

  export interface Conn {
    readonly localAddr?: unknown;
    readonly remoteAddr?: unknown;
    readonly rid?: number;
    read(p: Uint8Array): Promise<number | null>;
    write(p: Uint8Array): Promise<number>;
    close(): void;
  }

  export function connect(options: ConnectOptions): Promise<Conn>;
  export function connectTls(options: ConnectTlsOptions): Promise<Conn>;
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
    options?: { port?: number; hostname?: string; signal?: AbortSignal }
  ): void;
}

declare module "https://*" {
  const content: any;
  export default content;
  export const serve: any;
  export const createClient: any;
}
