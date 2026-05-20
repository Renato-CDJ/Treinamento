declare module "lodash.debounce" {
  type DebouncedFunc<T extends (...args: any[]) => any> = T & {
    cancel(): void
    flush(): void
  }

  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: {
      leading?: boolean
      maxWait?: number
      trailing?: boolean
    }
  ): DebouncedFunc<T>

  export default debounce
}
