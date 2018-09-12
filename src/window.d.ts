// we must force tsc to interpret this file as a module, resolves
// "Augmentations for the global scope can only be directly nested in external modules or ambient module declarations."
// error
export {}

declare global {
  interface Window {
    obips: any
    obiprp: any
    PromptManager: any
    buildPromptCollectionFilterGivenPromptValues: (n: any, a: any, B: any) => any
  }
}
