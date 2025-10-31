import * as React from 'react'
import { Link, type InertiaLinkProps } from '@inertiajs/react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export function Pagination(props: React.ComponentProps<'nav'>) {
  const { className, ...rest } = props
  return <nav aria-label="pagination" className={cn('mx-auto flex w-full justify-center', className)} {...rest} />
}

export function PaginationContent(props: React.ComponentProps<'ul'>) {
  const { className, ...rest } = props
  return <ul className={cn('flex items-center gap-1', className)} {...rest} />
}

export function PaginationItem(props: React.ComponentProps<'li'>) {
  const { className, ...rest } = props
  return <li className={cn('', className)} {...rest} />
}

type PaginationLinkProps = Omit<React.ComponentProps<typeof Link>, 'href'> & {
  href?: InertiaLinkProps['href'] | null
  isActive?: boolean
  btnSize?: 'default' | 'sm' | 'lg'
}

export function PaginationLink(props: PaginationLinkProps) {
  const { className, href, isActive, btnSize = 'default', ...rest } = props
  const disabled = !href
  const Comp: any = disabled ? 'span' : Link
  return (
    <Comp
      aria-current={isActive ? 'page' : undefined}
      href={disabled ? undefined : (href as InertiaLinkProps['href'])}
      className={cn(
        buttonVariants({ variant: isActive ? 'default' : 'outline', size: btnSize }),
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      aria-disabled={disabled || undefined}
      {...rest}
    />
  )
}

// Laravel-style pagination link - simpler text-based style
export function LaravelPaginationLink(props: PaginationLinkProps) {
  const { className, href, isActive, ...rest } = props
  const disabled = !href
  const Comp: any = disabled ? 'span' : Link
  return (
    <Comp
      aria-current={isActive ? 'page' : undefined}
      href={disabled ? undefined : (href as InertiaLinkProps['href'])}
      className={cn(
        'inline-flex h-10 min-w-[2.5rem] items-center justify-center px-3 text-sm font-medium text-foreground transition-colors',
        'hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        isActive && 'bg-primary text-primary-foreground hover:bg-primary',
        disabled && 'pointer-events-none opacity-40',
        className
      )}
      aria-disabled={disabled || undefined}
      {...rest}
    />
  )
}

export function PaginationPrevious(props: Omit<PaginationLinkProps, 'children'>) {
  const { className, btnSize = 'sm', ...rest } = props
  return (
    <PaginationLink
      {...rest}
      btnSize={btnSize}
      className={cn(buttonVariants({ variant: 'outline', size: btnSize }), className)}
    >
      <ChevronLeft className="mr-1 h-4 w-4" />
      <span className="sr-only">Previous</span>
    </PaginationLink>
  )
}

export function PaginationNext(props: Omit<PaginationLinkProps, 'children'>) {
  const { className, btnSize = 'sm', ...rest } = props
  return (
    <PaginationLink
      {...rest}
      btnSize={btnSize}
      className={cn(buttonVariants({ variant: 'outline', size: btnSize }), className)}
    >
      <ChevronRight className="h-4 w-4" />
      <span className="sr-only">Next</span>
    </PaginationLink>
  )
}

// Laravel-style pagination Previous button
export function LaravelPaginationPrevious(props: Omit<PaginationLinkProps, 'children'>) {
  const { className, href, ...rest } = props
  const disabled = !href
  const Comp: any = disabled ? 'span' : Link

  return (
    <Comp
      href={disabled ? undefined : (href as InertiaLinkProps['href'])}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-l-full text-muted-foreground transition-colors',
        'hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'border-r border-border',
        disabled && 'pointer-events-none opacity-40',
        className
      )}
      aria-disabled={disabled || undefined}
      {...rest}
    >
      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">Previous</span>
    </Comp>
  )
}

// Laravel-style pagination Next button
export function LaravelPaginationNext(props: Omit<PaginationLinkProps, 'children'>) {
  const { className, href, ...rest } = props
  const disabled = !href
  const Comp: any = disabled ? 'span' : Link

  return (
    <Comp
      href={disabled ? undefined : (href as InertiaLinkProps['href'])}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-r-full text-muted-foreground transition-colors',
        'hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'border-l border-border',
        disabled && 'pointer-events-none opacity-40',
        className
      )}
      aria-disabled={disabled || undefined}
      {...rest}
    >
      <span className="sr-only">Next</span>
      <ChevronRight className="h-5 w-5" aria-hidden="true" />
    </Comp>
  )
}

