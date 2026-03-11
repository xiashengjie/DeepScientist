import * as React from 'react'

type DynamicOptions = {
  ssr?: boolean
  loading?: React.ComponentType | (() => React.ReactNode)
}

export default function dynamic<T extends React.ComponentType<any>>(
  loader: () => Promise<{ default: T } | T>,
  options?: DynamicOptions
) {
  const LazyComponent = React.lazy(async () => {
    const resolved = await loader()
    if (resolved && typeof resolved === 'object' && 'default' in resolved) {
      return resolved as { default: T }
    }
    return { default: resolved as T }
  })

  const Loading = options?.loading

  return function DynamicComponent(props: React.ComponentProps<T>) {
    return (
      <React.Suspense fallback={Loading ? (typeof Loading === 'function' ? <>{Loading()}</> : <Loading />) : null}>
        <LazyComponent {...props} />
      </React.Suspense>
    )
  }
}
