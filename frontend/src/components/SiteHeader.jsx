import Link from 'next/link'
import { Brand, ThemeToggle } from './Brand'
import './site-header.css'

const bookshelfItems = [
  { screen: 'home', href: '/', label: 'My bookshelf' },
  { screen: 'review', href: '/#revisit', label: 'Revisit' },
  { screen: 'play', href: '/#play-together', label: 'Play together' },
]

export default function SiteHeader({ current, onBookshelfScreen, reviewCount, account, mainId }) {
  return <>
    <a className="site-skip" href={'#' + mainId}>Skip to study space</a>
    <header className="site-header">
      <Link className="site-brand-link" href="/" aria-label="Lumitudy bookshelf home"><Brand /></Link>
      <nav className="site-nav" aria-label="Study navigation">
        <Link href="/study" aria-current={current === 'study' ? 'page' : undefined}>My textbooks</Link>
        {bookshelfItems.map(({ screen, href, label }) => {
          const selected = current === screen ? 'page' : undefined
          const content = <>{label}{screen === 'review' && reviewCount !== undefined && <span className="site-review-count">{reviewCount}</span>}</>
          return onBookshelfScreen
            ? <button key={screen} type="button" aria-current={selected} onClick={() => onBookshelfScreen(screen)}>{content}</button>
            : <Link key={screen} href={href} aria-current={selected}>{content}</Link>
        })}
      </nav>
      <div className="site-header-tools">
        {account}
        <ThemeToggle />
      </div>
    </header>
  </>
}