export function PaginationEllipsis(props: React.ComponentProps<'span'>) {
  const { className, ...rest } = props
  return (
    <span
      className={cn('inline-flex h-9 w-9 items-center justify-center text-muted-foreground', className)}
      {...rest}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

/**
 * Laravel pagination link structure
 * Each link has a url (null for disabled links), label (page number or "Previous"/"Next"/"..."), and active state
 */
type LaravelLink = { url: string | null; label: string; active?: boolean }

interface InertiaPaginationProps {
  from?: number
  to?: number
  total?: number
  links?: LaravelLink[]
  currentPage?: number
  lastPage?: number
  buildHref?: (page: number) => InertiaLinkProps['href'] | null
  size?: 'sm' | 'default' | 'lg'
  className?: string
  siblingCount?: number
  boundaryCount?: number
}

export function InertiaPagination({
  from,
  to,
  total,
  links,
  currentPage,
  lastPage,
  buildHref,
  size = 'sm',
  className,
  siblingCount = 1,
  boundaryCount = 1,
}: InertiaPaginationProps) {
  const hasLinks = Array.isArray(links) && links.length >= 2
  const show = hasLinks || (currentPage && lastPage && lastPage > 1)
  if (!show) return null

  const prevHref = hasLinks ? links![0]?.url : currentPage && buildHref ? buildHref(Math.max(1, currentPage - 1)) : null
  const nextHref = hasLinks && links ? links[links.length - 1]?.url : currentPage && lastPage && buildHref ? buildHref(Math.min(lastPage, currentPage + 1)) : null

  const renderLinks = () => {
    let isFirstPageLink = true
    if (hasLinks && links) {
      return links.map((link, index) => {
        // Skip first (Previous) and last (Next) links as they're handled separately
        if (index === 0 || index === links.length - 1) return null

        // Check if this is an ellipsis - Laravel uses "..." for pagination gaps
        const isEllipsis = link.label.includes('...') || link.label.includes('…')

        if (isEllipsis) {
          return (
            <span
              key={`${link.label}-${index}`}
              className="inline-flex h-10 min-w-[2.5rem] items-center justify-center border-l border-border px-3 text-sm font-medium text-muted-foreground"
            >
              <MoreHorizontal className="h-5 w-5" />
            </span>
          )
        }

        const pageEl = (
          <LaravelPaginationLink
            key={`${link.label}-${index}`}
            href={link.url}
            isActive={!!link.active}
            className={cn('border-l border-border', isFirstPageLink && 'border-l-0')}
          >
            {link.label}
          </LaravelPaginationLink>
        )

        if (isFirstPageLink) isFirstPageLink = false
        return pageEl
      })
    }

    if (currentPage && lastPage && buildHref) {
      // Laravel-like windowed pagination with ellipses
      const pages: (number | 'ellipsis')[] = []
      const startPages = Array.from({ length: Math.min(boundaryCount, lastPage) }, (_, i) => i + 1)
      const endPages = Array.from({ length: Math.min(boundaryCount, lastPage) }, (_, i) => lastPage - i).reverse()
      const start = Math.max(
        Math.min(
          // ensure the window is always inside [1, lastPage]
          currentPage - siblingCount,
          lastPage - boundaryCount - siblingCount * 2 - 1
        ),
        boundaryCount + 2
      )
      const end = Math.min(
        Math.max(currentPage + siblingCount, boundaryCount + siblingCount * 2 + 2),
        lastPage - boundaryCount - 1
      )

      const middlePages = start <= end ? Array.from({ length: end - start + 1 }, (_, i) => start + i) : []

      // Merge with ellipses
      pages.push(...startPages)
      if (start > boundaryCount + 2) pages.push('ellipsis')
      if (start === boundaryCount + 2) pages.push(boundaryCount + 2 - 1)
      pages.push(...middlePages)
      if (end < lastPage - boundaryCount - 1) pages.push('ellipsis')
      if (end === lastPage - boundaryCount - 1) pages.push(lastPage - boundaryCount - 1 + 1)
      pages.push(...endPages)

      let isFirstGenerated = true
      return pages.map((p, idx) => {
        if (p === 'ellipsis') {
          return (
            <span
              key={`${p}-${idx}`}
              className="inline-flex h-10 min-w-[2.5rem] items-center justify-center border-l border-border px-3 text-sm font-medium text-muted-foreground"
            >
              <MoreHorizontal className="h-5 w-5" />
            </span>
          )
        }

        const pageEl = (
          <LaravelPaginationLink
            key={`${p}-${idx}`}
            href={buildHref(p as number)}
            isActive={currentPage === p}
            className={cn('border-l border-border', isFirstGenerated && 'border-l-0')}
          >
            {p}
          </LaravelPaginationLink>
        )
        if (isFirstGenerated) isFirstGenerated = false
        return pageEl
      })
    }
    return null
  }

  return (
    <div className={cn('mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      {typeof total !== 'undefined' && (
        <div className="hidden sm:block text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{from || 1}</span> to{' '}
          <span className="font-semibold text-foreground">{to || total}</span> of{' '}
          <span className="font-semibold text-foreground">{total}</span>
          {currentPage && lastPage ? (
            <span className="ml-2 text-xs text-muted-foreground">(Page {currentPage} of {lastPage})</span>
          ) : null}
        </div>
      )}

      {/* Mobile: compact controls */}
      <div className="flex items-center justify-between sm:hidden">
        <PaginationPrevious href={prevHref} btnSize="sm" />
        {currentPage && lastPage ? (
          <span className="text-sm text-muted-foreground">Page {currentPage} of {lastPage}</span>
        ) : (
          <span className="text-sm text-muted-foreground">Pagination</span>
        )}
        <PaginationNext href={nextHref} btnSize="sm" />
      </div>

      {/* Desktop: Laravel-style pagination */}
      <div className="hidden sm:block">
        <nav
          className="inline-flex items-center overflow-hidden rounded-full border border-border bg-background shadow-sm"
          aria-label="Pagination"
        >
          <LaravelPaginationPrevious href={prevHref} />
          {renderLinks()}
          <LaravelPaginationNext href={nextHref} />
        </nav>
      </div>
    </div>
  )
}


