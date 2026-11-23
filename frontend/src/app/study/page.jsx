import App from '../../App'
import { AeroBackdrop } from '../../components/Brand'
import '../../study.css'

export const metadata = { title: 'My textbooks' }

export default async function StudyPage({ searchParams }) {
  const { intent } = await searchParams

  return <><AeroBackdrop /><App uploadIntent={intent === 'upload'} /></>
}
