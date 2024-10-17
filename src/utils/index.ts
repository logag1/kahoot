export namespace Utilities {
  export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  export function randomStr(): string {
    return Math.random().toString(36).slice(2);
  }
}