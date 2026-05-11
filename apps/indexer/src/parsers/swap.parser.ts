export interface SwapEvent {
  wallet: string;
  inputMint: string;
  outputMint: string;
  inputAmount: number;
  outputAmount: number;
  signature: string;
  slot: number;
}

export function isPotentialWashSwap(event: SwapEvent): boolean {
  return event.inputMint !== event.outputMint && event.inputAmount > 0 && event.outputAmount > 0;
}
